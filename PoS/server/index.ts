import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import { Contract, errors, providers, utils, Wallet } from "ethers";
import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import fs from "fs";
import winston from "winston";
import expressWinston from "express-winston";
import jwt from "jsonwebtoken";
import Loki from "lokijs";
import axios from "axios";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
// TODO: is it used?
import "dotenv/config";
import archiver from "archiver";
import path from "path";
import { fileURLToPath } from "url";
import os from "os";
import { waitFor } from "./waitFor";
import { logConf } from "./loggerConfiguration";
import { ERC1155ABI } from "./ERC1155ABI";

// TODO: Env var?
const webSite: string = "http://192.168.1.5:8999";
const imgUrl: string = webSite + "/image?id=";
const iconUrl: string = webSite + "/icon?id=";
const jwtExpiry: number = 60 * 60;

var config: any = {};
config.secret = process.env.APP_SECRET;
config.walletFileName = process.env.APP_WALLET_FILE;
config.database = process.env.APP_DB_FILE;
config.infuraKey = process.env.APP_INFURA_KEY;
config.network = process.env.APP_NETWORK;
config.addressToken = process.env.APP_TOKEN_ADDR;
config.cacheFolder = process.env.APP_CACHE_FOLDER;

export interface RequestCustom extends Request {
    deviceId?: string;
    manager?: string;
}

// Global variables

let passHash: string = ""; // Hash of the password. If empty, means that the wallet has not been loaded
var databaseInitialized = false; // Is the database initialized? Used to wait for the database init before starting the server
var registeredPoS: any; // Database collection of registered point of sale
// TODO: have a look if it is possible to type the loki collection
var tokens: any; // Database collection of tokens
var saleEvents: any; // Database collection of events (lock/unlock/transfer/completedTransfer)
var wallet: Wallet; // Wallet
let ethProvider: providers.JsonRpcProvider; // Connection provider to Ethereum
let token: Contract; // Proxy to the Nft
let metas: Object[] = []; // list of the Nfts loaded from the smart contract
// TODO: example => const metasMap : Record<string, any> = {};
let metasMap = new Map(); // Same but as a map
let icons = new Map(); // Icons of the Nfts
let images = new Map(); // Images of the Nfts
var wait_on = 0; // pdf files synchronization

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize and configure the logger (winston)

const { format, transports } = logConf;
const logger = winston.createLogger({ format, transports });

// Database creation

let options: Partial<LokiConstructorOptions> & Partial<LokiConfigOptions> & Partial<ThrottledSaveDrainOptions> = {
    autoload: true,
    autoloadCallback: loadHandler,
    autosave: true,
    autosaveInterval: 4000, // 4 seconds
};
var db = new Loki(config.database, options);

// Database initialization, creating the PoS and tokens collections if they are not already existing
// When the database is initialized, the flag is set so that the server can start

const PoS_COLLECTION_NAME = "registeredPoS";
const TOKEN_COLLECTION_NAME = "tokens";

const SALES_EVENTS_COLLECTION_NAME = "saleEvents";

function loadHandler() {
    // if database did not exist it will be empty so I will intitialize here
    registeredPoS = db.getCollection(PoS_COLLECTION_NAME) ?? db.addCollection(PoS_COLLECTION_NAME);
    tokens = db.getCollection(TOKEN_COLLECTION_NAME) ?? db.addCollection(TOKEN_COLLECTION_NAME);
    saleEvents = db.getCollection(SALES_EVENTS_COLLECTION_NAME) ?? db.addCollection(SALES_EVENTS_COLLECTION_NAME);
    databaseInitialized = true;
}

type SaleEventRecord = {
    typeMsg: string;
    id: string;
    isLocked: boolean;
    destinationAddr?: string;
    isTransfered?: boolean;
    isFinalized?: boolean;
    txId?: string;
    error?: string;
};

// Express cleanup function. Saving the database when the server terminates

const cleanup = (callback: () => void) => {
    process.on("exit", callback);

    // catch ctrl+c event and exit normally
    process.on("SIGINT", () => {
        logger.info("server %s", "Ctrl-C...");
        process.exit(2);
    });

    //catch uncaught exceptions, trace, then exit normally
    process.on("uncaughtException", (e) => {
        logger.error("server %s", "Uncaught Exception...");
        logger.error("server %s", e.stack);
        process.exit(99);
    });
};

