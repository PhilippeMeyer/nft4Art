import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let res = await QRCode.toFile(path.join(__dirname, 'etherAddr.png'), '0x2f1644FE81AEA69d4849D5bc8F64e8196C71B752');
