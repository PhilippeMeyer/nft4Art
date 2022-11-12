import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";
import { Wallet } from "ethers";
import QRCode from "qrcode";
import archiver from "archiver";
import { loadWallet } from './signin.js'
import { config } from "../../config.js"
import { logger } from "../../loggerConfiguration.js";

const logo = config.applicationLogo;
const fontBold = './public/Hershey-Noailles-Times-Simplex-Bold.ttf'
const font = './public/Hershey-Noailles-Times-Simplex-Regular.ttf'

async function createWallet(req: Request, res: Response) {
    var wait_on = 0;                            // pdf files synchronization
    console.log(req.body);
    if(req.body.password === undefined) {
        logger.info('server.createWallet.noPassword');
        res.status(400).send({error:{ name:"noPassword", message:"No password specified for wallet creation"}});
        return;
    }
    if (fs.existsSync(config.walletFileName)) {
        logger.info('server.createWallet.attemptToreplaceWallet');
        res.status(403).send({error:{ name:"alreadyWallet", message:"A wallet already exists"}});
        return;
    }

    let w = Wallet.createRandom();
    w.encrypt(req.body.password).then((jsonWallet) => {
        fs.writeFileSync(config.walletFileName, jsonWallet);
    });

    var env = new PDFDocument({
        size: [649.134, 323.15],
        autoFirstPage: false,
        margins: { top: 10, bottom: 10, right: 50, left: 50 },
    });
    var doc = new PDFDocument({ size: "A4", autoFirstPage: false, margins: { top: 72, bottom: 72, left: 72, right: 50 } });
    const widthDoc = ((21 / 2.54) * 72) - (50 + 72)
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

    doc.registerFont('font', font);
    doc.registerFont('fontBold', fontBold);
    env.registerFont('font', font);
    env.registerFont('fontBold', fontBold);

    let x,y; 
    let resAddrQR = await QRCode.toFile(path.join(tmpDir, "address.png"), w.address);
    env.font("font").fontSize(10);
    env.addPage();
    env.image(logo, 20, 20, { width: 120 });
    env.image(path.join(tmpDir, "address.png"), 400, 30, { width: 200 });
    env.fontSize(10).text("Ethereum address:", 0, 240, { align: "right" });
    env.font("Courier").fontSize(10).text(w.address, { align: "right" });

    doc.addPage();
    doc.font('font');
    x = doc.x;
    y = doc.y;
    doc.fontSize(12);
    doc.moveDown(8);
    doc.moveDown(4);
    doc.text("Your Ethereum Paper Wallet");
    doc.moveDown(1);
    doc.font('font');
    doc.text(
        "Keep safely the mnemonic words below. Treat this as a password and do not share it with anyone."
    );
    doc.moveDown(2);
    doc.font("fontBold");
    let words = w.mnemonic.phrase.split(' ');
    doc.text(words[0] + ' ' + words[1] + ' ' + words[2] + ' ' + words[3], { align: 'center'});
    doc.text(words[4] + ' ' + words[5] + ' ' + words[6] + ' ' + words[7], { align: 'center'});
    doc.text(words[8] + ' ' + words[9] + ' ' + words[10] + ' ' + words[11], { align: 'center'});
    doc.moveDown(2);
    doc.font('font').text("The Ethereum address of this wallet is:");
    doc.moveDown(1)
    doc.font("Courier").fontSize(12).text(w.address, {align: 'center'});
    let qr = await QRCode.toFile(path.join(tmpDir, "phrase.png"), w.mnemonic.phrase);
    doc.moveDown(2);
    doc.moveDown(2).text('To access your wallet, scan the following QR-code:');
    doc.moveDown(0.5);
    doc.image(path.join(tmpDir, "phrase.png"), doc.x + (widthDoc -100) / 2, doc.y, {width: 100});
    
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

async function changeWallet(req: Request, res: Response) {
    if(req.body.password === undefined) {
        logger.info('server.createWallet.noPassword');
        res.status(400).send({error:{ name:"noPassword", message:"No password specified for wallet change"}});
        return;
    }
    if(req.body.paraphrase === undefined) {
        logger.info('server.createWallet.noParaPhrase');
        res.status(400).send({error:{ name:"noPassword", message:"No paraphrase specified for wallet change"}});
        return;
    }

    const w:Wallet = Wallet.fromMnemonic(req.body.paraphrase);
    const jsonWallet = await w.encrypt(req.body.password).then((jsonWallet) => {
        fs.writeFileSync(config.walletFileName, jsonWallet);
    });
    loadWallet(w, req.body.password, req.app);
    res.sendStatus(200);
}

export { createWallet, changeWallet };