const exitHandler = () => {
    db.saveDatabase();
    console.log("Server stopping...saved database");
};

cleanup(exitHandler);

//
// Server Init:
//
// For security reasons, the server does not store the wallet's password.
// Therefore, no action can be performed before loading the wallet with /loadWAllet where the wallet owner enters interactively the password
// This password is used to unlock the wallet and the hash of this password is kept in memory so that further admin functions can be checked
// against this password. If a wrong password is given to unlock the wallet, this generates an error an the password hash is empty blocking
// any further operation.
//
// Client Connections:
//
// Each Point of Sale has to be registered first. The registration is performed on the PoS side by genereting a key pair and sending to the server
// the mobile unique Id encrypted with the priavte key together with the public key. The server stores in lowDb the mobile Id and its associated
// public key. The server's admin is then invited to validate this registration.
//
// Once a PoS registered, the connection is performed sending a signature of the mobile unique Id when the biometrics on the PoS have been validated
// When this signature is received, the server creates then a JWT which is used between the PoS and the server
//

init();

const app = express();

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
//const wss = new WebSocketServer({ noServer: true });
const wss = new WebSocketServer({ server: server });

app.use(express.static("public"));
app.use(express.static("build"));
app.use(cors());
//app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressWinston.logger(logConf));

waitFor(() => databaseInitialized).then(() =>
    server.listen(process.env.PORT || 8999, () => {
        //console.log(`Server started on port ${server.address().port} :)`);
        logger.info("server.started %s", `on port ${process.env.PORT || 8999}`);
    }),
);

/*
app.get('/*', function (req :Request, res :Response) {
	res.sendFile(path.join(__dirname, 'build', 'index.html'));
});
*/
//
// verifyToken
// Helper function to verify a token. This is called by the end points to verify if the JWT is valid
//
// When the token is expired, the PoS will reinitiate a login procedure which is simply performed through
// a biometric check
//
const verifyToken = (req: RequestCustom, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        logger.info("server.verifyToken.missingToken");
        return res.status(401).json({
            error: { message: "No token provided!", name: "NoTokenProvided" },
        });
    }
    jwt.verify(token, config.secret, (err: any, decoded: any) => {
        if (err) {
            const status = err.name == "TokenExpiredError" ? 401 : 403;

            return res.status(status).json({
                error: err,
            });
        }

        req.deviceId = decoded.id;
        req.manager = decoded.manager;
        next();
    });
};

//
// verifyTokenManager
// Helper function to verify if a token belongs to a manager This is called by the end points to verify if the JWT is valid and owned by a manager
//
// When the token is expired, the PoS will reinitiate a login procedure which is simply performed through
// a biometric check
//
const verifyTokenManager = (req: RequestCustom, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        logger.info("server.verifyToken.missingToken");
        return res.status(401).json({
            error: { message: "No token provided!", name: "NoTokenProvided" },
        });
    }
    jwt.verify(token, config.secret, (err: any, decoded: any) => {
        if (err) {
            const status = err.name == "TokenExpiredError" ? 401 : 403;

            return res.status(status).json({
                error: err,
            });
        }

        req.deviceId = decoded.id;
        req.manager = decoded.manager;
        if (!req.manager)
            return res.status(403).json({
                error: { message: "Not authorized !", name: "NotAuthorized" },
            });

        next();
    });
};

//
// /apiV1/auth/authorizePoS
// Authorize or not a registered Point of Sale
//
// This end point receives the public key the PoS has generated and the encrypted mobile unique Id
//
app.post("/apiV1/auth/registerPoS", function (req: Request, res: Response) {});

type DeviceResponse = {
    password: string;
    device: DeviceFromClient;
};

type DeviceFromClient = {
    deviceId: string;
    browser: string;
    browserVersion: string;
};

