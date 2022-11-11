import QRCode from "qrcode";
import path from "path";


await QRCode.toFile(process.argv[3] + '.svg', process.argv[2]);
