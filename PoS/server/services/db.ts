import sqlite, { Database } from 'better-sqlite3';
import path from "path";
import fs from "fs";

import { logger } from "../loggerConfiguration.js";

var db : Database;

function findOne(table: string, fieldName: string, id: string) {
    const result = db.prepare('SELECT * FROM ' + table + ' WHERE '+ fieldName + '=?').all([id]);
    if (result.length == 0) return null;
    else return result[0];
}

const initDb =  function(config: any) {
    const dbFile: string = path.resolve(config.dbName);
    const dbScript: string = path.resolve(config.creationScript);

    if (fs.existsSync(dbFile)) db = new sqlite(dbFile, {fileMustExist: true});
    else {
        const script = fs.readFileSync(dbScript);
        logger.info('server.initDB.creating a newDB applying %s', config.creationScript);
        // TODO Manage the case when the script does not exist
        db = new sqlite(dbFile, {fileMustExist: false});
        db.exec(script.toString());
    }
}

const closeDb = function() {
    db.close();
}

const findRegisteredPos = function(deviceId: string) {
    return findOne('registeredPoS', 'deviceId', deviceId);
};

const findRegisteredPosByIp = function(ip: string) {
    return findOne('registeredPoS', 'ip', ip);
};

const findAllRegisteredPos = function() {
    return db.prepare('SELECT * from registeredPoS').all();
}

const insertNewPos = function(posObj: any) {
    posObj.namePoS = "undefined";
    const {deviceId, authorized, namePoS, browser, browserVersion, ip} = posObj;
    const authorizedN: number = authorized ? 1 : 0;
    const stmt = db.prepare('INSERT INTO registeredPoS(deviceId, authorized, namePoS, browser, browserVersion, ip) VALUES (?, ?, ?, ?, ?, ?)');
    const params = [deviceId, authorizedN, namePoS, browser, browserVersion, ip];
    const result = stmt.run(params);
}

const updateAuthorizedRegisteredPos = function(id: string, authorized: string) {
    db.prepare('UPDATE registeredPoS SET authorized=? WHERE deviceId=?').run([authorized ? 1 : 0, id]);
}

const updateConnectedRegisteredPos = function(id: string, connected: boolean) {
    db.prepare('UPDATE registeredPoS SET isConnected=? WHERE deviceId=?').run([connected ? 1 : 0, id]);
}

const updateIpRegisteredPos = function(id: string, ip: string) {
    db.prepare('UPDATE registeredPoS SET ip=? WHERE deviceId=?').run([ip, id]);
}

const findToken = function(tokenId: string) {
    return findOne('tokens', 'tokenId', tokenId);
}
const findAllTokens = function() {
    return db.prepare('SELECT * FROM tokens').all();
}

const insertNewToken = function(token: any) {
    const {id, tokenIdStr, isLocked, price, quantity} = token;
    const stmt = db.prepare('INSERT INTO tokens(tokenId, id, isLocked, price, quantity, jsonData) VALUES (?, ?, ?, ?, ?, ?)');
    const params = [id, tokenIdStr, isLocked ? 1 : 0, price, quantity, JSON.stringify(token)];
    const result = stmt.run(params);
}

const updatePriceToken = function(tokenId: string, price: number) {
    db.prepare('UPDATE tokens SET price=? WHERE tokenId=?').run([price, tokenId]);
}

const updateQuantityToken = function(tokenId: string, quantity: number) {
    db.prepare('UPDATE tokens SET quantity=? WHERE tokenId=?').run([quantity, tokenId]);
}

const updateLockToken = function(tokenId: string, lock: number) {
    db.prepare('UPDATE tokens SET isLocked=? WHERE tokenId=?').run([lock, tokenId]);
}

const findAppId = function(addr: string) {
    return findOne('appIds', 'addressEth', addr);
}

const insertNewAppId = function(appIdRecord: any) {
    const {appId, address, nonce} = appIdRecord;
    const stmt = db.prepare('INSERT INTO appIds(appId, addressEth, nonce) VALUES (?, ?, ?)');
    const params = [appId, address, nonce];
    const result = stmt.run(params);

}

const updateNonceAppId = function(appId: string, nonce: number) {
    db.prepare('UPDATE appIds SET nonce=? WHERE appId=?').run([nonce, appId]);
}

const removeAppId = function(appId: string) {
    db.prepare('DELETE FROM appIds WHERE appId=?').run([appId]);
}

const insertNewSmartContract = function(address: string) {
    const stmt = db.prepare('INSERT INTO smartContracts(addressEth, activeFlag) VALUES (?, ?)');
    const params = [address, 1];
    const result = stmt.run(params);
}

const findAllSmartContracts = function() {
    return db.prepare('SELECT addressEth FROM smartContracts WHERE activeFlag=1').all();
}

