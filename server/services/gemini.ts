import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import { getServerSecrets } from '../lib/config.ts';

export const GEMINI_IMAGE_TIMEOUT_MS = 45_000;
export const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

export type GeminiErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVALID_INPUT'
  | 'TIMEOUT'
  | 'TEXT_ONLY_RESPONSE'
  | 'UPSTREAM_ERROR';

export class GeminiServiceError extends Error {
  readonly statusCode: number;
  readonly code: GeminiErrorCode;

  constructor(message: string, statusCode: number, code: GeminiErrorCode) {
    super(message);
    this.name = 'GeminiServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export interface GenerateCoverImageInput {
  prompt: string;
  model?: string;
  referenceImageBase64?: string;
  edit?: boolean;
}

export interface GenerateCoverImageResult {
  imageBase64: string;
  mimeType: string;
  modelUsed: string;
}

export interface ParsedInlineImage {
  data: string;
  mimeType: string;
}

/**
 * Strips optional data-URI prefix and validates a base64 reference image payload.
 */
export function parseBase64ImageInput(raw: string): ParsedInlineImage {
  const trimmed = raw.trim();
  const dataUriMatch = trimmed.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/i);
  if (dataUriMatch) {
    const rawMime = dataUriMatch[1].toLowerCase();
    const mimeType = rawMime === 'image/jpg' ? 'image/jpeg' : rawMime;
    const data = dataUriMatch[2].replace(/\s+/g, '');
    if (!data) {
      throw new GeminiServiceError('Reference image payload is empty.', 400, 'INVALID_INPUT');
    }
    return { data, mimeType };
  }

  const cleaned = trimmed.replace(/\s+/g, '');
  if (!/^[A-Za-z0-9+/=]+$/.test(cleaned) || cleaned.length < 16) {
    throw new GeminiServiceError(
      'Reference image must be valid base64 or a PNG/JPEG/WebP data URI.',
      400,
      'INVALID_INPUT'
    );
  }

  // Sniff magic bytes from base64 header when no data URI prefix is provided
  let mimeType = 'image/png';
  if (cleaned.startsWith('/9j/')) {
    mimeType = 'image/jpeg';
  } else if (cleaned.startsWith('UklGR')) {
    mimeType = 'image/webp';
  }

  return { data: cleaned, mimeType };
}

/**
 * Identifies transient network, timeout, rate-limit, or 5xx upstream failures eligible for 1 retry.
 */
export function isTransientGeminiError(err: unknown): boolean {
  if (err instanceof GeminiServiceError) {
    return err.code === 'TIMEOUT' || err.statusCode >= 500 || err.statusCode === 429;
  }
  if (!err || typeof err !== 'object') return false;

  const maybeStatus =
    (err as { status?: unknown; statusCode?: unknown }).status ??
    (err as { statusCode?: unknown }).statusCode;
  if (typeof maybeStatus === 'number' && (maybeStatus === 429 || maybeStatus >= 500)) {
    return true;
  }

  const msg = err instanceof Error ? err.message.toLowerCase() : String(err).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('econnreset') ||
    msg.includes('etimedout') ||
    msg.includes('fetch failed') ||
    msg.includes('unavailable') ||
    msg.includes('429') ||
    msg.includes('503') ||
    msg.includes('500')
  );
}

/**
 * Extracts the generated inline image from a Gemini GenerateContentResponse,
 * or returns any text explanation when the model refused/returned text only.
 */
export function extractImageFromResponse(response: GenerateContentResponse): {
  image?: { imageBase64: string; mimeType: string };
  textExplanation: string;
} {
  const candidates = response.candidates ?? [];
  const textParts: string[] = [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('image/')) {
        return {
          image: {
            imageBase64: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          },
          textExplanation: textParts.join(' ').trim(),
        };
      }
      if (typeof part.text === 'string' && part.text.trim()) {
        textParts.push(part.text.trim());
      }
    }
  }

  return {
    textExplanation: textParts.join(' ').trim(),
  };
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new GeminiServiceError(
              `Image generation timed out after ${Math.round(timeoutMs / 1000)} seconds. Please try again.`,
              504,
              'TIMEOUT'
            )
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Calls the Gemini image generation model server-side to render or edit a 4:5 cover.
 * Never persists anything to storage or database, and never logs GEMINI_API_KEY.
 */
export async function generateProductCoverImage(
  input: GenerateCoverImageInput,
  options?: { apiKeyOverride?: string; defaultModelOverride?: string; timeoutMs?: number }
): Promise<GenerateCoverImageResult> {
  const secrets = getServerSecrets();
  const apiKey = (options?.apiKeyOverride ?? secrets.geminiApiKey).trim();

  if (!apiKey) {
    throw new GeminiServiceError(
      'Gemini image generation is not configured on this server. Set GEMINI_API_KEY in Settings > Secrets.',
      503,
      'NOT_CONFIGURED'
    );
  }

  const prompt = input.prompt.trim();
  if (!prompt) {
    throw new GeminiServiceError('Image prompt is required.', 400, 'INVALID_INPUT');
  }

  const modelUsed = (
    input.model?.trim() ||
    options?.defaultModelOverride ||
    secrets.geminiImageModel ||
    DEFAULT_GEMINI_IMAGE_MODEL
  ).trim();

  const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

  if (input.referenceImageBase64) {
    const parsed = parseBase64ImageInput(input.referenceImageBase64);
    parts.push({
      inlineData: {
        data: parsed.data,
        mimeType: parsed.mimeType,
      },
    });
    const instructionPrefix = input.edit
      ? 'Edit the provided product still-life cover according to these instructions while preserving a clean 4:5 portrait studio composition with strictly no text, letters, numbers, or logos: '
      : 'Use the provided image as visual reference for lighting and restraint. Generate a fresh 4:5 portrait studio still-life render: ';
    parts.push({ text: `${instructionPrefix}${prompt}` });
  } else {
    parts.push({ text: prompt });
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const timeoutMs = options?.timeoutMs ?? GEMINI_IMAGE_TIMEOUT_MS;
  const maxAttempts = 2; // 1 initial attempt + 1 retry on transient errors

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await runWithTimeout(
        ai.models.generateContent({
          model: modelUsed,
          contents: [{ role: 'user', parts }],
          config: {
            responseModalities: ['TEXT', 'IMAGE'],
            imageConfig: {
              aspectRatio: '4:5',
            },
          },
        }),
        timeoutMs
      );

      const extracted = extractImageFromResponse(response);
      if (extracted.image) {
        return {
          imageBase64: extracted.image.imageBase64,
          mimeType: extracted.image.mimeType,
          modelUsed,
        };
      }

      const explanation = extracted.textExplanation
        ? ` Model explanation: "${extracted.textExplanation.slice(0, 400)}"`
        : ' No image data was returned by the model.';

      throw new GeminiServiceError(
        `Gemini returned text without an image.${explanation}`,
        422,
        'TEXT_ONLY_RESPONSE'
      );
    } catch (err) {
      lastError = err;
      if (err instanceof GeminiServiceError && !isTransientGeminiError(err)) {
        throw err;
      }
      if (attempt < maxAttempts && isTransientGeminiError(err)) {
        continue;
      }
      break;
    }
  }

  if (lastError instanceof GeminiServiceError) {
    throw lastError;
  }

  const safeMsg =
    lastError instanceof Error
      ? lastError.message.replace(apiKey, '[REDACTED]')
      : 'Unexpected error communicating with Gemini image service.';

  throw new GeminiServiceError(
    `Image generation failed: ${safeMsg}`,
    502,
    'UPSTREAM_ERROR'
  );
}
