import "dotenv/config";
import * as dbPos from "../services/db.js"
import { NFTStorage, File, Blob } from 'nft.storage';
import { config } from "../config.js";


dbPos.initDb(config);

const tokens = dbPos.findAllTokens();

const client = new NFTStorage({ token: config.nftSorageToken });
let files:string[] = new Array<string>();

tokens.forEach((tk) => {
    const token = JSON.parse(tk.jsonData);
    let key:string;
    for (key in token) {
        if((typeof token[key] == 'string') && (token[key].startsWith('ipfs'))) {
            files.push(token[key].replace('ipfs://', ''));
        }
    }
});

let deleted = 0;
let total = files.length;

let i:number;

for(i = 0 ; i < total ; i++) {
    try {
        const status = await client.check(files[i]);
        console.log(status);
        console.log('deleting file ', files[i]);
        await client.delete(files[i]);
    }
    catch {
        deleted++;
        console.log(files[i] + ' not found', deleted + '/' + total);
    }
}