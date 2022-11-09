import express, { Request, Response } from "express";
import multer  from "multer";
import cors from "cors";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";
import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import fs from "fs";
import Loki from "lokijs";
import axios from "axios";
import expressWinston from "express-winston";
// TODO: is it used?
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { waitFor } from "./waitFor.js";
import jwt from "jsonwebtoken";


import { init } from "./init.js";
import { logConf, logger } from "./loggerConfiguration.js";

import * as dbPos from './services/db.js';
import { config } from "./config.js";

import { generateWallets } from "./endPoints/information/generateWallets.js";
import { tokensOwned } from "./endPoints/information/tokensOwned.js";
import { threeDmodel } from "./endPoints/information/threeDmodel.js";
import { video } from "./endPoints/information/video.js";
import { signin } from "./endPoints/auth/signin.js";
import { verifyTokenApp } from "./endPoints/auth/verifyTokenApp.js";
import { verifyToken } from "./endPoints/auth/verifyToken.js";
import { verifyTokenManager } from "./endPoints/auth/verifyTokenManager.js";
import { appLogin, appLoginDrop } from "./endPoints/auth/appLogin.js";
import { priceInCrypto } from "./endPoints/price/priceInCrypto.js";
import { priceUpdate, priceUpdates } from "./endPoints/price/priceUpdate.js";
import { authorizePoS } from "./endPoints/auth/authorizePoS.js";
import { batchMintTokenFromFiles, batchMintStart, batchMintFinalize } from "./endPoints/token/mintTokenFromFiles.js";
import { createNewToken } from './endPoints/token/createNewToken.js'
import { collectionImage, collectionMap } from "./endPoints/token/collectionImage.js";
import { createQuestionnaire, getQuestionnaire, listQuestionnaire } from "./endPoints/vote/Questionnaire.js";
import { sendVote, getVotes } from "./endPoints/vote/vote.js";
import { transfer } from "./endPoints/sale/transfer.js"
import { saleInvoice } from "./endPoints/sale/saleInvoice.js"
import { addSmartContract } from "./endPoints/token/addSmartContract.js";
import { listAllTokens, listFilteredTokens } from "./endPoints/token/listTokens.js";
import { listQuestionnaireForUser } from "./endPoints/vote/Questionnaire.js";
import { RequestCustom, DeviceResponse, DeviceFromClient, AppLogin, AppLoginMessage, Vote, SaleEventRecord, registeredPosRecord } from './typings'
import { transferEth } from "./endPoints/sale/transferEth.js";
import { transferBtc } from "./endPoints/sale/transferBtc.js"
import { listInvoices, getPdfInvoice } from "./endPoints/sale/listInvoices.js";
import { invoicePaid } from "./endPoints/sale/invoicePaid.js";


// TODO: Env var?
const webSite: string = "http://192.168.1.5:8999";

const NFT4ART_ETH_NETWORK = 1;
const NFT4ART_BTC_NETWORK = 2;
const NFT4ART_FIAT_NETWORK = 3;
const NFT4ART_SALE_INITIATED = 1;
const NFT4ART_SALE_INITIATED_MSG = "saleInitiated";
const NFT4ART_SALE_STORED_MSG = "saleStored";
const NFT4ART_SALE_PAID = 2;
const NFT4ART_SALE_PAID_MSG = "salePaid";
const NFT4ART_SALE_TRANSFERRED = 3;
const NFT4ART_SALE_TRANSFERRED_MSG = "saleTransferred";

const PoS_COLLECTION_NAME = "registeredPoS";
const TOKEN_COLLECTION_NAME = "tokens";
const SALES_EVENTS_COLLECTION_NAME = "saleEvents";
const APP_ID_COLLECTION_NAME = "appIds";

const storage = multer.memoryStorage()
//const upload = multer({ storage: storage })
const upload = multer({dest: 'uploads/', limits: { fileSize: 1024 * 1024 * 500 }});

// Global variables

var databaseInitialized = false;                    // Is the database initialized? Used to wait for the database init before starting the server

//TODO: have a look if it is possible to type the loki collection
var registeredPoS: any;                             // Database collection of registered point of sale
var tokens: any;                                    // Database collection of tokens
var saleEvents: any;                                // Database collection of events (lock/unlock/transfer/completedTransfer)
//var appIds: Collection<AppLoginMessage>;          // Database collection of companion app Ids
//var wallet: Wallet;                               // Wallet
//let ethProvider: providers.JsonRpcProvider;       // Connection provider to Ethereum

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config.__dirname = __dirname;

// Initialize and configure the logger (winston)


// Database creation

dbPos.initDb(config);

