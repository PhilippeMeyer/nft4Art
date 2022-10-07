import fs from 'fs';
import ethers from 'ethers';
import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";


if (process.argv[2] === undefined || process.argv[3] === undefined) { 
    console.log('specify a param file and a password');
    process.exit(-1);
}

var params:any, wallet:ethers.Wallet
try {
    const paramsTxt = fs.readFileSync(process.argv[2]);
    params = JSON.parse(paramsTxt.toString());

    const walletTxt = fs.readFileSync(params.wallet);
    wallet = ethers.Wallet.fromEncryptedJsonSync(walletTxt.toString(), process.argv[3]);
} catch(err) { console.log(err); process.exit(-1); }

const mnemonic:string = wallet.mnemonic.phrase;
const root:ethers.utils.HDNode = ethers.utils.HDNode.fromMnemonic(mnemonic);
let index;

for(let i = 0 ; i < 10 ; i++ ) {
    const node = root.derivePath("m/44'/60'/0'/0/" + i);
    if(node.address == params.from) { index = i; break; }
}

if (index === undefined) { console.log('address not managable from wallet'); process.exit(-1); }

wallet = ethers.Wallet.fromMnemonic(mnemonic, "m/44'/60'/0'/0/" + index);

const rawAbi = fs.readFileSync(params.abiFile);
const abi = JSON.parse(rawAbi.toString());  
const provider = new ethers.providers.InfuraProvider(params.network, params.infuraKey);
const walletSigner = wallet.connect(provider);
const token = new ethers.Contract(params.contract, abi, provider);
const tokenWithSigner = token.connect(walletSigner);

tokenWithSigner
    .safeTransferFrom(wallet.address, params.to, params.tokenId, 1, [])
        .then((transferResult: TransactionResponse) => {
            console.log("Transfer initiated - token: %s, destination: %s", params.tokenId, params.to);
            transferResult.wait().then((transactionReceipt: TransactionReceipt) => {
                console.log("Transfer performed token %s destination %s - TxHash: %s", params.tokenId, params.to, transactionReceipt.transactionHash );
            });
        })
        .catch((error: ethers.errors) => console.log('error in transfer: %s', error));
