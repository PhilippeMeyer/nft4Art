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




if (process.argv[2] === undefined) { console.error('No wallet filename provided'); process.exit(0);}
if (process.argv[3] === undefined) { console.error('No password provided'); process.exit(0);}
if (process.argv[4] === undefined) { console.error('No folder cid provided'); process.exit(0);}

const cid = process.argv[4];
let data = fs.readFileSync(process.argv[2]);
let wallet = ethers.Wallet.fromEncryptedJsonSync(data.toString(), process.argv[3]);
const ethProvider = await new ethers.providers.InfuraProvider(config.network, config.infuraKey);
const signer = wallet.connect(ethProvider);

const contractAddress:string = '0x5A734B65251954E70102AFe9bbC4Ac767d07905A';

console.log(config.gvdNftAbiFile);
let rawAbi = fs.readFileSync('../' + config.gvdNftAbiFile);
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


// Token 1 : Video and model
// Token 101 - 131: shards
//
// The metadata contains:
// - The model of the shard
// - The global 9 views picture
// - An individual image of each view of the shard
//
// Token 201 - 231: drawings of the shards
//
// The metadata contains:
// - The global 9 views picture (globalImageRegex)
//
// Token 301 - 309 : drawings of the shere
//
// The metadata contains:
// - the svg of that view of the sphere


const toBeMinted = [
    { start: 1, end: 1, nbtokens: 489 },
    { start: 101, end: 131, nbtokens: 1 },
    { start: 201, end: 209, nbtokens: 23 },
];

async function mintSpheresFinal() {

    let ids = new Array<number>();
    let qty = new Array<number>();

    toBeMinted.forEach((range) => {
        for(let i:number = range.start ; i <= range.end ; i++) {
            ids.push(i);
            qty.push(range.nbtokens);
        }
    })

    console.log('Minting the Following collections of tokens');   
    console.log(ids, qty);
    console.log('\n\nStarting the minting process...');

    const txResp = await token.mintBatch(ids, qty, []);
    const txReceipt = await txResp.wait();
    console.log('Minted tokens #', ids.length);
}

mintSpheresFinal();