let options: Partial<LokiConstructorOptions> & Partial<LokiConfigOptions> & Partial<ThrottledSaveDrainOptions> = {
    autoload: true,
    autoloadCallback: loadHandler,
    autosave: true,
    autosaveInterval: 4000, // 4 seconds
};
var db = new Loki(config.database, options);

// Database initialization, creating the PoS and tokens collections if they are not already existing
// When the database is initialized, the flag is set so that the server can start

function loadHandler() {
    // if database did not exist it will be empty so I will intitialize here
    registeredPoS = db.getCollection(PoS_COLLECTION_NAME) ?? db.addCollection(PoS_COLLECTION_NAME);
    tokens = db.getCollection(TOKEN_COLLECTION_NAME) ?? db.addCollection(TOKEN_COLLECTION_NAME);
    saleEvents = db.getCollection(SALES_EVENTS_COLLECTION_NAME) ?? db.addCollection(SALES_EVENTS_COLLECTION_NAME);
    //appIds = db.getCollection(APP_ID_COLLECTION_NAME) ?? db.addCollection(APP_ID_COLLECTION_NAME);
    databaseInitialized = true;
}



// Express cleanup function. Saving the database when the server terminates

const cleanup = (callback: () => void) => {
    process.on("exit", callback);

    // catch ctrl+c event and exit normally
    process.on("SIGINT", () => {
        logger.info("server %s", "Ctrl-C...");
        process.exit(2);
    });

    //catch uncaught exceptions, trace, then exit normally
    process.on("uncaughtException", (e:any, origin) => {
        logger.error("server uncaught Exception...");
        logger.error("server %s", e.stack);
        logger.error('Exception origin: %s', origin);
        process.exit(99);
    });
};

const exitHandler = () => {
    db.saveDatabase();
    dbPos.closeDb();
    console.log("Server stopping...saved database");
};

cleanup(exitHandler);

//
// Server Init:
//
// For security reasons, the server does not store the wallet's password.
// Therefore, no action can be performed before loading the wallet with /apiV1/auth/signin where the wallet owner submits the password
// This password is used to unlock the wallet and the hash of this password is kept in memory so that further admin functions can be checked
// against this password. If a wrong password is given to unlock the wallet, this generates an error an the password hash is empty blocking
// any further operation.
//
// Client Connections:
//
// Each Point of Sale has to be registered first. The registration is performed on the PoS side by generating a key pair and sending to the server
// the mobile unique Id encrypted with the private key together with the public key. The server stores in sqlite the mobile Id and its associated
// public key. The server's admin is then invited to validate this registration.
//
// Once a PoS registered, the connection is performed sending a signature of the mobile unique Id when the biometrics on the PoS have been validated
// When this signature is received, the server creates then a JWT which is used between the PoS and the server
//

const app = express();
init(app, config);

//initialize a simple http server
const server = http.createServer(app);

//initialize the WebSocket server instance
//const wss = new WebSocketServer({ noServer: true });
const wss = new WebSocketServer({ server: server });

app.use(express.static("public"));
app.use('/client', express.static("build"));
app.use('/client',(req, res, next) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});
app.use('/pos-client', express.static("pos-build"));
app.use('/pos-client',(req, res, next) => {
    res.sendFile(path.join(__dirname, "pos-build", "index.html"));
});

app.use(cors());
//app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(expressWinston.logger(logConf));
app.set('views', path.join(config.__dirname, 'views'));
app.set('view engine', 'ejs');

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
// /apiV1/auth/authorizePoS
// Authorize or not a registered Point of Sale
//
// This end point receives the public key the PoS has generated and the encrypted mobile unique Id
//
//app.post("/apiV1/auth/registerPoS", function (req: Request, res: Response) {});


app.post("/apiV1/auth/signin", signin);
app.post("/apiV1/auth/appLogin", appLogin);
app.post("/apiV1/auth/appLoginDrop", verifyTokenApp, appLoginDrop);
app.put("/apiV1/auth/authorizePoS", verifyTokenManager, authorizePoS);

app.get('/apiV1/information/video', verifyTokenApp, video);
app.get('/apiV1/information/tokensOwned', verifyTokenApp, tokensOwned);
app.get('/apiV1/information/3Dmodel', threeDmodel);
app.get("/apiV1/information/generateWallets", verifyTokenManager, generateWallets);
app.get("/apiV1/information/installApp", function(req: Request, res: Response) {
    res.set('location', config.redirectTo);
    res.status(301).send();
});

app.get('/apiV1/price/priceInCrypto', priceInCrypto);
app.put("/apiV1/price/update", verifyTokenManager, priceUpdate);
app.put("/apiV1/price/updates", verifyTokenManager, priceUpdates);

