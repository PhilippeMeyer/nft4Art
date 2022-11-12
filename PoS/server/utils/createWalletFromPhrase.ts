import { Wallet } from "ethers";
import fs from "fs";



if (process.argv[2] === undefined) { console.error('No paraphrase provided'); process.exit(0);}
if (process.argv[3] === undefined) { console.error('No password provided'); process.exit(0);}
if (process.argv[4] === undefined) { console.error('No filename provided'); process.exit(0);}


const w:Wallet = Wallet.fromMnemonic(process.argv[2]);
const jsonWallet = await w.encrypt(process.argv[3]).then((jsonWallet) => {
    fs.writeFileSync(process.argv[4], jsonWallet);
});
