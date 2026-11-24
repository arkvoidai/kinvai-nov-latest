import type { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../services/supabaseAdmin.ts';

/**
 * Verifies the caller via Supabase Bearer access token and checks `profiles.is_admin === true`.
 * Rejects every unauthenticated, invalid, unconfigured, or non-admin caller with HTTP 404
 * so private admin API endpoints reveal nothing to non-admins.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }

  try {
    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !userData?.user?.id) {
      res.status(404).json({ error: 'Not found.' });
      return;
    }

    const userId = userData.user.id;
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile || profile.is_admin !== true) {
      res.status(404).json({ error: 'Not found.' });
      return;
    }

    res.locals.adminUserId = userId;
    next();
  } catch {
    res.status(404).json({ error: 'Not found.' });
  }
}
