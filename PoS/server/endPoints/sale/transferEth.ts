import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import { Response } from "express";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";

import { SaleEventRecord, RequestCustom } from "../../typings";
import { logger } from "../../loggerConfiguration.js";
import { insertSaleEvent } from "../../services/db.js"
import { sendLock, sendError } from "../../index.js"
import * as cst from '../../constants.js';

//
// /apiV1/sale/transferEth
// parameters:
//  - the token's id
//  - the token's address
//  - destination address (which the address from which the token is going to be paid)
//  - the final token's price
//
// This end point records the sale of the specified token to the new owner when paid in Ether
// The effective transfer is performed when the ethers have been received
// When ethers are reaching the smart contract, it is triggering an event which is received by the server and triggers the transfer
//
async function transferEth(req: RequestCustom, res: Response) {
    const tokenAddr: string = req.body.tokenAddr;
    const tokenId: string = req.body.tokenId;
    const finalPrice: string = req.body.finalPrice;
    const destinationAddr: string = req.body.destinationAddress;
    const decimalsEth = 18;
    console.log("transfer tokenId: ", tokenAddr, tokenId, destinationAddr);

    logger.info("server.transfer.requested - token: %s, destination: %s, price: %s", tokenId, destinationAddr, finalPrice);
    try {
        insertSaleEvent(cst.NFT4ART_SALE_STORED_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 1, 0, 0, '', '');
    } 
    catch(e:any) {
        res.status(412).json( { Error: 'Error in transferring token: ' + e.toString() });
        logger.error("server.store.sale.error %s", e.toString());
        insertSaleEvent(cst.NFT4ART_SALE_ERROR_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 0, 0, 0, '', e.toString());
    }
}

export { transferEth };