type DeviceServerSide = {
    ip?: string;
    authorized?: boolean;
};
//
// /apiV1/auth/sigin
// Signin into the server
//
// For this the client is sending the unique mobile Id and some devices characteristics.
// The server is then able to identify the registered PoS and sends back a JWT to the PoS
// In case the login is requested on a manager role, a password is provided in the object
// When no device have been registered and the manager's password is valid (as it unlocks
// the wallet), the device is automatically registered.
// For the following devices, the manager registration will be required
//
// In the case, a regular login is attempted, while the wallet has not been provided to the
// server to unlock the wallet, the ende point returns a 403
//
app.post("/apiV1/auth/signin", function (req: Request, res: Response) {
    const response = req.body as DeviceResponse;

    let { device, password } = response;
    const verification: DeviceServerSide = {};
    verification.ip = req.ip;
    logger.info("server.signin %s %s", device.deviceId, verification.ip);

    // Check if a password has been provided -> the user is attempting to login as manager
    if (password) {
        let pass: string = password as string;

        if (passHash == "") {
            // The password has not been provided yet -> try to unlock the wallet
            let jsonWallet = fs.readFileSync(config.walletFileName);

            Wallet.fromEncryptedJson(jsonWallet.toString(), pass)
                .then(function (data) {
                    loadWallet(data, pass);
                    verification.authorized = true;
                    registerPoS({ ...device, ...verification }, pass, res);
                })
                .catch(function (data) {
                    logger.info("server.signin.wrongCredentials");
                    res.status(403).send({
                        error: {
                            name: "walletPassError",
                            message: "Wrong credentials for the wallet password",
                        },
                    });
                });
        } else {
            // The password has already been provided, the wallet is unlocked. Verify if the passwaord is Ok
            if (passHash != utils.keccak256(utils.toUtf8Bytes(pass))) {
                logger.info("server.signin.wrongCredentials");
                res.status(403).send({
                    error: {
                        name: "walletPassError",
                        message: "Wrong credentials for the wallet password",
                    },
                });
            } else {
                // The credentials are Ok -> register the device
                logger.info("server.signin.registerPoS");
                verification.authorized = true;
                registerPoS(device, password, res);
            }
        }
    } else {
        if (passHash == "") {
            // The wallet has not been loaded, the server is not ready and cannot accept PoS connections
            logger.info("server.signin.walletNotLoaded");
            res.status(403).json({
                error: {
                    name: "walletNotLoaded",
                    message: "The server's wallet has not been loaded, manager's login required",
                },
            });
        } else {
            // The wallet is loaded, the server can accept connections. We verify that this PoS has been registered
            logger.info("server.signin.registerPoS");
            registerPoS(device, req.body.password, res);
        }
    }
});

function loadWallet(w: Wallet, pass: string) {
    wallet = w.connect(ethProvider);
    logger.info("server.signin.loadedWallet");
    passHash = utils.keccak256(utils.toUtf8Bytes(pass));
    //console.log(w.mnemonic);

    metas.forEach(async (nft: any) => {
        let balance = await token.balanceOf(wallet.address, nft.tokenId);
        nft.availableTokens = balance.toString();
        if (balance.isZero()) nft.isLocked = true;
    });
}

//
// registerPoS, parameters: the device to be registered, the password if the user is a manager and the result object
//
// This function registers a new PoS in the database
// If the PoS does not exists, it is created if a manager's password has been provided and in that case, it sends back a Jwt
// If the PoS has already been registered and authorized, it simply sends back a token
//
function registerPoS(device: DeviceServerSide & DeviceFromClient, pass: string, res: any) {
    let manager: boolean;

    if (!device.authorized) device.authorized = false;
    manager = typeof pass !== "undefined";

    const pos: any = registeredPoS.findOne({ deviceId: device.deviceId });
    if (pos == null) {
        if (!device.authorized) {
            // The PoS has not been registered and no password has been provided -> reject
            logger.info("server.signin.posNotAuthorized");
            res.status(403).json({
                error: {
                    name: "posNotAuthorized",
                    message: "The Point of Sale has not been authorized",
                },
            });
            return;
        } else {
            // This is a new PoS connected with the manager's login -> register
            logger.info("server.signin.newPoS %s", device);
            device.authorized = true;
            registeredPoS.insert(device);
            const token = jwt.sign({ id: device.deviceId, manager: manager }, config.secret, { expiresIn: jwtExpiry });
            res.status(200).send({ id: device.deviceId, accessToken: token });
            return;
        }
    } else {
        // The PoS has been registered
        if (!pos.authorized) {
            logger.info("server.signin.posNotAuthorized");
            res.status(403).json({
                error: {
                    name: "posNotAuthorized",
                    message: "The Point of Sale has not been authorized",
                },
            });
            return;
        } else {
            // The PoS is authorized -> Ok
            logger.info("server.signin.success %s", device);
            pos.ip = device.ip; // Updating the client's ip address
            registeredPoS.update(pos);
            const token = jwt.sign({ id: device.deviceId, manager: manager }, config.secret, { expiresIn: jwtExpiry });
            res.status(200).send({ id: device.deviceId, accessToken: token });
            return;
        }
    }
}

