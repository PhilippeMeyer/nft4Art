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
import ethers from 'ethers';
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";




if (process.argv[2] === undefined) { console.error('No filename provided'); process.exit(0);}
if (process.argv[3] === undefined) { console.error('No password provided'); process.exit(0);}
if (process.argv[4] === undefined) { console.error('No folder cid provided'); process.exit(0);}

const cid = process.argv[4];
let data = fs.readFileSync(process.argv[2]);
let wallet = ethers.Wallet.fromEncryptedJsonSync(data.toString(), process.argv[3]);
const ethProvider = await new ethers.providers.InfuraProvider(config.network, config.infuraKey);
const signer = wallet.connect(ethProvider);

const contractAddress:string = '0xEE7D141E8D4c3d5d1A4E6106d3C03C2470d35C09';

console.log(config.gvdNftAbiFile);
let rawAbi = fs.readFileSync(config.gvdNftAbiFile);
const gvdNftDef = JSON.parse(rawAbi.toString());

const tok = await new Contract(contractAddress, gvdNftDef.abi, ethProvider);
const token = tok.connect(signer);

const txResp = await token.setDefaultURI('ipfs://' + cid + '/{id}.json');
const txReceipt = await txResp.wait();
console.info('server.mintFromFiles.uriInserted %s', cid);

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
const videoFile =  '/2022_Morphogenesis_Outside.mp4';
const modelFile =  '/2022_Morphogenesis_Outside_2022-09-08.fbx';
const imageFile =  '2022_Morphogenesis_Outside_VisibleOnly.png';
const videoModelTokenId = '1';

// Token 101 - 131: shards
//
// The metadata contains:
// - The model of the shard
// - The global 9 views picture
// - An individual image of each view of the shard
const modelRegex: RegExp = /Shard_(\d+).STL/g;
const globalImageRegex: RegExp = /Shard_(\d+).AI.png/;
const imageRegex: RegExp = /2022_Morphogenesis_Outside_Shard(\d+)-(\d+).jpg/;
const properties = ['','iso1', 'bottom', 'iso2', 'right', 'front', 'left', 'iso3', 'top', 'iso4'];

// Token 201 - 231: drawings of the shards
//
// The metadata contains:
// - The global 9 views picture (globalImageRegex)

// Token 301 - 309 : drawings of the shere
//
// The metadata contains:
// - the svg of that view of the sphere
const spherePictRegex: RegExp = /2022_Morphogenesis_Outside_VisibleOnly_(\d+).svg/;


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
            let infoModel, infoImage, infoGlobal, infoSphere, nbTokens, id;
            
            infoModel = modelRegex.exec(element);
            infoImage = imageRegex.exec(element);
            infoGlobal = globalImageRegex.exec(element);
            infoSphere = spherePictRegex.exec(element);
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
                console.log(shardId, element);
                property = 'sphere';
                colstr = 'Drawings';
                nbTokens = 23;
                id = infoSphere[1];
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

    let key:string;

    console.log('Minting the Following collections of tokens');   
    console.log(collection);
    console.log('Individual tokens:')
    for (key in json) console.log(key, json[key]);
    console.log('\n\nStarting the minting process...');

    for (key in json) {

        const txResp = await token.mint(key, json[key]._nbTokens, []);
        const txReceipt = await txResp.wait();
        console.log('Minted token #', key);
    }

    console.log('\nFinalizing the minting process...');
}

mintSpheresFinal();