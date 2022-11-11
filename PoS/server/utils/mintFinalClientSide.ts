import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import path from 'path';
import os from 'os';
import "dotenv/config";
import mime from 'mime';
import * as dbPos from "../services/db.js"
import { NFTStorage, File, Blob } from 'nft.storage';
import { config } from "../config.js";
import sharp from 'sharp';
import { filesFromPath } from 'files-from-path';
import * as ji from 'join-images';
//const joinImages = require('join-images').default;


const server = 'http://localhost:8999';
const urlMint = server + '/apiV1/token/batchMintTokenFromFiles';
const urlMintStart = server + '/apiV1/token/batchMintStart';
const urlMintFinalize = server + '/apiV1/token/batchMintFinalize';



//
// mintSpheresFinal
//
// Performs the mint of all the tokens following this convention:
//
// The final version of the tokens is: 
// - tokens of 3D shards: 31 tokens, 1 unit
//   - name : shard x
//   - description: puzzle of a maze (external morphogenesis) - shard x
//   - id: 101 - 131
//
// - tokens of 2D sphere: 9 tokens, 23 units
//   - name:  drawing sphere x
//   - description: puzzle of a maze (external morphogenesis) - drawing sphere x
//   - id : 201 - 209
//  
// - tokens of the 3D model and video: 1 token, 489 units
//   - name: 3D and video
//   - description: puzzle of a maze (external morphogenesis) - 3D model and video
//   - id: 1
//
// The server is in charge to bundle the tokens together:
// When a customer buys a 3D shard, for example the id:101, he gets:
// - tokenId 101
// - tokenId 1
//
// When a customer buys a drawing of the sphere, for example id:301, he gets:
// - tokenId 301
// - tokenId 1
//
// When a customer buys the video of the piece of art, he gets:
// - tokenId 1
//
// On top we'll have collections that are organized along the packages
//
// Collection1: Video  which contains only tokenId: 1
// Collection2: Drawings, contains tokensIds: 201-209
// Collection3: Shards, contains tokenIds 101-131
//
//

const dirFolder = '/home/philippe/Desktop/nft4ArtImages/toBeLoaded';

// Token 1 : Video and model
const videoFile =  '/2022_Morphogenesis_Exterior_Camera01.mp4';
const modelFile =  '/2022_Morphogenesis_Exterior_Assembly.fbx';
const imageFile =  '2022_Morphogenesis_Exterior_Camera01_Frame0001.jpg';
const videoModelTokenId = '1';

// Token 101 - 131: shards
//
// The metadata contains:
// - The model of the shard
// - The global 9 views picture
// - An individual image of each view of the shard
const modelRegex: RegExp = /2022_Morphogenesis_Exterior_Shard(\d+).STL/g;
const globalImageRegex: RegExp = /Shard_(\d+).AI.png/;
const imageRegex: RegExp = /2022_Morphogenesis_Exterior_Shard(\d+)-(\d+).jpg/;
const vectorRegex: RegExp = /2022_Morphogenesis_Exterior_Shard(\d+)-(\d+).svg/;
const properties = ['','iso1', 'bottom', 'iso2', 'right', 'front', 'left', 'iso3', 'top', 'iso4'];
const propertiesVector = ['','iso1V', 'bottomV', 'iso2V', 'rightV', 'frontV', 'leftV', 'iso3V', 'topV', 'iso4V'];

// Token 201 - 231: drawings of the shards
//
// The metadata contains:
// - The global 9 views picture (globalImageRegex)

// Token 301 - 309 : drawings of the shere
//
// The metadata contains:
// - the svg of that view of the sphere
const spherePictRegex: RegExp = /2022_Morphogenesis_Exterior_VisibleOnly_(\d+).svg/;


async function fileFromPath(filePath:string) {
    const content = await fs.promises.readFile(filePath);
    const type = mime.getType(filePath) || undefined;
    return new File([content], path.basename(filePath), { type })
}

