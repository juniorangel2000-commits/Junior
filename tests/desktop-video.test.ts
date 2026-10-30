import { createRequire } from 'node:module';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, expect, it } from 'vitest';
const { videoResponse } = createRequire(import.meta.url)('../desktop/video-response.cjs');
let dir: string, file: string;
beforeAll(async () => { dir = await mkdtemp(join(tmpdir(), 'rain-video-')); file = join(dir, 'clip.mp4'); await writeFile(file, '0123456789'); });
afterAll(async () => { await rm(dir, { recursive: true, force: true }); });
it('serves complete videos and their actual byte length', async () => {
 const response = await videoResponse(file, null);
 expect(response.status).toBe(200); expect(response.headers.get('content-type')).toBe('video/mp4');
 expect(response.headers.get('content-length')).toBe('10'); expect(await response.text()).toBe('0123456789');
});
it.each([['bytes=2-4','234','bytes 2-4/10'],['bytes=7-','789','bytes 7-9/10'],['bytes=-3','789','bytes 7-9/10'],['bytes=8-99','89','bytes 8-9/10']])('streams a valid media range %s', async (range, body, contentRange) => {
 const response = await videoResponse(file, range);
 expect(response.status).toBe(206); expect(response.headers.get('content-range')).toBe(contentRange); expect(await response.text()).toBe(body);
});
it.each(['bytes=99-','bytes=5-2','bytes=-0','bytes=0-1,4-5','bytes=-','nonsense'])('rejects invalid ranges %s', async range => {
 const response = await videoResponse(file, range); expect(response.status).toBe(416); expect(response.headers.get('content-range')).toBe('bytes */10');
});
