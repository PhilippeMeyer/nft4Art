import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import { Response } from "express";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";

import { SaleEventRecord, RequestCustom } from "../../typings";
import { logger } from "../../loggerConfiguration.js";
import { insertSaleEvent } from "../../services/db.js"
import { sendLock, sendError } from "../../index.js"
import * as cst from '../../constants.js';

//
// /apiV1/sale/transferBtc
// parameters:
//  - the token's id
//  - the token's address
//  - destination address (which the address from which the token is going to be paid)
//  - the final token's price
//
// This end point records the sale of the specified token to the new owner when paid in Ether
// The effective transfer is performed whan the ethers have been received
// When ethers are reaching the smart contract, it is triggering an event which is received by the server and triggers the transfer
//
async function transferBtc(req: RequestCustom, res: Response) {
    const tokenAddr: string = req.body.tokenAddr;
    const tokenId: string = req.body.tokenId;
    const finalPrice: string = req.body.finalPrice;
    const destinationAddr: string = req.body.destinationAddress;
    const decimalsBtc = 8;
    console.log("transfer Btc tokenId: ", tokenAddr, tokenId, destinationAddr);

    logger.info("server.transferBtc.requested - token: %s, destination: %s, price: %s", tokenId, destinationAddr, finalPrice);
    insertSaleEvent(cst.NFT4ART_SALE_REQUESTED_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 0, 0, 0, '', '');

    /*

    The NFT Smart contract is able to store sales records in the following format:

    struct SaleRecord {
        bytes32 buyer;                  // Buyer's address (can also be a bitcoin address)
        uint128 price;                  // Price as an integer
        uint8   decimals;               // Decimals applied to the price
        bytes3  currency;               // Currency 3 letters Iso country code + ETH and BTC
        bytes1  network;                // Network on which the payment is performed
        bytes1  status;                 // Sale's status: initiated, payed, completed, ....
    }
    */

    const saleRecord = {
        buyer: utils.formatBytes32String(destinationAddr),
        decimals: decimalsBtc,
        price: parseFloat(finalPrice) * 10 ** decimalsBtc,
        currency: cst.NFT4ART_BTC,
        network: cst.NFT4ART_BTC_NETWORK,
        status: cst.NFT4ART_SALE_INITIATED
    };

    let tokenWithSigner = req.app.locals.token.connect(req.app.locals.wallet);
    tokenWithSigner
        .saleRecord(tokenId, saleRecord)
        .then((transferResult: TransactionResponse) => {
            res.sendStatus(200);
            insertSaleEvent(cst.NFT4ART_SALE_INITIATED_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 0, 0, 0, '', '');
            logger.info("server.store.sale.init - token: %s, destination: %s", tokenId, destinationAddr);

            transferResult.wait().then((transactionReceipt: TransactionReceipt) => {
                insertSaleEvent(cst.NFT4ART_SALE_STORED_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 1, 0, 0, '', '');
                logger.info("server.store.sale.performed token %s destination %s - TxHash: %s", tokenId, destinationAddr, transactionReceipt.transactionHash );
            });
        })
        .catch((error: errors) => {
            sendError(412, 'Error in transferring token: ' + error.toString());
            logger.error("server.store.sale.error %s", error);
            insertSaleEvent(cst.NFT4ART_SALE_ERROR_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 0, 0, 0, '', error.toString());
        });
}

export { transferBtc };