import ethers from 'ethers';
import fs from 'fs';
if (process.argv[2] === undefined) {
    console.error('No filename provided');
    process.exit(0);
}
if (process.argv[3] === undefined) {
    console.error('No password provided');
    process.exit(0);
}
let data = fs.readFileSync(process.argv[2]);
let wallet = ethers.Wallet.fromEncryptedJsonSync(data.toString(), process.argv[3]);
console.log('address:', wallet.address);
console.log('provider:', wallet.provider);
console.log('mnemonic:', wallet.mnemonic);
