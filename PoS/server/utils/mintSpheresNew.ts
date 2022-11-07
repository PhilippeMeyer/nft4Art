import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { regex } from 'uuidv4';
import { exit } from 'process';

const server = 'http://localhost:8999';
const urlMint = server + '/apiV1/token/batchMintTokenFromFiles';
const urlMintStart = server + '/apiV1/token/batchMintStart';
const urlMintFinalize = server + '/apiV1/token/batchMintFinalize';
const dirFolder = '/home/philippe/Desktop/nft4ArtImages/toBeLoaded';


//
// mintSpheres
//
// Performs the mint of all the files located in the dirFolder
//
// The filename format is the following:
//  - xxyyAA or xxyyBB where xx is the collection id and yy is the token id within the collection
//    AA means that the picture is a front picture and BB means that it is a back picture
//  - xx_img is the image which presents the whole collection (optional)
//  - xx_map is the map which describes where the tokens are located on the image collection
//
async function mintSpheres() {
    let colstr: string;
    let tokenId: string;
    let property: string;
    let info:any;
    let name: string;
    let shardId: string;
    let collection: any = {};
    let json: any = {};

    const modelRegex: RegExp = /Shard_(\d+).STL/g;
    const globalImageRegex: RegExp = /Shard_(\d+).AI.png/;
    const imageRegex: RegExp = /2022_Morphogenesis_Outside_Shard(\d+)-(\d+).jpg/;
    const properties = ['','iso1', 'bottom', 'iso2', 'right', 'front', 'left', 'iso3', 'top', 'iso4'];

    fs.readdirSync(dirFolder).forEach(element => {
        let infoModel, infoImage, infoGlobal;
        
        infoModel = modelRegex.exec(element);
        infoImage = imageRegex.exec(element);
        infoGlobal = globalImageRegex.exec(element);

        if (infoModel != null) {
            if (infoModel[1] == null || infoModel[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
            shardId = infoModel[1];
            property = 'model';
        }
        if (infoGlobal != null) {
            if (infoGlobal[1] == null || infoGlobal[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
            shardId = infoGlobal[1];
            property = 'overview'
        }
        if (infoImage != null) {
            if (infoImage[1] == null || infoImage[1] === undefined) { console.log('Error loading ', element); process.exit(-1); }
            shardId = infoImage[1];
            property = properties[Number(infoImage[2])];
        }

        colstr = 'PuzzleOfaMaze';

        if(collection[colstr] === undefined) {                      // Initializing the collection with a set to store all the tokens
            collection[colstr] = {};
            collection[colstr].tokenSet = new Set<string>();
        }

        if(json[shardId] == undefined) {
            json[shardId] = {};
            collection[colstr].tokenSet.add(shardId);
        }

        json[shardId][property] = element;                   
    });


    let k:any;
    for(k in collection) {
        collection[k].tokenIds = Array.from(collection[k].tokenSet);
        delete collection[k].tokenSet;
    }

    let key:string;

    console.log('Minting the Following collections of tokens');   
    console.log(collection);
    console.log('Individual tokens:')
    for (key in json) console.log(json[key]);
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
            fileStream = fs.createReadStream(dirFolder + "/" + token[prop]);
            formData.append(prop, fileStream);
        }

        formData.append('tokenId', key);
        formData.append('description', 'Shard #' + key);
        formData.append('author', 'Thomas Julier');
        formData.append('image_raw', json[key].front);
        console.log('image_raw', json[key].front);
        formData.append('name', 'Puzzle of a Maze - shard #' + key);
    
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

mintSpheres();
