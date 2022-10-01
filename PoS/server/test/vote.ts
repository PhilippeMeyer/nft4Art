import { utils, Wallet } from "ethers";
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { expect } from "chai";

import { DeviceResponse, DeviceFromClient, AppLogin, AppLoginMessage, Vote } from '../typings'
import encodeVote from './encodeVote.js'
import { doesNotMatch } from "assert";

const httpServer = 'http://localhost:8999/';
//const server = 'https://nft4artpos.glitch.me';
const appId = 'fa70a269-784b-4c81-ad0c-06e63beec5d9';
const deviceId = uuidv4();

const urlAppLogin = httpServer + 'apiV1/auth/appLogin';
const urlLoginManager = httpServer + 'apiV1/auth/signin';
const urlGetVote = httpServer + "apiV1/vote/listQuestionnaire";
const urlSendVote = httpServer + "apiV1/vote/sendVote";
const urlCreateVote = httpServer + 'apiV1/vote/createVote';


const device: DeviceFromClient = { deviceId: deviceId, browser: "Chrome", browserVersion: "101" };
const resp: DeviceResponse = { password: "12345678", device: device };
const headers = { 'Accept': 'application/json', 'Content-Type': 'application/json' };


const wallet: Wallet = Wallet.fromMnemonic('ski ring tiny nephew beauty develop diesel gadget defense discover border cactus');
var jwt: string = "";
var votes:any;
var vote:any;
var now:Date = new Date();
var voteId: string;
var strVote: string;
var domain: any;
var values: any;
var signatureVote: string;

const voteToCreate: Vote = 
{
    header: {
      title: 'Automatically generated vote for testing',
      start: now.setDate(now.getDate() - 30),
      end: now.setDate(now.getDate() + 60),
    },
    items: [
      {
        type: 'checkbox',
        id: 0,
        label: 'Test Checkbox',
        nb: 3,
        labels: ['Question 1', 'Question 2', 'Question 3']
      },
      {
        type: 'choose',
        id: 1,
        label: 'Test radio',
        nb: 3,
        labels: ['Yes', 'No', 'No opinion']
      },
      { type: 'slider', id: 2, label: 'Test slider', nb: 10 },
      { type: 'ranking', id: 3, label: 'Test ranking' }
    ]
};

const types = {
    BallotMessage: [
        { name: 'from',     type: 'address' },
        { name: 'voteId',   type: 'uint128' },
        { name: 'data',     type: 'bytes' }
    ]
};


const addr = await wallet.getAddress();
const appLoginMessage: AppLoginMessage = { appId: appId, address: addr, nonce: Date.now()};
const signature = await wallet.signMessage(JSON.stringify(appLoginMessage));
let msg: AppLogin = {
    message: appLoginMessage,
    signature: signature
};

describe('Testing to create a vote and vote as from a mobile app', function() {

    it('Logging in as a manager to create a new vote', async function () {
        
        const res = await fetch(urlLoginManager, { method: 'POST', headers: headers, body: JSON.stringify(resp) });
    
        expect(res.status).to.equal(200);
        const ret = await res.json();
        expect (ret.accessToken).not.to.be.undefined;

        jwt = ret.accessToken;
    });

    it('Creating a new vote', async function () {
        this.timeout(100000);

        const res = await fetch(urlCreateVote, { method: 'POST', headers: headers, body: JSON.stringify(voteToCreate) })
        expect(res.status).to.equal(200);
        const ret = await res.json();

        voteId = ret.voteId;
    });

    it('Attempt to connect as an app to the server' , async function() {

        const res = await fetch(urlAppLogin, { method: 'POST', headers: headers, body: JSON.stringify(msg) }); 
        expect(res.status).to.equal(200);
        const ret = await res.json();
        expect (ret.accessToken).not.to.be.undefined;

        if(res.status == 200) jwt = ret.accessToken;
    });

    it('Attempt to retrieve the list of questionnaires' , async function() {

        const response = await fetch(urlGetVote, { method: 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt }});
        expect(response.status).to.equal(200);
        const responseJson = await response.json();

        vote = responseJson.find((v:any) => (v.voteId == voteId));
        expect(vote).not.null;
        expect (vote.voteId).to.be.equal(voteId);
        vote = JSON.parse(vote.jsonData);
    });

    it('Attempt to vote' , async function() {
        this.timeout(100000);

        vote.items.forEach((item:any) => {
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

        const voteBitField = encodeVote(vote.items);
        strVote = voteBitField.toString(16);
        strVote = strVote.length %2 == 0 ? '0x' + strVote : '0x0' + strVote;

        domain = {
            name: 'GovernedNFT',
            version: '1.0.0',
            chainId: vote.header.chainId,
            verifyingContract: vote.header.contract
        };

        values = {
            from: wallet.address,
            voteId: vote.header.id,
            data: strVote
        };

        signatureVote = await wallet._signTypedData(domain, types, values)

        const response = await fetch(urlSendVote, {
                            method: 'POST',
                            headers:{ 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt},
                            body: JSON.stringify({domain: domain, types: types, values: values, signature: signatureVote})
        });
        expect(response.status).to.equal(200);
    });

    it('Attempt to vote again, which should be blocked' , async function() {
        this.timeout(100000);
        
        const response = await fetch(urlSendVote, {
            method: 'POST',
            headers:{ 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt},
            body: JSON.stringify({domain: domain, types: types, values: values, signature: signatureVote})
        });

        expect(response.status).not.to.equal(200);
    });
});