app.get("/tokens", verifyToken, (req: Request, res: Response) => {
    res.status(200).json(metas);
});

app.get("/token", verifyToken, (req: Request, res: Response) => {
    console.log(req.query.id);
    const id = parseInt(req.query.id as string);
    res.status(200).json(metas[id]);
});

app.get("/map", function (req: Request, res: Response) {
    res.sendFile(path.join(__dirname, "public/mapping_rects.json"));
});

app.get("/icon", function (req: Request, res: Response) {
    res.type("png");
    res.status(200).send(icons.get(req.query.id));
});

app.get("/image", function (req: Request, res: Response) {
    res.type("jpeg");
    res.status(200).send(images.get(req.query.id));
});

//
// /apiV1/price/update
// Update the price of a token
//
// This is an endpoint used when the manager updates the price of a token
// The parameters are:
// 	- the token identifier (which is the concatenation of the token's address and the token's id)
//	- the price
//
app.put("/apiV1/price/update", verifyTokenManager, (req: Request, res: Response) => {
    if (typeof req.query.tokenId === "undefined") {
        res.status(400).json({
            error: {
                name: "noTokenIdSpecified",
                message: "The token Id is missing",
            },
        });
        return;
    }
    if (typeof req.query.price === "undefined") {
        res.status(400).json({
            error: { name: "noPriceSpecified", message: "The price is missing" },
        });
        return;
    }

    const token: any = tokens.findOne({ id: req.query.tokenId });
    if (token == null) {
        res.status(404).json({
            error: {
                name: "tokenNotFound",
                message: "The specified token is not in the database",
            },
        });
        return;
    }

    token.price = req.query.price;
    tokens.update(token);
    res.sendStatus(200);
    sendPrice(token.id, token.price);
});

//
// /apiV1/price/updates
// Update the price of a list of tokens
//
// This is an endpoint used when the manager updates the token prices
// The parameters are:
// 	- a Json object containing the id and the price
//
app.put("/apiV1/price/updates", verifyTokenManager, function (req: Request, res: Response) {
    var tokensUpdate = req.body;
    console.log(tokensUpdate);
    if (tokensUpdate.length == 0) {
        res.sendStatus(400);
        return;
    }

    tokensUpdate.forEach((item: any) => {
        var token: any = tokens.findOne({ id: item.id });
        if (token == null) {
            res.status(404).json({
                error: {
                    name: "tokenNotFound",
                    message: `The specified token ${item.tokenId} is not in the database`,
                },
            });
            return;
        }

        token.price = item.price;
        tokens.update(token);
        sendPrice(token.id, token.price);
    });

    res.sendStatus(200);
});

//
// /apiV1/auth/registeredPoS
//
// This end point sends back all the registered PoS
//
app.get("/apiV1/auth/registeredPoS", verifyTokenManager, function (req: Request, res: Response) {
    res.status(200).json(registeredPoS.find());
});

//
// /apiV1/log/allEvents
//
// This end point sends back the registered PoS
//
app.get("/apiV1/log/allEvents", verifyTokenManager, function (req: Request, res: Response) {
    let start: Date = new Date();
    start.setUTCHours(0, 0, 0, 0);
    let end: Date = new Date();
    end.setUTCHours(23, 59, 59, 999);

    //var results: any = saleEvents.find({when: {between: [start, end]}});
    var results: any = saleEvents.find({
        "meta.created": { $between: [start.getTime(), end.getTime()] },
    });
    res.status(200).json(results);
});

//
// /apiV1/auth/authorizePoS, parameter: PoS, the name of the PoS, authorized: true or false
//
// This end point sends back the registered PoS
//
app.put("/apiV1/auth/authorizePoS", verifyTokenManager, function (req: Request, res: Response) {
    if (typeof req.query.PoS === "undefined") {
        res.sendStatus(400).json({
            error: {
                name: "noPoSSpecified",
                message: "The Point of Sale is missing",
            },
        });
        return;
    }
    if (typeof req.query.authorized === "undefined") {
        res.sendStatus(400).json({
            error: {
                name: "noAuthorizationSpecified",
                message: "The Point of Sale authorization is missing",
            },
        });
        return;
    }

    var pos = registeredPoS.findOne({ deviceId: req.query.PoS });
    if (pos == null) {
        res.sendStatus(400).json({
            error: {
                name: "nonExistingPoS",
                message: "The Point of Sale does not exist",
            },
        });
        return;
    }
    pos.authorized = req.query.authorized == "true" ? true : false;
    registeredPoS.update(pos);
    res.sendStatus(200);
});

