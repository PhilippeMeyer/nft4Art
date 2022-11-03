import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { regex } from 'uuidv4';
import { exit } from 'process';

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

        //json[videoModelTokenId] = {};
        //json[videoModelTokenId]["video"] = videoFile;
        //json[videoModelTokenId]["model"] = modelFile;
        //json[videoModelTokenId]["sphere"] = imageFile;
        //json[videoModelTokenId]["_type"] = "Video";
        //json[videoModelTokenId]["_nbTokens"] = 489;
        
        //collection["Video"] = {};
        //collection["Video"].tokenSet = new Set<string>().add("1");

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

    let res: any;
    res = await fetch(urlMintStart, {method: 'POST'})
    console.log('initialisation:', res.status);

    for (key in json) {
        let token = json[key];
        let prop:string;
        let fileStream:any;
        var formData = new FormData();

        for (prop in token) {
            if (prop.startsWith('_')) continue;

            fileStream = fs.createReadStream(dirFolder + "/" + token[prop]);
            formData.append(prop, fileStream);
        }

        formData.append('tokenId', key);
        formData.append('author', 'Thomas Julier');
        formData.append('numTokens', token._nbTokens);

        if (token._type == 'Shards') {
            formData.append('image_raw', json[key].front);
            formData.append('description', 'Shard #' + token._id);
            formData.append('name', 'Puzzle of a maze (external morphogenesis) - Shard #' + token._id);
        } 
        else if(token._type == 'Drawings') {
            formData.append('image_raw', json[key].sphere);
            formData.append('description', 'Sphere #' + token._id);
            formData.append('name', 'Puzzle of a maze (external morphogenesis) - Drawing #' + token._id);
        }
        else if(token._type == 'Video') {
            formData.append('image_raw', json[key].sphere);
            formData.append('description', 'Video and Model');
            formData.append('name', 'Puzzle of a maze (external morphogenesis) - Video and Model');
        }
        console.log('starting minting #', key);
        res = await fetch(urlMint, {method: 'POST', body: formData});
        console.log('creation of:', key, ' status:', res.status);
    }

    console.log('\nFinalizing the minting process...');
    
    var stream:any;
    var formData = new FormData();
    
    for (key in collection) {
        if(collection[key].image !== undefined) {
            stream = fs.createReadStream(dirFolder + "/" + collection[key].image);
            formData.append(collection[key].image, stream);
        }
        if(collection[key].map !== undefined) {
            stream = fs.createReadStream(dirFolder + "/" + collection[key].map);
            formData.append(collection[key].map, stream);
        }
    }

    formData.append('collections', JSON.stringify(collection));
    res = await fetch(urlMintFinalize, {method: 'POST', body: formData});
    console.log('Minting finalized, status: ', res.status);
}

mintSpheresFinal();
