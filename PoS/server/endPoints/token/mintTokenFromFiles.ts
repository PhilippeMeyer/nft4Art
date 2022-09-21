import fs from 'fs';
import os from 'os';
import path from 'path';
import { Request, Response } from "express";
import sharp from 'sharp';
import { NFTStorage, File, Blob } from 'nft.storage';
import { filesFromPath } from 'files-from-path'
import axios from "axios";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";

import { app } from "../../app.js";
import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";
import generateAnimatedGif from '../../services/generateAnimatedGif.js'

let tmpDir;
const appPrefix = 'nft4art';

//
// batchMintStart
//
// This end point has no parameter
//
// This end point is used to initiate the minting of a collection.
//
// It creates a temp folder where all the metadata files will be stored (copying first the old content if any) and stores in
// app.locals.batchMintTokenId the last tokenId minted of the collection (in case the tokenIds are not already attributed) and in
// app.locals.batchMintFolder the folder where the files are stored
//

async function batchMintStart(req: Request, res: Response) {
    try {
        app.locals.batchMintFolder = fs.mkdtempSync(path.join(os.tmpdir(), appPrefix));
        // TODO find the first free token 
        app.locals.batchMintTokenId = 0;
        app.locals.batchMintTokens = [];

        if (app.locals.ipfsFolder !== undefined) {
            let ipfsFolder = app.locals.ipfsFolder;
            const folder:string = ipfsFolder.replace('/{id}.json', '').replace('ipfs://','');
            logger.info('server.batchMintStart.loadingFolder %s', folder)
            await readIpfsFolder(folder, app.locals.batchMintFolder);
        }

        res.sendStatus(200);
        
    } catch(err) {
        logger.error('server.batchMintStart.error %s', err);
        res.sendStatus(500);
    }
    
}

//
// batchMintTokenFromFiles
//
// Transfer a token to be minted
//
// Parameters: formdata containing:
//  - the files associated to the token
//  - properties:
//      - image_raw: name of the file containing the image
//      - numTokens: number of tokens to mint. default is 1
//      - tokenId: tokenId of the token, if not provided, it will be incremented
//      - description: decription of the token
//      - author: token's author
//      - name: token's name
//
// The files are stored on ipfs and their correponding cid inserted in the json describing the token
// All the provided properties are copied into the json file which saved into the temp folder
//

async function batchMintTokenFromFiles(req: Request, res: Response) {
    let tokenId:string;
    let numTokens:string;

    try {
        logger.info('server.mintFromFiles.createFolder: %s', app.locals.batchMintFolder);

        // Find among the fileds a field named image_raw which should point to the file containing the image
        if (req.body.image_raw === undefined) {
            logger.info('server.batchMintTokenFromFiles.noLabelToImage');
            res.status(400).json({error: {name: 'noLabelToImage', message: 'No label to image has been provided'}});
            return;
        }

        const files: any[] = req.files as any[];
        const image_raw: any = files.find((file) =>  file.fieldname == req.body.image_raw);

        if( image_raw === undefined) {
            logger.info('server.batchMintTokenFromFiles.noImageProvided');
            res.status(400).json({error: {name: 'noImageProvided', message: 'No image has been provided'}});
            return;
        }

        numTokens = (req.body.numTokens === undefined) ? '1' : req.body.numTokens;

        const client = new NFTStorage({ token: config.nftSorageToken });
        var metadata: any = {};

        for (const file of files) {
            var cid = await client.storeBlob(new Blob([file.buffer]));
            logger.info('server.mintFromFiles.createIpfsFile %s', cid);
            metadata[file.fieldname] = "ipfs://" + cid;
        }

        const vignette = await sharp(image_raw.buffer).resize({width:350}).jpeg().toBuffer();
        var cid = await client.storeBlob(new Blob([vignette]));
        logger.info('server.mintFromFiles.createIpfsVignette %s', cid);
        metadata.image = "ipfs://" + cid;  

        let key;
        for (key in req.body)  metadata[key] = req.body[key];
        
        if(req.body.tokenId === undefined) {
            tokenId = app.locals.batchMintTokenId.toString();
            app.locals.batchMintTokenId++;
        }
        else 
            tokenId = req.body.tokenId;
        
        const tid = parseInt(tokenId); 
        fs.writeFileSync(path.join(app.locals.batchMintFolder, tid.toString() + ".json"), JSON.stringify(metadata));
        metadata.tokenId = tokenId;
        app.locals.batchMintTokens.push(metadata);

        const token:Contract = app.locals.token;
        const txResp = await token.mint(tokenId, numTokens, []);
        const txReceipt = await txResp.wait();

        res.sendStatus(200);

    } catch(err) {
        logger.error('server.batchMintTokenFromFiles.error %s', err);
        res.sendStatus(500);
    }
}

