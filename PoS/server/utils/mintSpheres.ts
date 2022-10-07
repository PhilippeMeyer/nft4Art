import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

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
    let name: string;
    let shardId: string;
    let collection: any = {};
    let json: any = {};

    fs.readdirSync(dirFolder).forEach(element => {
        colstr = element.substring(0,2);

        if(collection[colstr] === undefined) {                      // Initializing the collection with a set to store all the tokens
            collection[colstr] = {};
            collection[colstr].tokenSet = new Set<string>();
        }

        if(element.substring(2,6) == '_img') collection[colstr].image = element;
        else if(element.substring(2,6) == '_map') collection[colstr].map = element;
        else {
            tokenId = element.substring(0,4);                       // tokenId is the collection + the id within the collection
            shardId = element.substring(1,3);
            name = element.substring(4,6) == "AA" ? 'image_front' : 'image_back';

            if(json[tokenId] == undefined) {
                json[tokenId] = {};
                json[tokenId]['image_raw'] = 'image_front';         // This specifies that the image_raw points to the image_front property
                json[tokenId]['tokenId'] = tokenId;
            }
            json[tokenId][name] = element;

            collection[colstr].tokenSet.add(tokenId);
        }
    });

    let k:any;
    for(k in collection) {
        collection[k].tokenIds = Array.from(collection[k].tokenSet);
        delete collection[k].tokenSet;
    }

    let key: string;

    // Fixing some inconsistencies in the dataset
    for (key in json) {
        if(json[key].image_front == undefined) json[key].image = 'image_back';
    }

    console.log('Minting the Following collections of tokens');   
    console.log(collection);
    console.log('Individual tokens:')
    for (key in json) console.log(json[key]);
    console.log('\n\nStarting the minting process...');


    let res: any;
    res = await fetch(urlMintStart, {method: 'POST'})
    console.log('initialisation:', res.status);

    for (key in json) {
        let frontStream:any, backStream:any;
        var formData = new FormData();

        if (json[key].image_front !== undefined) {
            frontStream = fs.createReadStream(dirFolder + "/" + json[key].image_front);
            formData.append('image_front', frontStream);
        }
        if (json[key].image_back !== undefined) {
            backStream = fs.createReadStream(dirFolder + "/" + json[key].image_back);
            formData.append('image_back', backStream);
        }
        formData.append('tokenId', key);
        formData.append('description', 'Shard #' + key.substring(2,4));
        formData.append('author', 'Thomas Julier');
        formData.append('image_raw', json[key].image_raw);
        formData.append('name', 'Sphere #' + key.substring(0,2) + ' explosion simulation - shard #' + key.substring(2,4));
    
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
