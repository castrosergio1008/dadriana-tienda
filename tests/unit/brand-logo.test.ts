import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const MAX_DERIVATIVE_BYTES = 40 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const EXPECTED_ORIGINAL_SHA256 =
  '7757238ad4de453f65ba0efa545b7b4d8c5faa75e3a80d2326de73d37819e980';
const EXPECTED_LOGO_SHA256 =
  '72cea2ec1d5858c1ca527135176752f993823bead7a00003b52ab18cc74de441';
const EXPECTED_ICON_SHA256 =
  '321961236cd8f6180459f186c65afac6498b771fdc0884b17c8efc1f0e1bf7ac';

function pngHeader(relativePath: string): Buffer {
  const bytes = readFileSync(join(ROOT, relativePath));

  expect(bytes.subarray(0, 8)).toEqual(PNG_SIGNATURE);
  expect(bytes.toString('ascii', 12, 16)).toBe('IHDR');

  return bytes;
}

function sha256(relativePath: string): string {
  return createHash('sha256').update(readFileSync(join(ROOT, relativePath))).digest('hex');
}

describe('brand logo derivatives (C-HOME-02)', () => {
  it.each([
    { path: 'public/brand/logo.png', width: 96, height: 96 },
    { path: 'app/icon.png', width: 64, height: 64 },
  ])(
    '$path has the approved $width x $height IHDR and stays under 40 KB',
    ({ path, width, height }) => {
      const header = pngHeader(path);

      expect(header.readUInt32BE(16)).toBe(width);
      expect(header.readUInt32BE(20)).toBe(height);
      expect(statSync(join(ROOT, path)).size).toBeLessThan(MAX_DERIVATIVE_BYTES);
    },
  );

  it('keeps the untouched client original in the repository root', () => {
    const original = 'logo_dadriana.png';

    expect(statSync(join(ROOT, original)).isFile()).toBe(true);
    expect(sha256(original)).toBe(EXPECTED_ORIGINAL_SHA256);
    expect(sha256('public/brand/logo.png')).toBe(EXPECTED_LOGO_SHA256);
    expect(sha256('app/icon.png')).toBe(EXPECTED_ICON_SHA256);
  });
});
