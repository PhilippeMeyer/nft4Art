import { utils, Wallet } from "ethers";
import fetch from 'node-fetch';
import { expect } from "chai";
import { v4 as uuidv4 } from 'uuid';
import { Description } from "@ethersproject/properties";


const server = 'http://localhost:8999';
const appId = uuidv4();

//const server = 'https://nft4artpos.glitch.me';
//const appId = 'fa70a269-784b-4c81-ad0c-06e63beec5d9';

const url = server + '/apiV1/auth/appLogin';
const urlTokens = server + '/apiV1/information/tokensOwned';
const urlModel = server + '/apiV1/information/3Dmodel';

//const wallet: Wallet = Wallet.createRandom();
const wallet: Wallet = Wallet.fromMnemonic('ski ring tiny nephew beauty develop diesel gadget defense discover border cactus');
var jwt: string = "";

type AppLogin = {
    signature: string;
    message: AppLoginMessage;
};
type AppLoginMessage = {
    appId: string;
    address: string;
    nonce: number;
};

const addr = await wallet.getAddress();
const appLoginMessage: AppLoginMessage = { appId: appId, address: addr, nonce: Date.now()};
//console.log('message: ', JSON.stringify(appLoginMessage));
const signature = await wallet.signMessage(JSON.stringify(appLoginMessage));
//console.log('signature:', signature);
let msg: AppLogin = {
    message: appLoginMessage,
    signature: signature
};

describe('Testing logging in as a mobile app', function() {
    var tokens:any;

    it('Attempt to connect and register to the server with address: ' + wallet.address , async function() {

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(msg)
        }); 

        const ret = await res.json();
        expect(res.status).to.equal(200);
        expect (ret.accessToken).not.to.be.undefined;

        if(res.status == 200) jwt = ret.accessToken;
    });

    it('Attempt to retrieve the tokens owned by this address' , async function() {

        const res = await fetch(urlTokens, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + jwt
            },
        }); 

        expect(res.status).to.equal(200);
        const ret = await res.json();
        ret.tokens.forEach((t:any) => console.log(t.description))
        tokens = ret.tokens;
    });

    it('Attempt to retrieve the models' , async function() {
        console.log('token: ', tokens[0]);
        console.log('tokenId: ', tokens[0].description.id);
        const res = await fetch(urlModel+"?tokenId=" + tokens[0].description.id, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + jwt
            },
        }); 

        expect(res.status).to.equal(200);
    });

});