import QRCode from "qrcode";
import path from "path";


await QRCode.toFile(process.argv[2] + '.png', process.argv[2]);
