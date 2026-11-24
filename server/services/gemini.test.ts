import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { GenerateContentResponse } from '@google/genai';
import {
  GeminiServiceError,
  extractImageFromResponse,
  generateProductCoverImage,
  isTransientGeminiError,
  parseBase64ImageInput,
} from './gemini.ts';

test('generateProductCoverImage throws clear NOT_CONFIGURED error when GEMINI_API_KEY is missing', async () => {
  await assert.rejects(
    async () => {
      await generateProductCoverImage(
        { prompt: 'Premium studio still-life product render.' },
        { apiKeyOverride: '' }
      );
    },
    (err: unknown) => {
      assert.ok(err instanceof GeminiServiceError);
      assert.equal(err.code, 'NOT_CONFIGURED');
      assert.equal(err.statusCode, 503);
      assert.match(err.message, /GEMINI_API_KEY/);
      return true;
    }
  );
});

test('parseBase64ImageInput strips data URI prefix and detects mime types', () => {
  const fromDataUri = parseBase64ImageInput('data:image/webp;base64,UklGRhIAAABXRUJQVlA4TAYAAAAv');
  assert.equal(fromDataUri.mimeType, 'image/webp');
  assert.equal(fromDataUri.data, 'UklGRhIAAABXRUJQVlA4TAYAAAAv');

  const fromRawJpeg = parseBase64ImageInput('/9j/4AAQSkZJRgABAQAAAQABAAD');
  assert.equal(fromRawJpeg.mimeType, 'image/jpeg');

  assert.throws(() => parseBase64ImageInput('not-valid!'), GeminiServiceError);
});

test('isTransientGeminiError distinguishes retryable upstream errors from client errors', () => {
  assert.equal(isTransientGeminiError(new GeminiServiceError('timeout', 504, 'TIMEOUT')), true);
  assert.equal(isTransientGeminiError(new GeminiServiceError('bad input', 400, 'INVALID_INPUT')), false);
  assert.equal(isTransientGeminiError(new GeminiServiceError('text only', 422, 'TEXT_ONLY_RESPONSE')), false);
  assert.equal(isTransientGeminiError({ status: 429 }), true);
  assert.equal(isTransientGeminiError({ status: 503 }), true);
  assert.equal(isTransientGeminiError({ status: 400 }), false);
});

test('extractImageFromResponse extracts inline image or returns text explanation', () => {
  const imageResp = {
    candidates: [
      {
        content: {
          parts: [
            { text: 'Rendered cover.' },
            { inlineData: { data: 'iVBORw0KGgo=', mimeType: 'image/png' } },
          ],
        },
      },
    ],
  } as unknown as GenerateContentResponse;

  const extractedImage = extractImageFromResponse(imageResp);
  assert.deepEqual(extractedImage.image, {
    imageBase64: 'iVBORw0KGgo=',
    mimeType: 'image/png',
  });

  const textOnlyResp = {
    candidates: [
      {
        content: {
          parts: [{ text: 'I cannot render copyrighted logos.' }],
        },
      },
    ],
  } as unknown as GenerateContentResponse;

  const extractedText = extractImageFromResponse(textOnlyResp);
  assert.equal(extractedText.image, undefined);
  assert.equal(extractedText.textExplanation, 'I cannot render copyrighted logos.');
});