app.post('/apiV1/token/batchMintStart', batchMintStart);
app.post('/apiV1/token/batchMintTokenFromFiles', upload.any(), batchMintTokenFromFiles);
app.post('/apiV1/token/batchMintFinalize', upload.any(), batchMintFinalize);
app.post('/apiV1/token/addSmartContract', verifyTokenManager, addSmartContract);
app.get('/apiV1/token/collectionImg', collectionImage);
app.get('/apiV1/token/collectionMap', collectionMap);
app.get(['/apiV1/token/list', '/tokens', '/apiV1/token/listFilteredToken'], listFilteredTokens);
app.get(['/apiV1/token/token', '/token'], verifyToken, (req: Request, res: Response) => {
    const id = parseInt(req.query.id as string);
    res.status(200).json(app.locals.metas[id]);
});
app.get('/apiV1/token/listAllToken', verifyToken, listAllTokens);
app.get(['/apiV1/token/icon', '/icon'], function (req: Request, res: Response) {
    res.type("png");
    res.status(200).send(app.locals.icons.get(req.query.id));
});
app.get(['/apiV1/token/image', '/image'], function (req: Request, res: Response) {
    res.type("jpeg");
    res.status(200).send(app.locals.images.get(req.query.id));
});
app.get('/apiV1/token/resource', function (req: Request, res: Response) {
    res.type("jpeg");
    const resourceId:string = req.query.id as string + req.query.type as string;
    res.status(200).send(app.locals.icons.get(resourceId));
});
app.get('/apiV1/token/collections', function (req: Request, res: Response) {
    res.status(200).json(app.locals.collections);
});

app.post('/apiV1/vote/createVote', createQuestionnaire);
app.get('/apiV1/vote/getVote', getQuestionnaire);
app.get('/apiV1/vote/listQuestionnaire', listQuestionnaire);
app.get('/apiV1/vote/listQuestionnaireForUser', verifyTokenApp, listQuestionnaireForUser);
app.post('/apiV1/vote/sendVote', sendVote);
app.get('/apiV1/vote/getVotes', getVotes);


app.get("/map", function (req: Request, res: Response) {
    res.sendFile(path.join(__dirname, "public/mapping_rects.json"));
});
app.get("/QRCode", function (req: Request, res: Response) {
    res.type("png");
    res.status(200).sendFile(path.join(__dirname, config.cacheFolder, req.app.locals.token.address + '.png'));
});
app.get("/QRCodeBtc", function (req: Request, res: Response) {
    res.type("png");
    res.status(200).sendFile(path.join(__dirname, config.cacheFolder, config.bitcoinAddr + '.png'));
});


//
// /apiV1/auth/registeredPoS
//
// This end point sends back all the registered PoS
//
app.get("/apiV1/auth/registeredPoS", verifyTokenManager, function (req: Request, res: Response) {
    res.status(200).json(dbPos.findAllRegisteredPos());
});

//
// /apiV1/log/allEvents
//
// This end point sends back the events of the day
//
app.get("/apiV1/log/allEvents", verifyTokenManager, function (req: Request, res: Response) {
    let start: Date = new Date();
    start.setUTCHours(0, 0, 0, 0);
    let end: Date = new Date();
    end.setUTCHours(23, 59, 59, 999);

    var results: any = saleEvents.find({
        "meta.created": { $between: [start.getTime(), end.getTime()] },
    });
    res.status(200).json(results);
});


app.post('/apiV1/token/createToken', verifyTokenManager, createNewToken);

app.post("/apiV1/sale/transfer", verifyToken, transfer);
app.post("/apiV1/sale/transferEth", verifyToken, transferEth);
app.post("/apiV1/sale/transferBtc", verifyToken, transferBtc);
app.post("/apiV1/sale/saleInvoice", verifyToken, saleInvoice);
app.get("/apiV1/sale/listInvoices", verifyToken, listInvoices);
app.get("/apiV1/sale/getInvoice", verifyToken, getPdfInvoice);
app.post("/apiV1/sale/invoicePaid", verifyToken, invoicePaid);

