import fs from "fs";
import QRCode from "qrcode";
import { logger } from "./loggerConfiguration.js";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";
import axios from "axios";
import path from "path";
// @ts-ignore
import { convertSTLIntoGLTF } from 'asset-mgmt';

import { receivedEthCallback } from "./services/receivedEthCallback.js"
import * as dbPos from './services/db.js';
import { config } from "./config.js"

//
// Server initialization
//
// This function retrieves the tokens' information on Ethereum via Infura and caches the images in a local directory
// If the images have not been cached, it retrieves those from Ipfs
//
// This function fills:
// 	- the meta global variable with the tokens' data
//	- the icons map (global variable) with the icons
//	- the image map (global variable) with the images
//
// Those global variables are stored in the locals property of the app object
//
//  app.locals.gvdNftDef:       Contract Abi of the GovernedNft
//  app.locals.ethProvider      Connection to the Ethereum provider
//  app.locals.token            Proxy to the smart contract
//  app.locals.metas            List of the Nfts loaded from the smart contract
//  app.locals.metasMap         Same information but organised in a map
//  app.locals.icons            Cache of the icons of the different tokens
//  app.locals.images           Cache of the different images
//  app.locals.passHash         Contains the hash of the wallet's password
//  app.locals.wallet           Refers to the server's wallet
//  app.locals.ipfsFolder       Contains the default URI from the smartcontract
//  app.locals.crypto           Contains the crypto library
//

async function init(exApp: any, config: any) {
    // Read the ABI of the GovernedNft contract
    let rawAbi = fs.readFileSync(config.gvdNftAbiFile);
    const gvdNftDef = JSON.parse(rawAbi.toString());
    exApp.locals.gvdNftDef = gvdNftDef;

    exApp.locals.passHash = "";
    exApp.locals.wallet = null;
    exApp.locals.walletLoaded = false;
    exApp.locals.ethProvider = await new providers.InfuraProvider(config.network, config.infuraKey);


    let tokenList = dbPos.findAllSmartContracts();
    if (tokenList.length == 0) {
        logger.info('server.init.noSmartContractDefined');
        return;
    }

    let token: Contract;

    token = await new Contract(tokenList[0].addressEth, exApp.locals.gvdNftDef.abi, exApp.locals.ethProvider);
    loadToken(token, exApp);
    loadQuestionnaire(exApp);
}

