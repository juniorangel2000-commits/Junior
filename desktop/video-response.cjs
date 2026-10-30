const { stat } = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const { Readable } = require('node:stream');

/** Serve the requested bytes, so Chromium can buffer and seek local cinematics. */
async function videoResponse(file, range) {
  const { size } = await stat(file);
  const headers = new Headers({
    'Content-Type': file.toLowerCase().endsWith('.webm') ? 'video/webm' : 'video/mp4',
    'Accept-Ranges': 'bytes',
  });
  let start = 0, end = size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) return invalid();
    if (!match[1]) start = Math.max(0, size - Number(match[2]));
    else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= size) return invalid();
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
  }
  headers.set('Content-Length', String(Math.max(0, end - start + 1)));
  const stream = size ? Readable.toWeb(createReadStream(file, { start, end })) : null;
  return new Response(stream, { status: range ? 206 : 200, headers });
  function invalid() { return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } }); }
}
module.exports = { videoResponse };
