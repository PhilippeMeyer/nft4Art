import { Wallet } from "ethers";
import fetch from 'node-fetch';
//const url = 'http://localhost:8999/apiV1/auth/appLogin';
const url = 'https://nft4artpos.glitch.me/apiV1/auth/appLogin';
const wallet = Wallet.createRandom();
const addr = await wallet.getAddress();
const appLoginMessage = { appId: 'test', address: addr, nonce: 1 };
console.log('message: ', JSON.stringify(appLoginMessage));
const signature = await wallet.signMessage(JSON.stringify(appLoginMessage));
console.log('signature:', signature);
try {
    let msg = {
        message: appLoginMessage,
        signature: signature
    };
    const res1 = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg)
    });
    // Should not work as nonce as not been incremented
    const ret1 = await res1.json();
    console.log(ret1);
    const res2 = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg)
    });
    const ret2 = await res2.json();
    console.log(ret2);
    msg.message.nonce++;
    msg.signature = await wallet.signMessage(JSON.stringify(msg.message));
    const res3 = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg)
    });
    const ret3 = await res3.json();
    console.log(ret3);
    // Should not work as the address has been registered with test and not test2
    msg.message.appId = 'test2';
    msg.signature = await wallet.signMessage(JSON.stringify(msg.message));
    const res4 = await fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(msg)
    });
    const ret4 = await res4.json();
    console.log(ret4);
}
catch (e) {
    console.log(e);
}
