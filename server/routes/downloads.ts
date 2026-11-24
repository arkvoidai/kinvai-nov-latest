import { Router, type Request, type Response } from 'express';
import { getSupabaseAdmin } from '../services/supabaseAdmin.ts';

export const downloadsRouter = Router();

interface ActiveProductFileRow {
  id: string;
  product_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  version: string | null;
}

/**
 * GET /api/download/:productId (optional ?fileId=<uuid>)
 *
 * 1. Verifies Supabase Bearer JWT via service-role auth.getUser(token).
 * 2. Verifies an active entitlement (`revoked_at IS NULL`) for `(user_id, product_id)`.
 * 3. Loads active `product_files` for the product (never exposing `storage_path`).
 * 4. If multiple files exist and no `fileId` is provided, returns `{ mode: 'multiple', files: [...] }`.
 * 5. Otherwise generates a short-lived signed URL from private bucket `product-files`,
 *    records a best-effort entry in `download_logs`, and returns `{ mode: 'single', url, file, expiresIn }`.
 */
downloadsRouter.get('/:productId', async (req: Request, res: Response) => {
  const productId = (req.params.productId || '').trim();
  const requestedFileId =
    typeof req.query.fileId === 'string' ? req.query.fileId.trim() : '';

  if (!productId) {
    res.status(400).json({ error: 'Product identifier is required.' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Please sign in to download your files.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(401).json({ error: 'Please sign in to download your files.' });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(503).json({
      error: 'Download service is not configured yet. Please try again shortly.',
    });
    return;
  }

  try {
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user?.id) {
      res.status(401).json({ error: 'Your session expired. Sign in again to download.' });
      return;
    }

    const userId = userData.user.id;

    // Verify active entitlement (revoked_at IS NULL)
    const { data: entitlement, error: entError } = await supabaseAdmin
      .from('entitlements')
      .select('product_id, order_id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .is('revoked_at', null)
      .maybeSingle();

    if (entError) {
      res.status(500).json({ error: 'Could not verify your licence right now. Please retry.' });
      return;
    }

    if (!entitlement) {
      res.status(403).json({ error: 'Download access is not active for this product.' });
      return;
    }

    const { data: fileRows, error: filesError } = await supabaseAdmin
      .from('product_files')
      .select('id, product_id, storage_path, file_name, mime_type, size_bytes, version')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('file_name', { ascending: true });

    if (filesError) {
      res.status(500).json({ error: 'Could not prepare your files. Please try again.' });
      return;
    }

    const files = (fileRows ?? []) as ActiveProductFileRow[];
    if (files.length === 0) {
      res.status(404).json({ error: 'No downloadable files are attached to this product yet.' });
      return;
    }

    // Multi-file manifest when no specific fileId requested
    if (!requestedFileId && files.length > 1) {
      res.status(200).json({
        mode: 'multiple',
        files: files.map((f) => ({
          id: f.id,
          product_id: f.product_id,
          file_name: f.file_name,
          mime_type: f.mime_type,
          size_bytes: f.size_bytes,
          version: f.version,
        })),
      });
      return;
    }

    const targetFile = requestedFileId
      ? files.find((f) => f.id === requestedFileId)
      : files[0];

    if (!targetFile) {
      res.status(404).json({ error: 'That file is no longer available for download.' });
      return;
    }

    const expiresInSeconds = 120;
    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('product-files')
      .createSignedUrl(targetFile.storage_path, expiresInSeconds, {
        download: targetFile.file_name,
      });

    if (signedError || !signedData?.signedUrl) {
      res.status(500).json({ error: 'Could not generate a download link. Please try again.' });
      return;
    }

    // Best-effort download log (never fails the user's legitimate download)
    try {
      await supabaseAdmin.from('download_logs').insert({
        user_id: userId,
        product_id: productId,
        file_id: targetFile.id,
      });
    } catch {
      // Ignore schema/logging mismatches silently
    }

    res.status(200).json({
      mode: 'single',
      url: signedData.signedUrl,
      expiresIn: expiresInSeconds,
      file: {
        id: targetFile.id,
        product_id: targetFile.product_id,
        file_name: targetFile.file_name,
        mime_type: targetFile.mime_type,
        size_bytes: targetFile.size_bytes,
        version: targetFile.version,
      },
    });
  } catch {
    res.status(500).json({
      error: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
    });
  }
});