async function mintSpheresFinal() {
    let colstr: string;
    let tokenId: string;
    let property: string;
    let info:any;
    let name: string;
    let shardId: string;
    let collection: any = {};           // Final object contaning the collections, the key is the collection name
    let json: any = {};                 // Final object which contains all the metadat for each token. the key is the tokenId


    function readFiles(json:any, collection:any) {

        fs.readdirSync(dirFolder).forEach(element => {
            let infoModel, infoImage, infoGlobal, infoSphere, infoVector, nbTokens, id;
            
            infoModel = modelRegex.exec(element);
            infoImage = imageRegex.exec(element);
            infoGlobal = globalImageRegex.exec(element);
            infoSphere = spherePictRegex.exec(element);
            infoVector = vectorRegex.exec(element);
            shardId = '';

            if (infoModel != null) {
                if (infoModel[1] == null || infoModel[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
                shardId = '1' + infoModel[1];
                property = 'model';
                colstr = 'Shards';
                nbTokens = 1;
                id = infoModel[1];
            }
            if (infoGlobal != null) {
                if (infoGlobal[1] == null || infoGlobal[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
                shardId = '1' + infoGlobal[1];
                property = 'overview'
                colstr = 'Shards';
                nbTokens = 1;
                id = infoGlobal[1];
            }
            if (infoImage != null) {
                if (infoImage[1] == null || infoImage[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
                shardId = '1' + infoImage[1];
                property = properties[Number(infoImage[2])];
                colstr = 'Shards';
                nbTokens = 1;
                id = infoImage[1];
            }

            if (infoSphere != null) {
                if (infoSphere[1] == null || infoSphere[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
                shardId = '2' + infoSphere[1];
                property = 'sphere';
                colstr = 'Drawings';
                nbTokens = 23;
                id = infoSphere[1];
            }

            if (infoVector != null) {
                if (infoVector[1] == null || infoVector[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
                shardId = '1' + infoVector[1];
                property = propertiesVector[Number(infoVector[2])];;
                colstr = 'Shards';
                nbTokens = 1;
                id = infoVector[1];
            }

            if (shardId != '') {
                if(collection[colstr] === undefined) {                      // Initializing the collection with a set to store all the tokens
                    collection[colstr] = {};
                    collection[colstr].tokenSet = new Set<string>();
                }

                if(json[shardId] == undefined) {
                    json[shardId] = {};
                    collection[colstr].tokenSet.add(shardId);
                }

                json[shardId][property] = element;
                json[shardId]['_type'] = colstr;
                json[shardId]['_nbTokens'] = nbTokens;
                json[shardId]['_id'] = id;
            }
        });

        json[videoModelTokenId] = {};
        json[videoModelTokenId]["video"] = videoFile;
        json[videoModelTokenId]["model"] = modelFile;
        json[videoModelTokenId]["sphere"] = imageFile;
        json[videoModelTokenId]["_type"] = "Video";
        json[videoModelTokenId]["_nbTokens"] = 489;
        
        collection["Video"] = {};
        collection["Video"].tokenSet = new Set<string>().add("1");

        let k:any;
        for(k in collection) {                                          // Transforming the set of tokens into an array
            collection[k].tokenIds = Array.from(collection[k].tokenSet);
            delete collection[k].tokenSet;
        }
    }

    readFiles(json, collection);

    let it:any;
    
    for(it in json) {
        const k = json[it];

        if(k._type != "Shards") continue;

        for (let i:number = 1 ; i < properties.length ; i++) 
            if (k[properties[i]] === undefined) console.log('property ', properties[i], ' undefined for ', it );
    }

    console.log(collection);
    console.log(json);

/*
    for(it in json) {
        const k = json[it];
        let one, two, all, three:any;

        if(k._type != "Shards") continue;
        console.log('combining ', it);

        one = await ji.joinImages([dirFolder + '/' + k.iso1, dirFolder + '/' + k.bottom, dirFolder + '/' + k.iso2], {direction: 'horizontal', color:{ alpha: 1.0, b: 255, g: 255, r: 225 }, offset: 5, align: 'center'});
        await one.toFile(dirFolder+ '/' + it + '1.png');
        two = await ji.joinImages([dirFolder + '/' + k.right, dirFolder + '/' + k.front, dirFolder + '/' + k.left], {direction: 'horizontal', color:{ alpha: 1.0, b: 255, g: 255, r: 225 }, offset: 5, align: 'center'})
        await two.toFile(dirFolder+ '/' + it + '2.png');
        three = await ji.joinImages([dirFolder + '/' + k.iso3, dirFolder + '/' + k.top, dirFolder + '/' + k.iso4], {direction: 'horizontal', color:{ alpha: 1.0, b: 255, g: 255, r: 225 }, offset: 5, align: 'center'})
        await three.toFile(dirFolder+ '/' + it + '3.png');
        all = await ji.joinImages([dirFolder+ '/' + it + '1.png', dirFolder+ '/' + it + '2.png', dirFolder+ '/' + it + '3.png']);
        await all.toFile(dirFolder+ '/' + it + '_overview.png');
    }
*/    

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mint'));
    console.log('Temp dir created: ', tmpDir);
    const client = new NFTStorage({ token: config.nftSorageToken });

    let key:string;

    console.log('Minting the Following collections of tokens');   
    console.log(collection);
    console.log('Individual tokens:')
    for (key in json) console.log(key, json[key]);
    console.log('\n\nStarting the minting process...');

    for (key in json) {
        let token = json[key];
        let prop:string;
        let fileStream:File;
        let metadata:any = {};
        let imageVignette:string = '';

        for (prop in token) {
            if (prop.startsWith('_')) continue;

            fileStream = await fileFromPath(dirFolder + "/" + token[prop]);
            const cid = await client.storeBlob(fileStream);
            metadata[prop] = 'ipfs://' + cid;
            console.log('Loaded file: ', token[prop], ' cid: ', cid);
        }

        metadata['tokenId'] = key;
        metadata['author'] = 'Thomas Julier';
        metadata['numTokens'] = token._nbTokens;

        if (token._type == 'Shards') {
            imageVignette = json[key].front;
            metadata['description'] = 'Shard #' + token._id;
            metadata['name'] = 'Puzzle of a maze - Shard #' + token._id;
        } 
        else if(token._type == 'Drawings') {
            imageVignette = json[key].sphere;
            metadata['description'] = 'Sphere #' + token._id;
            metadata['name'] = 'Puzzle of a maze - Drawing #' + token._id;
        }
        else if(token._type == 'Video') {
            imageVignette = json[key].sphere;
            metadata['description'] = 'Video and Model';
            metadata['name'] = 'Puzzle of a maze - Video and Model';
        }

        const vignette = await sharp(dirFolder + "/" + imageVignette).resize({width:350}).png().toBuffer();
        var cid = await client.storeBlob(new Blob([vignette]));
        metadata.image = "ipfs://" + cid;
        console.log('Loaded vignette for %s, - cid: %s', key, cid)  ;

        fs.writeFileSync(path.join(tmpDir, key + '.json'), JSON.stringify(metadata));
    }

    console.log('\nFinalizing the minting process...');
    
    fs.writeFileSync(path.join(tmpDir, 'collections.json'), JSON.stringify(collection));
    const files = filesFromPath(tmpDir, { pathPrefix: path.resolve(tmpDir), hidden: false });
    const cidFolder = await client.storeDirectory(files);

    console.log('Minting finalized - cid folder: ', cidFolder);
}

mintSpheresFinal();