async function loadToken(token: Contract, exApp:any ) {
    logger.info('server.init.loadToken');
    exApp.locals.token = token;

    var receivedEth = token.filters.ReceivedEth();
    token.on(receivedEth, (from:any, amount:any, event:any) => receivedEthCallback(from, amount, event, exApp));
    logger.info("server.init %s", token.address);

    let metas: Object[] = [];                   // list of the Nfts loaded from the smart contract
    let metasMap = new Map<String, any>();      // Same but as a map
    let icons = new Map();                      // Icons of the Nfts
    let images = new Map();                     // Images of the Nfts

    exApp.locals.metas = metas;
    exApp.locals.metasMap = metasMap;
    exApp.locals.icons = icons;
    exApp.locals.images = images;


    if (!fs.existsSync(config.cacheFolder)) fs.mkdirSync(config.cacheFolder);
    if (!fs.existsSync(config.invoiceFolder)) fs.mkdirSync(config.invoiceFolder);

    const QRaddr: string = path.join(config.cacheFolder, token.address + '.png');
    if(!fs.existsSync(QRaddr)) await QRCode.toFile(QRaddr, token.address);
    const QRaddrBtc: string = path.join(config.cacheFolder, config.bitcoinAddr + '.png');
    if(!fs.existsSync(QRaddrBtc)) await QRCode.toFile(QRaddrBtc, token.address);

    let i: number = 0;
    let str: string, strToken: string;
    let data: any;
    let loop: boolean = true;
    let errTimeout: number = 0;
    let collections:any;
    let key:string;


    //
    // Loading the collection definition
    //

    async function loadCollections() {
        let cols:any;
        logger.info('server.init.loadingCollections from %s', exApp.locals.ipfsFolder);

        str = exApp.locals.ipfsFolder.replace('ipfs:', 'https:').replace('/{id}.json', '.ipfs.dweb.link/' + 'collections.json'); //TODO parametrize the ipfs gateway
        let resp = await axios.get(str); //We retrieve the collections from ipfs
        if (resp.status == 200) {
            cols = resp.data;

            for (key in cols) {
                if(cols[key].image !== undefined) {
                    if (await loadFromIpfs(cols[key].image) != '') cols[key].imageUrl = config.imgCollectionUrl + key;
                }
                if(cols[key].map !== undefined) {
                    if (await loadFromIpfs(cols[key].map) != '') cols[key].mapUrl = config.mapCollectionUrl + key;
                }
            }
        }
        else logger.error('server.init.loadingCollections.errorLoadingCollections %s', resp.status);

        return cols;
    }

    // Retrieve the past events on this contract to find out which id have been minted
    // Mints are coming from address '0x0000000000000000000000000000000000000000' and can be performed by any operator (first topic)
    const events = await token.queryFilter(
        token.filters.TransferSingle(null, "0x0000000000000000000000000000000000000000"),
        0,
        "latest",
    );

    const eventsB = await token.queryFilter(
        token.filters.TransferBatch(null, "0x0000000000000000000000000000000000000000"),
        0,
        "latest",
    );

    var rawIds: any[] = [];
    var ids: any[] = [];
    events.forEach((evt) => rawIds.push(evt?.args?.id));
    eventsB.forEach((evt) => rawIds.push(...evt?.args?.ids));
    ids = rawIds.filter((value, index, self) =>
        index === self.findIndex((t) => (t.eq(value))));

    for (i = 0; i < ids.length; i++) {
        const id = ids[i];
        strToken = await token.uri(id);
        exApp.locals.ipfsFolder = strToken;

        if (i == 0) {
            collections = await loadCollections();
            exApp.locals.collections = collections;
        }

        str = strToken.replace('ipfs:', 'https:').replace('/{id}', '.ipfs.dweb.link/' + id); //TODO parametrize the ipfs gateway

        if (errTimeout == 2) break; // If we face a timeout we retry twice

        try {
            var dataFromDb = dbPos.findToken(token.address + id );
            if (dataFromDb == null) {
                logger.info("server.init.loadTokens.fromIpfs %s", str);
                let resp = await axios.get(str); // The data is not in cache, we retrieve the JSON from Ipfs
                data = resp.data;
                data.id = token.address + id;
                data.tokenIdStr = id?.toString();
                data.tokenId = id;
                data.addr = token.address;
                data.isLocked = false;
                data.price = 0;
                //tokens.insert(data);
                dbPos.insertNewToken(data);
            } else {
                data = JSON.parse(dataFromDb.jsonData);
                data.price = dataFromDb.price;
                data.isLocked = dataFromDb.isLocked;
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

        for (key in collections) {
            if(collections[key].tokenIds.find((eltId: string) => parseInt(eltId) == data.tokenIdStr) !== undefined) data.collectionId = key;
        }

        metas.push(data);
        metasMap.set(data.id, data);

        errTimeout = 0;
    }

    if (exApp.locals.wallet !== null) connectToken(exApp.locals.wallet, exApp);

    //
    // Retrieve all the ipfs resources
    //
    let buf: Buffer;

    const getIcons = Promise.all(
        metas.map(async (meta: any) => {
            let key:string;

            for (key in meta) {
                if (typeof meta[key] !== 'string' && !(meta[key] instanceof String)) continue;
                if (meta[key].indexOf('ipfs://') == -1) continue;

                let cid = config.cacheFolder + meta[key].replace("ipfs://", ""); // We remove the ipfs prefix to only keep the cid
                let icon = meta[key].replace("ipfs", "https").concat(".ipfs.dweb.link"); // We form an url for dweb containing the ipfs cid
                try {
                    if (fs.existsSync(cid)) {
                        // We try to find this cid in the cache
                        logger.info("server.init.loadResource.cache %s, %s, cid %s", meta.tokenIdStr, key, cid);
                        buf = Buffer.from(fs.readFileSync(cid, { encoding: "binary" }), "binary");
                    } else {
                        // Not available in the cache, we get it from ipfs
                        logger.info("server.init.loadResource.ipfs %s, %s, cid %s", meta.tokenIdStr, key, cid);
                        const resp = await axios.get(icon, { responseType: "arraybuffer" });
                        buf = Buffer.from(resp.data, "binary");
                        if(key == 'model') {
                            fs.writeFileSync(cid + '.stl', buf, { flag: "w", encoding: "binary" }); // Save the file in cache
                            await convertSTLIntoGLTF(cid + '.stl', cid + '.gltf');
                            fs.renameSync(cid + '.gltf', cid);
                        } else
                            fs.writeFileSync(cid, buf, { flag: "w", encoding: "binary" }); // Save the file in cache
                    }

                } catch (error) {
                    logger.error("server.init.loadResource %s", error);
                }

                icons.set(meta.id + key, buf);

                meta[key + 'Url'] = config.resourceUrl + meta.id + '&type=' + key;      // Reference the resource's url

                // Compatibility mode with previous versions and the rest of the code
                if (key == 'image_raw') {
                    meta.imgUrl = config.imgUrl + meta.id;                              // Reference the image's url
                    images.set(meta.id, buf);
                }
                if (key == 'image') {
                    meta.iconUrl = config.iconUrl + meta.id;                            // Reference the icon's url
                    icons.set(meta.id, buf); // Store the icon in memory
                }
            }
        }),
    );

    //
    // Retrieve the images, looking at the cache in case the image has been already retrieved
    //
    // const getImages = Promise.all(
    //     metas.map(async (meta: any) => {
    //         let cid = config.cacheFolder + meta.image_raw.replace("ipfs://", "");
    //         try {
    //             if (fs.existsSync(cid)) {
    //                 logger.info("server.init.loadImages.cache %s", cid);
    //                 buf = Buffer.from(fs.readFileSync(cid, { encoding: "binary" }), "binary");
    //             } else {
    //                 logger.info("server.init.loadImages.ipfs %s", cid);
    //                 let image = meta.image_raw.replace("ipfs", "https").concat(".ipfs.dweb.link");
    //                 const resp = await axios.get(image, { responseType: "arraybuffer" });
    //                 buf = Buffer.from(resp.data, "binary");
    //                 fs.writeFileSync(cid, buf, { flag: "w", encoding: "binary" });
    //             }

    //             images.set(meta.id, buf);
    //         } catch (error) {
    //             logger.error("server.init.loadIcons %s", error);
    //         }

    //         meta.imgUrl = config.imgUrl + meta.id;
    //     }),
    // );

    await Promise.all([getIcons]);

    const imageProperties = ['iso1', 'bottom', 'iso2', 'right', 'front', 'left', 'iso3', 'top', 'iso4'];

    metas.map((meta:any) => {
        let key: string;
        meta.images = new Array<string>(imageProperties.length);

        for(key in meta) {
            const index = imageProperties.indexOf(key);                                              // Is this resource an image?
            if (index != -1) meta.images[index] = config.resourceUrl + meta.id + '&type=' + key;
        }
    });


    logger.info('server.init.loadTerminated');
}

async function loadFromIpfs(cidUrl:string) :Promise<string> {
    const cid = cidUrl.replace('ipfs://','');
    if (fs.existsSync(config.cacheFolder + cid)) {
        logger.info('server.loadFromIpfs.inCache %s', cid);
        return cid;
    }

    logger.info('server.loadFromIpfs.fromIpfs %s', cid);
    const resp = await axios.get('https://' + cid + '.ipfs.dweb.link', { responseType: "arraybuffer" });
    if (resp.status == 200) {
        let buf:Buffer = Buffer.from(resp.data, "binary");
        fs.writeFileSync(config.cacheFolder + cid, buf, { flag: "w", encoding: "binary" });
        return cid;
    }
    else {
        logger.warn('server.loadFromIpfs.error %s', cid);
        return '';
    }
}

const loadQuestionnaire = async (exApp: any) => {

    // Retrieve the past events on this contract to find out which votes have been created
    const events = await exApp.locals.token.queryFilter( exApp.locals.token.filters.VoteCreated(),  0, "latest" );
    exApp.locals.votes = [];

    events.forEach((evt:any) => {
        let voteId: number = evt.args.voteId.toNumber();
        exApp.locals.token.getVoteById(voteId).then((vote:any) => {
            const voteId = vote[0].toHexString();

            if (dbPos.findOneQuestionnaire(voteId) == null) {
                logger.info('server.loadQuestionnaire %s', voteId);

                loadFromIpfs(vote[1].cid).then((file) => {
                    if (file != '') {
                        const jsonData = fs.readFileSync(config.cacheFolder + file);
                        logger.info('server.insertQuestionnaire %s', voteId);
                        dbPos.insertNewQuestionnaire(exApp.locals.token.address + voteId, voteId, vote[1].cid, vote[1].hash.toHexString(), jsonData.toString() );
                        loadVotes(exApp, vote[0]);
                    }
                })
            }
        });
    });
}

const connectToken = async (wallet:Wallet, app:any) => {

    app.locals.token = app.locals.token.connect(app.locals.wallet);
    logger.info('server.connectedToken.withWallet');

    await Promise.all(app.locals.metas.map(async (nft: any, index: number) => {
        let balance = await app.locals.token.balanceOf(app.locals.wallet.address, nft.tokenId);
        app.locals.metas[index].availableTokens = balance.toString();
        app.locals.metas[index].isLocked = balance.isZero();
    }));
}

const loadVotes = async (exApp: any, voteId : BigNumber) => {
    const ballots = await exApp.locals.token.getBallots(voteId);

    for(var i = 0 ; i < ballots.length ; i++) {
        const voteFullId:string = exApp.locals.token.address + voteId.toHexString();
        if(dbPos.findOneVote(voteFullId, ballots[i].from) == null)
            dbPos.insertNewVote(voteFullId, ballots[i].from, JSON.stringify({from: ballots[i].from, voteId: voteId, data: ballots[i].data }));
    }
}

export { init, loadToken, connectToken };