const insertNewVote = function(voteId:string, voterAddr: string, jsonData:string) {
    const stmt = db.prepare('INSERT INTO votes(voteId,voterAddr,jsonData) VALUES (?, ?, ?)');
    const params = [voteId, voterAddr, jsonData];
    const result = stmt.run(params);
}

const findOneVote = function(voteId:string, voterAddr:string) {
    const result = db.prepare('SELECT voteId,voterAddr,jsonData FROM votes WHERE voteId=? AND voterAddr=?').all([voteId, voterAddr]);
    if (result.length == 0) return null;
    else return result[0];
}

const findAllVote = function(voteId:string) {
    return db.prepare('SELECT voteId,voterAddr,jsonData FROM votes WHERE voteId=?').all([voteId]);
}

const insertNewQuestionnaire = function(voteFullId:string, voteId:string, cid: string, checksum:string, jsonData:string) {
    const stmt = db.prepare('INSERT INTO voteQuestionnaire(voteFullId,voteId,cid,checksum,jsonData) VALUES (?, ?, ?, ?, ?)');
    const params = [voteFullId, voteId, cid, checksum, jsonData];
    const result = stmt.run(params);
}

const findOneQuestionnaire = function(voteId:string) {
    const result = db.prepare('SELECT voteId,voteFullId,cid,checksum,jsonData FROM voteQuestionnaire WHERE voteId=?').all([voteId]);
    if (result.length == 0) return null;
    else return result[0];
}

const findAllQuestionnaire = function() {
    return db.prepare('SELECT voteId,voteFullId,cid,checksum,jsonData FROM voteQuestionnaire').all([]);
}

const insertSaleEvent = function( typeMsg:string, id:string, price:number, isLocked:number, destinationAddr:string, isStored:number, isTransferred:number, isFinalized:number, txId:string, error:string ) {
    const stmt = db.prepare('INSERT INTO salesEvents (typeMsg, id, price, isLocked, destinationAddr, isStored, isTransferred, isFinalized, txId, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    const params = [typeMsg, id, price, isLocked, destinationAddr, isStored, isTransferred, isFinalized, txId, error];
    const result = stmt.run(params);
}

const findSaleEventByAddress = function(address:string, amount:number) {
    const stmt = db.prepare('SELECT typeMsg,id,price,isLocked,destinationAddr,isStored,isTransferred,isFinalized,txId,error FROM salesEvents where destinationAddr=? and price=? and isTransferred=0 and isFinalized=0')
    const result = stmt.all([address, amount]);
    if (result.length == 0) return null;
    else return result[0];
}

const findAllSaleEvents = function() {
    return db.prepare('SELECT typeMsg,id,price,isLocked,destinationAddr,isStored,isTransferred,isFinalized,txId,error FROM salesEvents').all([]);
}

const findNextInvoiceId = function() {
    const result = db.prepare('SELECT MAX(id) FROM invoices').all();
    if (result[0]['MAX(id)'] == null) return(1);
    else  return(result[0]['MAX(id)'] + 1);
}

const insertInvoice = function(invoice:any)  {
    const stmt = db.prepare('INSERT INTO invoices(invoiceNumber,tokenId,jsonData) VALUES (?, ?, ?)');
    const params = [invoice.invoiceNumber, invoice.tokenId, JSON.stringify(invoice)];
    const result = stmt.run(params);
}

const findAllInvoices = function() {
    return db.prepare('SELECT invoiceNumber,paid,settled,jsonData FROM invoices').all([]);
}

const findInvoice = function(invoiceNumber:string) {
    return findOne('invoices', 'invoiceNumber', invoiceNumber);
}

const payInvoice = function(invoiceNumber: string, paymentReference:string) {
    const stmt = db.prepare('UPDATE invoices SET paid=1, paymentReference=? WHERE invoiceNumber=?').run([invoiceNumber, paymentReference]);
}

const settleInvoice = function(invoiceNumber: string) {
    const stmt = db.prepare('UPDATE invoices SET settled=1 WHERE invoiceNumber=?').run([invoiceNumber]);
}

export {    initDb, closeDb, 
            findRegisteredPos, findRegisteredPosByIp, insertNewPos, updateIpRegisteredPos, updateAuthorizedRegisteredPos, updateConnectedRegisteredPos, findAllRegisteredPos,
            findToken, insertNewToken, updatePriceToken, updateLockToken, findAllTokens, updateQuantityToken,
            findAppId, insertNewAppId, updateNonceAppId, removeAppId,
            insertNewSmartContract, findAllSmartContracts,
            insertNewVote, findOneVote, findAllVote,
            insertNewQuestionnaire, findOneQuestionnaire, findAllQuestionnaire,
            insertSaleEvent, findSaleEventByAddress, findAllSaleEvents,
            findNextInvoiceId, insertInvoice, findAllInvoices, findInvoice, payInvoice, settleInvoice };