import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(__dirname, '../data');
const RECEIPTS_DIR = path.join(DATA, 'receipts');

if (!fs.existsSync(RECEIPTS_DIR)) {
  fs.mkdirSync(RECEIPTS_DIR, { recursive: true });
}

// 1x1 white JPEG image in base64
const sampleJpgBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
fs.writeFileSync(path.join(RECEIPTS_DIR, 'rec_sample.jpg'), Buffer.from(sampleJpgBase64, 'base64'));
console.log('✓ Mock receipts created at', RECEIPTS_DIR);