//
// /apiV1/sale/transfer, parameters: the token's id and the destination address
//
// This end point transfers the specified token to the new owner.
// It performs the Blockchain transaction
//
app.post("/apiV1/sale/transfer", verifyToken, async function (req: RequestCustom, res: Response) {
    const tokenAddr: string = req.body.tokenAddr;
    const tokenId: string = req.body.tokenId;
    const destinationAddr: string = req.body.destinationAddress;
    console.log("transfer tokenId: ", tokenAddr, tokenId, destinationAddr);

    logger.info("server.transfer.requested - token: %s, destination: %s", tokenId, destinationAddr);
    const saleEvent: SaleEventRecord = {
        typeMsg: "transferRequest",
        id: req.body.id as string,
        isLocked: true,
        destinationAddr,
    };
    saleEvents.insert(saleEvent);

    let tokenWithSigner = token.connect(wallet);
    console.log(tokenWithSigner);
    console.log("token");
    console.log(token);
    console.log("wallet");
    console.log(wallet);
    tokenWithSigner
        .safeTransferFrom(wallet.address, destinationAddr, tokenId, 1, [])
        .then((transferResult: TransactionResponse) => {
            res.sendStatus(200);
            const saleEvent: SaleEventRecord = {
                typeMsg: "transferInitiated",
                id: req.body.tokenId as string,
                isLocked: true,
                destinationAddr,
                isTransfered: true,
            };
            saleEvents.insert(saleEvent);
            logger.info("server.transfer.initiated - token: %s, destination: %s", tokenId, destinationAddr);
            transferResult.wait().then((transactionReceipt: TransactionReceipt) => {
                const saleEvent: SaleEventRecord = {
                    typeMsg: "transferCompleted",
                    id: req.body.tokenId as string,
                    isLocked: true,
                    destinationAddr,
                    isTransfered: true,
                    isFinalized: true,
                    txId: transactionReceipt.transactionHash,
                };

                saleEvents.insert(saleEvent);
                logger.info(
                    "server.transfer.performed token %s destination %s - TxHash: %s",
                    tokenId,
                    destinationAddr,
                    transactionReceipt.transactionHash,
                );
                // Update the balance once the transfer has been performed
                token.balanceOf(wallet.address, tokenId).then((balance: any) => {
                    const tk = metasMap.get(tokenAddr + tokenId);
                    if (tk != null) {
                        tk.availableTokens = balance.toString();
                        if (balance.isZero()) {
                            tk.isLocked = true;
                            sendLock(tokenId, true);
                        }
                    }
                });
            });
        })
        .catch((error: errors) => {
            res.status(412).json(error);
            logger.error("server.transfer.error %s", error);
            const saleEvent: SaleEventRecord = {
                typeMsg: "transferInitiated",
                id: req.body.tokenId as string,
                isLocked: true,
                destinationAddr,
                isTransfered: false,
                isFinalized: false,
                txId: undefined,
                error,
            };
            saleEvents.insert(saleEvent);
        });
});

