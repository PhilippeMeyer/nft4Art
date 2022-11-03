import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";
import { Wallet } from "ethers";
import QRCode from "qrcode";
import archiver from "archiver";

import { config } from "../../config.js"

const logo = config.galleryLogo;

async function generateWallets(req: Request, res: Response) {
    let nbWallets = 10;
    var wait_on = 0;                            // pdf files synchronization


    if (req.query.nbWallets !== undefined) nbWallets = parseInt(req.query.nbWallets as string);

    var env = new PDFDocument({
        size: [649.134, 323.15],
        autoFirstPage: false,
        margins: { top: 10, bottom: 10, right: 50, left: 50 },
    });
    var doc = new PDFDocument({ size: "A4", autoFirstPage: false });
    var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nft4Art"));
    const envFile = fs.createWriteStream(path.join(tmpDir, "enveloppes.pdf"));
    const docFile = fs.createWriteStream(path.join(tmpDir, "wallets.pdf"));
    const qrc = await QRCode.toFile(path.join(tmpDir, 'installationQRcode.png'), config.urlAppInstallation);
    
    envFile.on("finish", () => {
        fileWritten();
    });
    docFile.on("finish", () => {
        fileWritten();
    });
    env.pipe(envFile);
    doc.pipe(docFile);

    for (var i = 0; i < nbWallets; i++) {
        let w = Wallet.createRandom();

        let res = await QRCode.toFile(path.join(tmpDir, "addr" + i + ".png"), w.address);
        env.font("Helvetica").fontSize(10);
        env.addPage();
        env.image(logo, 20, 20, { width: 120 });
        env.image(path.join(tmpDir, "addr" + i + ".png"), 400, 30, {
            width: 200,
        });
        env.fontSize(10).text("Ethereum address:", 0, 240, { align: "right" });
        env.font("Courier").fontSize(10).text(w.address, { align: "right" });
        env.moveDown(2).text(i + '/' + nbWallets);

        doc.addPage();
        doc.image(logo, 20, 20, { width: 150 });
        doc.text(i + '/' + nbWallets);
        doc.moveDown(8);
        doc.font("Helvetica-Bold").fontSize(25).text("Your personnal Ethereum Paper Wallet");
        doc.moveDown(3);
        doc.font("Times-Roman").fontSize(12);
        doc.text(
            "Insert the mnemonic words below in any Ethereum compatible wallet to access your digital artwork by Thomas Julier. Treat this as a password and do not share it with anyone."
        );
        doc.moveDown(2);
        doc.font("Times-Bold").fontSize(12).text(w.mnemonic.phrase);
        doc.moveDown(2);
        doc.fontSize(12).text("The Ethereum address of this wallet is: ", { continued: true });
        doc.font("Courier").fontSize(12).text(w.address);
        let qr = await QRCode.toFile(path.join(tmpDir, "phrase" + i + ".png"), w.mnemonic.phrase);
        doc.moveDown(2);
        doc.font("Times-Roman").fontSize(12).text("For an overview and co-governance of the artwork, install the companion App scanning the QR code below:");
        doc.moveDown(2);
        doc.image(path.join(tmpDir, 'installationQRcode.png'), 200, 500, { width: 200 });
        doc.moveDown(2).text("And then, we running the companion app, scan the QR code below to insert your wallet");
        doc.image(path.join(tmpDir, "phrase" + i + ".png"), 200, 500, { width: 200 });
    }
    doc.end();
    env.end();

    //
    // fileWritten
    //
    // This is a callback on the write streams closing for the streams used by pdfkit.
    // This function is called when each stream is closing. A global variable ensures that the zip archive is produced only when the 2 files have been closed.
    //
    function fileWritten() {
        wait_on++;
        if (wait_on % 2 != 0) return;

        const archive = archiver("zip");
        archive.pipe(res);
        archive.on("error", function (err) {
            res.status(500).send({ error: err.message });
        });
        res.attachment("paperWallets.zip").type("zip");
        archive.on("finish", () => {
            res.status(200).end();
            fs.rmSync(tmpDir, { recursive: true });
        });
        archive.file(path.join(tmpDir, "enveloppes.pdf"), {
            name: "enveloppes.pdf",
        });
        archive.file(path.join(tmpDir, "wallets.pdf"), { name: "wallets.pdf" });
        archive.finalize();
    }
}

export { generateWallets };
