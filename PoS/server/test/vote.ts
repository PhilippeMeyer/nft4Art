import { utils, Wallet } from "ethers";
import fetch from 'node-fetch';
import { expect } from "chai";
import { encodeVote } from '../../../client/src/utils/encodeVote.js'

const server = 'http://localhost:8999/';

//const server = 'https://nft4artpos.glitch.me';
//const appId = 'fa70a269-784b-4c81-ad0c-06e63beec5d9';

const url = server + 'apiV1/auth/appLogin';
const urlDrop = server + 'apiV1/auth/appLoginDrop';
const urlGetVote = httpServer + "apiV1/vote/getVote";
const urlSendVote = httpServer + "apiV1/vote/sendVote";

//const wallet: Wallet = Wallet.createRandom();
const wallet: Wallet = Wallet.fromMnemonic('ski ring tiny nephew beauty develop diesel gadget defense discover border cactus');
var jwt: string = "";
var vote:any;

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

describe('Testing to vote as from a mobile app', function() {

    it('Attempt to connect and register to the server' , async function() {

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

    it('Attempt to retrieve the vote definition' , async function() {

        const response = await fetch(urlGetVote, { method: 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt }});
        expect(response.status).to.equal(200);
        const responseJson = await response.json();

        vote = responseJson;
    });

    it('Attempt to vote' , async function() {
        vote.items.forEach((item) => {
            if(item.type === 'slider') {
                item.value = Math.floor(Math.random() * item.nb) + 1;
            } else if (item.type === 'ranking') {
                item.value = Math.floor(Math.random() * 5) + 1;
            } else if (item.type === 'date') {
                item.value = new Date();
            } else if (item.type === 'checkbox') {
                item.value = Math.floor(Math.random() * (1 << item.nb));
            } else if ((item.type === 'choose') || (item.type === 'option')){
                item.value = 1 << Math.floor(Math.random() * item.nb);
            }
        });

        const voteBitField = encodeVote(items);
        console.log(voteBitField);
        var strVote = voteBitField.toString(16);
        strVote = strVote.length %2 == 0 ? '0x' + strVote : '0x0' + strVote;
        console.log(strVote);

        const domain = {
            name: 'GovernedNFT',
            version: '1.0.0',
            chainId: header.chainId,
            verifyingContract: header.contract
        };

        const types = {
            BallotMessage: [
                { name: 'from',     type: 'address' },
                { name: 'voteId',   type: 'uint128' },
                { name: 'data',     type: 'bytes' }
            ]
        };

        const values = {
            from: wallet.address,
            voteId: vote.header.id,
            data: strVote
        };

        let signature = await wallet._signTypedData(domain, types, values)
        console.log('Signature: ', signature)

        response = await fetch(urlSendVote, {
                        method: 'POST',
                        headers:{ 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt},
                        body: JSON.stringify({domain: domain, types: types, values: values, signature: signature})
        });
        expect(response.status).to.equal(200);
    });
});