app.get("/apiV1/generateWallets", verifyTokenManager, async function (req: Request, res: Response) {
    let nbWallets = 10;
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
        env.image("./public/nft4Art.png", 20, 20, { width: 120 });
        env.image(path.join(tmpDir, "addr" + i + ".png"), 400, 30, {
            width: 200,
        });
        env.fontSize(10).text("Ethereum address:", 0, 240, { align: "right" });
        env.font("Courier").fontSize(10).text(w.address, { align: "right" });

        doc.addPage();
        doc.image("./public/nft4Art.png", 20, 20, { width: 150 });
        doc.moveDown(8);
        doc.font("Helvetica-Bold").fontSize(25).text("Your personnal Ethereum Wallet", { align: "center" });
        doc.moveDown(3);
        doc.font("Times-Roman").fontSize(12);
        doc.text(
            "You'll find below the mnemonic words that you will insert in any Ethereum compatible wallet. This list of words represents the secret which enables you to access your newly purchased piece of art. Do not communicate this information to anybody!",
        );
        doc.moveDown(2);
        doc.font("Times-Bold").fontSize(12).text(w.mnemonic.phrase, { align: "center" });
        doc.moveDown(2);
        doc.fontSize(12).text("The Ethereum address of this wallet is: ", { continued: true });
        doc.font("Courier").fontSize(12).text(w.address);
        let qr = await QRCode.toFile(path.join(tmpDir, "phrase" + i + ".png"), w.mnemonic.phrase);
        doc.moveDown(2);
        doc.font("Times-Roman").fontSize(12).text("In the Nft4ART app you'll be invited to scan your secret phrase:");
        doc.moveDown(2);
        doc.image(path.join(tmpDir, "phrase" + i + ".png"), 200, 500, {
            width: 200,
        });
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
});

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    address: string;
    pos: any;
}

function sendLock(id: string, isLocked: boolean) {
    sendMessage(JSON.stringify(new LockMessage(id, isLocked)));
}
function sendPrice(id: string, price: number) {
    sendMessage(JSON.stringify(new PriceMessage(id, price)));
}

function sendMessage(msg: string) {
    setTimeout(() => {
        wss.clients.forEach((client) => {
            console.log("send " + msg + client);
            client.send(msg);
        });
    }, 1000);
}

export class LockMessage {
    public typeMsg: string = "lock";

    constructor(public id: string, public isLocked: boolean = true) {}
}
export class PriceMessage {
    public typeMsg: string = "price";

    constructor(public id: string, public price: number) {}
}

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
    const extWs = ws as ExtWebSocket;

    extWs.address = req.socket.remoteAddress as string;
    logger.info("server.ws.connection %s", extWs.address);
    const pos: any = registeredPoS.findOne({ ip: extWs.address });
    if (pos == null) {
        logger.warning("server.ws.connection.rejected %s", extWs.address);
        ws.close();
        return;
    }
    if (!pos.authorized) {
        logger.warning("server.ws.connection.unauthorized %s", extWs.address);
        ws.close();
        return;
    }

    pos.isConnected = true;
    registeredPoS.update(pos);
    extWs.pos = pos;

    extWs.isAlive = true;

    extWs.on("pong", () => {
        extWs.isAlive = true;
    });

    extWs.on("error", (err) => {
        logger.warn("server.ws.disconnection %s %s", err, extWs.address);
        extWs.pos.isConnected = false;
        registeredPoS.update(pos);
    });

    extWs.on("close", (code: any, buffer: any) => {
        logger.info("server.ws.close %s", buffer);
        extWs.pos.isConnected = false;
        registeredPoS.update(pos);
    });
});

setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
        const extWs = ws as ExtWebSocket;

        if (!extWs.isAlive) return ws.terminate();

        extWs.isAlive = false;
        ws.ping(null, undefined);
    });
}, 10000);

app.put("/lockUnlock", async (req: Request, res: Response) => {
    let id: any = req.query.id;
    let token: any = metasMap.get(id);
    let lock: any = req.query.lock;

    if (typeof token === null) {
        console.log("error: non existing token " + req.query.id);
        res.status(404).send();
        return;
    }

    token.isLocked = lock === "true";
    const saleEvent = { typeMsg: "lock", id, lock };
    saleEvents.insert(saleEvent);
    sendLock(req.query.id as string, token.isLocked);
    tokens.update(token);
    res.status(204).send();
});