//
// /apiV1/token/mintIpfsFolder
// parameter:
//  - folderName: Ipfs CID of the folder where the tokens' metadata are stored
//
// This end point retrieves from Ipfs the content of the CID which should be a folder containig metadata files for eaxh token
// For each metadata file the id is used to mint the corresponding token in the start contract
// The quantity minted is defined in the metadata. If no amount is specified, default is one piece
//
app.post("/apiV1/token/mintIpfsFolder", verifyTokenManager, async function (req: Request, res: Response) {
    if (req.query.folderName === undefined)   return res.status(400).json({error: {name: 'noFolderSpecified', message: 'The Ipfs folder is missing'}});

    const urlIpfs = config.urlIpfs + req.query.folderName;
    let resp = await axios.get(urlIpfs);

    var ids = resp.data.Objects[0].Links.map( (item: any) =>  path.parse(item.Name).name );
    var existingIds = ids.filter((item: any) => app.locals.metasMap.get(config.addressToken + item) !== undefined )
    if (existingIds.length !=0 ) return res.status(400).json({error: {name: 'alreadyExistingToken', message: 'The contract already contains tokens Ids requested to mint'}});
    var bigIntIds = ids.map((item: any) => {
        try { return BigNumber.from(item);  }
        catch(e) {return undefined}
    })
    if (bigIntIds.findIndex(Object.is.bind(null, undefined)) != -1) return res.status(400).json({error: {name: 'invalidId', message: 'One of the Ids to mint is invalid'}});

    var amounts = resp.data.Objects[0].Links.map( (item: any) => item.amount === undefined ? constants.One : BigNumber.from(item.amount));
    let tokenWithSigner = app.locals.token.connect(app.locals.wallet);
    try {
        var tx = await tokenWithSigner.mintBatch(bigIntIds, amounts, [] );
        await tx.wait();
        res.sendStatus(200);
    } catch(e) { res.status(400).json({error: {name: 'errorMintingTokens', message: 'Error minting the tokens'}}); }
});

interface ExtWebSocket extends WebSocket {
    isAlive: boolean;
    address: string;
    pos: any;
}

function sendLock(id: string, isLocked: boolean) {
    sendMessage(JSON.stringify(new LockMessage(id, isLocked)));
}
function sendQuantity(id: string, quantity: number) {
    sendMessage(JSON.stringify(new QuantityMessage(id, quantity)));
}
function sendError(status: number, message: string) {
    sendMessage(JSON.stringify(new ErrorMessage(status, message)));
}

function sendMessage(msg: string) {
    setTimeout(() => {
        wss.clients.forEach((client) => {
            console.log("send " + msg + client);
            client.send(msg);
        });
    }, 1000);
}

export { sendMessage, sendLock, sendError, sendQuantity };

export class LockMessage {
    public typeMsg: string = "lock";

    constructor(public id: string, public isLocked: boolean = true) {}
}
export class ErrorMessage {
    public typeMsg: string = "error";

    constructor(public status: number, public message: string) {}
}

export class QuantityMessage {
    public typeMsg: string = "qty";

    constructor(public id: string, public qty: number) {}
}

wss.on("connection", (ws: WebSocket, req: http.IncomingMessage) => {
    const extWs = ws as ExtWebSocket;

    const url = new URL(req.url || '', 'http://example.com');
    const token:string = url.searchParams.get('token') || '';
    const deviceId:string = url.searchParams.get('deviceId') || '';
    const pos = dbPos.findRegisteredPos(deviceId);
    if (pos == null) {
        logger.warn('server.ws.connection.noregisteredPoS');
        ws.close();
        return;
    }
    extWs.pos = pos;

    jwt.verify(token, config.secret, (err: any, decoded: any) => {
        if (err) {
            const status = err.name == "TokenExpiredError" ? 401 : 403;
            logger.warn('server.ws.connection.rejected.errorToken %s', err.name);
            ws.close();
        }
        dbPos.updateConnectedRegisteredPos(deviceId, true);
        extWs.isAlive = true;

        logger.info('server.ws.connection.accepted deviceId: %s', deviceId);
    });

    extWs.on("pong", () => {
        extWs.isAlive = true;
    });

    extWs.on("error", (err) => {
        logger.warn("server.ws.disconnection %s %s", err, extWs.address);
        extWs.pos.isConnected = false;
        dbPos.updateConnectedRegisteredPos(extWs.pos.deviceId, false);
    });

    extWs.on("close", (code: any, buffer: any) => {
        logger.info("server.ws.close %s", buffer);
        extWs.pos.isConnected = false;
        dbPos.updateConnectedRegisteredPos(extWs.pos.deviceId, false);
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
    let id: string = req.query.id as string;
    let token: any = app.locals.metasMap.get(id);
    let lock: any = req.query.lock;

    if (typeof token === null) {
        logger.error('server.lockUnlock.nonExistingToken %s', req.query.id);
        res.sendStatus(404);
        return;
    }

    if (token.availableTokens > 1) {
        res.sendStatus(200);
        return;
    }

    token.isLocked = lock === "true";
    const saleEvent = { typeMsg: "lock", id, lock };
    saleEvents.insert(saleEvent);
    sendLock(req.query.id as string, token.isLocked);
    //tokens.update(token);
    dbPos.updateLockToken(id, token.isLocked ? 1 : 0)
    res.status(204).send();
});


