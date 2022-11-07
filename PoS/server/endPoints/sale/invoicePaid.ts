import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import { Response } from "express";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";

import { SaleEventRecord, RequestCustom } from "../../typings";
import { logger } from "../../loggerConfiguration.js";
import { insertSaleEvent } from "../../services/db.js"
import { sendLock, sendError } from "../../index.js"
import * as cst from '../../constants.js';
import { findInvoice, payInvoice, settleInvoice } from "../../services/db.js";
import { transferToken } from "./transfer.js";

//
// /apiV1/sale/invoicePaid
// parameters:
//  - the token's id (format including address and id§)
//  - the destination address to where the token has to be transferred
//  - the payment reference (IBAN or any other payment information)
//  - the invoiceNumber
//  - destination address (where to transfer the token)
//
// This end point is called when the invoice has been paid by the customer
// It records the transfer of the specified token to the new owner
//
async function invoicePaid(req: RequestCustom, res: Response) {
    const tokenId: string = req.body.tokenId;
    const paymentReference: string = req.body.paymentReference;
    const destinationAddr: string = req.body.destinationAddress;
    const invoiceNumber: string = req.body.invoiceNumber;

    if (findInvoice(invoiceNumber) == null) {
        logger.error('server.invoicePaid.noSuchInvoice %s', invoiceNumber);
        res.status(404).json({error: {'no such invoice'}});
        return;
    }
    const tk:any = app.locals.metasMap.get(tokenId);
    if (tk == null) {
        logger.error('server.invoicePaid.noSuchToken %s', invoiceNumber);
        res.status(404).json({error: {'no such token'}});
        return;
    }

    logger.info("server.invoicePaid.requested - token: %s, destination: %s", tokenId, destinationAddr);
    try {
        insertSaleEvent(cst.NFT4ART_PAID_STORED_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 1, 1, 0, '', '');
        payInvoice(invoiceNumber, paymentReference);
    } catch(e) {
        res.status(412).json( { Error: 'Error in transferring token: ' + error.toString() });
        logger.error("server.store.sale.error %s", error);
        insertSaleEvent(cst.NFT4ART_SALE_ERROR_MSG, req.body.tokenId as string, Number(finalPrice), 1, destinationAddr, 0, 0, 0, '', error.toString());
    }
    res.sendStatus(202);

    transferToken(tk, destinationAddr, req.app)
        .then(() => {
            settleInvoice(invoiceNumber);
        })
        .catch((error) => {
            logger.error('server.invoicePaid.error %s', error.toString());
            sendError(412, 'Error in transferring token: ' + error.toString());
        });
}

export { invoicePaid };