//
// Server initialization
//
// This function retrieves the tokens' information on Ethereum via Infura and caches the images in alocal directory
// If the images have not been cached, it rerieves those from Ipfs
//
// This function fills:
// 	- the meta global variable with the tokens' data
//	- the icons map (global variable) with the icons
//	- the image map (global variable) with the images
//
async function init() {
    // Connect to Infura and connect to the token
    ethProvider = await new providers.InfuraProvider(config.network, config.infuraKey);
    token = await new Contract(config.addressToken, ERC1155ABI, ethProvider);
    logger.info("server.init %s", await token.name());

    if (!fs.existsSync(config.cacheFolder)) fs.mkdirSync(config.cacheFolder);

    let i: number = 0;
    let str: string;
    let data: any;
    let loop: boolean = true;
    let errTimeout: number = 0;

    // Retrieve the past events on this contract to find out which id have been minted
    // Mints are coming from address '0x0000000000000000000000000000000000000000' and can be performed by any operator (first topic)

    const events = await token.queryFilter(
        token.filters.TransferSingle(null, "0x0000000000000000000000000000000000000000"),
        0,
        "latest",
    );

    for (i = 0; i < events.length; i++) {
        const id = events[i]?.args?.id;
        str = await token.uri(id);

        if (errTimeout == 2) break; // If we face a timeout we retry twice

        try {
            data = tokens.findOne({ id: config.addressToken + id }); // Store information in the database if not existing
            if (data == null) {
                logger.info("server.init.loadTokens.fromIpfs %s", str);
                let resp = await axios.get(str); // The data is not in cache, we retrieve the JSON from Ipfs
                data = resp.data;
                data.id = config.addressToken + id;
                data.tokenIdStr = id?.toString();
                data.tokenId = id;
                data.addr = config.addressToken;
                data.isLocked = false;
                data.price = 0;
                tokens.insert(data);
            } else {
                logger.info("server.init.loadTokens.fromCache %s", str);
            }
        } catch (error) {
            const err = error as any;
            if (typeof err.response != "undefined") {
                // We have received a proper response but containing an error
                logger.warn("server.init.loadTokens %s", str, err.response.status);
                if (err.response.status == 504) {
                    errTimeout++;
                    continue;
                } // 504 = Gateway timeout
                if (err.response.status == 408) {
                    errTimeout++;
                    continue;
                } // 408 = Request timeout
                if (err.response.status == 404) break; // 404 = not found, we stop as the information is not available
            } else logger.error("server.init.loadTokens %s", err); // We log here network errors
        }

        metas.push(data);
        metasMap.set(data.id, data);

        errTimeout = 0;
    }

    //
    // Retrieve the icons, looking at the cache in case the icon has been already retrieved
    //
    let buf: Buffer;

    const getIcons = Promise.all(
        metas.map(async (meta: any) => {
            let cid = config.cacheFolder + meta.image.replace("ipfs://", ""); // We remove the ipfs prefix to only keep the cid
            let icon = meta.image.replace("ipfs", "https").concat(".ipfs.dweb.link"); // We form an url for dweb containing the ipfs cid
            try {
                if (fs.existsSync(cid)) {
                    // We try to find this cid in the cache
                    logger.info("server.init.loadIcons.cache %s", cid);
                    buf = Buffer.from(fs.readFileSync(cid, { encoding: "binary" }), "binary");
                } else {
                    // Not available in the cache, we get it from ipfs
                    logger.info("server.init.loadIcons.ipfs %s", cid);
                    const resp = await axios.get(icon, { responseType: "arraybuffer" });
                    buf = Buffer.from(resp.data, "binary");
                    fs.writeFileSync(cid, buf, { flag: "w", encoding: "binary" }); // Save the file in cache
                }

                icons.set(meta.addr + meta.id, buf); // Store the icon in memory
            } catch (error) {
                logger.error("server.init.loadIcons %s", error);
            }

            meta.iconUrl = iconUrl + meta.addr + meta.id; // Reference the icon's url
        }),
    );

    //
    // Retrieve the images, looking at the cache in case the image has been already retrieved
    //
    const getImages = Promise.all(
        metas.map(async (meta: any) => {
            let cid = config.cacheFolder + meta.image_raw.replace("ipfs://", "");
            try {
                if (fs.existsSync(cid)) {
                    logger.info("server.init.loadImages.cache %s", cid);
                    buf = Buffer.from(fs.readFileSync(cid, { encoding: "binary" }), "binary");
                } else {
                    logger.info("server.init.loadImages.ipfs %s", cid);
                    let image = meta.image_raw.replace("ipfs", "https").concat(".ipfs.dweb.link");
                    const resp = await axios.get(image, { responseType: "arraybuffer" });
                    buf = Buffer.from(resp.data, "binary");
                    fs.writeFileSync(cid, buf, { flag: "w", encoding: "binary" });
                }

                images.set(meta.addr + meta.id, buf);
            } catch (error) {
                logger.error("server.init.loadIcons %s", error);
            }

            meta.imgUrl = imgUrl + meta.addr + meta.id;
        }),
    );

    await Promise.all([getIcons, getImages]);
}