//
// batchMintFinalize
//
// Finalize the uploas of a token collection
//
// Parameters passed into a formdata:
//  - collection property containing a stringified json object describing the collections
//  - an optional picture of the collection map and a mapping file of the collection
//
// This end point completes the token mint which has been started iterating through the batchMintTokenFromFiles endpoint
// It is storing and merging the collection description with the previous collection description (stored in the collections.json file)
// It also loads the optional files on ipfs adding the corresponding properties in the collection object
// To finalize the mint, when all the resources have been settled, the temp folder which contains all the json ressources is pushed to ipfs
// Those two optional ressources have to referenced by the "image" and "map" properties in the collection object to be taken into account
//

async function batchMintFinalize(req: Request, res: Response) {
    let key: any;
    let newCol:any = {};

    try {
        const client = new NFTStorage({ token: config.nftSorageToken });

        if(req.body.collections !== undefined) {

            newCol = JSON.parse(req.body.collections);

            // Looking for the collections images and maps
            const files: any[] = req.files as any[];

            for (key in newCol) {
                if (newCol[key].image == undefined) {           // No image of the collection is has been provided. Creating one as an animated GIF
                    const fileName = key + '.gif';
                    generateAnimatedGif(newCol[key], fileName, app.locals.batchMintTokens, app.locals.batchMintFolder);
                    let data = fs.readFileSync(fileName);
                    var imageCid = await client.storeBlob(new Blob([data]));
                    newCol[key].image = 'ipfs://' + imageCid;
                    logger.info('server.batchMintFinalize.createAnimatedGif %s %s', fileName, imageCid);
                }
                else {                
                    const image: any = files.find((file) =>  file.fieldname == newCol[key].image);
                    if(image == null) continue; 
                    var imageCid = await client.storeBlob(new Blob([image.buffer]));
                    newCol[key].image = 'ipfs://' + imageCid;
                    logger.info('server.batchMintFinalize.storeImage %s', imageCid);
                }

                if(newCol[key].map == undefined) continue;

                const map: any = files.find((file) =>  file.fieldname == newCol[key].map);
                if(map == null) continue;        
                
                var mapCid = await client.storeBlob(new Blob([map.buffer]));
                logger.info('server.batchMintFinalize.storeMap %s', mapCid);
                newCol[key].map = 'ipfs://' + mapCid;
            }
            
            // Finding the old collections.json if it exists
            let colFilename = app.locals.batchMintFolder + '/' + 'collections.json';
            if(fs.existsSync(colFilename)) {
                // Merging the old collections.json with the new collections (to be noted that the new collection superseeds the old definition)
                const data = fs.readFileSync(colFilename);
                const collection = JSON.parse(data.toString());
                for (key in newCol)  collection[key] = newCol[key];
                newCol = collection;
            }
            fs.writeFileSync(colFilename, JSON.stringify(newCol));
        }

        const files = filesFromPath(app.locals.batchMintFolder, { pathPrefix: path.resolve(app.locals.batchMintFolder), hidden: false });
        const cid = await client.storeDirectory(files);
        const oldFolder:string =  app.locals.ipfsFolder;
        app.locals.ipfsFolder = cid;

        const token:Contract = app.locals.token;
        const txResp = await token.setDefaultURI('ipfs://' + cid + '/{id}.json');
        const txReceipt = await txResp.wait();
        logger.info('server.mintFromFiles.uriInserted %s', cid);

        if(oldFolder !== undefined) {
            logger.info('server.batchMintFinalize.deleteOldIpfsFolder %s', oldFolder);
            try {
                const ret = await client.delete(oldFolder.replace('/{id}.json', '').replace('ipfs://',''));
            } catch(err) { logger.error('server.batchMintFinalize.deleteFailed %s', err); }
        }

        res.sendStatus(200);

    } catch(err) {
        logger.error('server.batchMintFinalize.error %s', err);
        res.sendStatus(500);
    }
}

//
// readIpfsFolder
// 
// Parameters: 
//  - the CID of the Ipfs folder to copy
//  - the destination folder on the local filesystem
//
// This function copies the content of the ipfs folder into the local folder in order to merge together old and new content
// When new tokens are minted, the metadata files will be added into the same folder and when the minting is finalized the whole folder containing 
// old and new metadata files is then transferred to Ipfs
//    
async function readIpfsFolder(cid: string, folder:string) {
    let res:any = await axios('https://dweb.link/api/v0/ls?arg=' + cid);        //TODO Parametrize the request to the IPFS Gateway

    if(res.data.Objects === undefined) return null;

    res.data.Objects[0].Links.forEach( async (file:any) => {
        const results = await axios({
            method: "get",
            url: 'https://' + file.Hash + '.ipfs.dweb.link',
            responseType: "stream"});

        if (results.status != 200) {
            logger.error('server.readIpfsFolder.errFetchExisting');
            return null;
        }
        if(results.data === undefined || results.data == null) {
            logger.error('server.readIpfsFolder.errFetchExisting');
            return null;
        }

        const writeStream = fs.createWriteStream(folder + "/" + file.Name);
        results.data.pipe(writeStream);
    });
}


export { batchMintStart, batchMintTokenFromFiles, batchMintFinalize };