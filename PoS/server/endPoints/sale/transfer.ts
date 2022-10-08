import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import { Response } from "express";
import { errors } from "ethers";

import { SaleEventRecord, RequestCustom } from "../../typings";
import { logger } from "../../loggerConfiguration.js";
import { insertSaleEvent } from "../../services/db.js"
import { sendLock } from "../../index.js"

//
// /apiV1/sale/transfer, parameters: the token's id and the destination address
//
// This end point transfers the specified token to the new owner.
// It performs the Blockchain transaction
//
async function transfer (req: RequestCustom, res: Response) {
    const tokenAddr: string = req.body.tokenAddr;
    const tokenId: string = req.body.tokenId;
    const destinationAddr: string = req.body.destinationAddress;
    console.log("transfer tokenId: ", tokenAddr, tokenId, destinationAddr);

    logger.info("server.transfer.requested - token: %s, destination: %s", tokenId, destinationAddr);
    insertSaleEvent("transferRequest", req.body.tokenId as string, 1, destinationAddr, 0, 0, 0, '', '');

    let tokenWithSigner = req.app.locals.token.connect(req.app.locals.wallet);

    tokenWithSigner
        .safeTransferFrom(req.app.locals.wallet.address, destinationAddr, tokenId, 1, [])
        .then((transferResult: TransactionResponse) => {
            res.sendStatus(200);
            insertSaleEvent("transferInitiated", req.body.tokenId as string, 1, destinationAddr, 1, 0, 0, '', '');
            logger.info("server.transfer.initiated - token: %s, destination: %s", tokenId, destinationAddr);

            transferResult.wait().then((transactionReceipt: TransactionReceipt) => {
                insertSaleEvent("transferPerformed", req.body.tokenId as string, 1, destinationAddr, 1, 1, 0, transactionReceipt.transactionHash, '');
                logger.info( "server.transfer.performed token %s destination %s - TxHash: %s", tokenId, destinationAddr, transactionReceipt.transactionHash );

                // Update the balance once the transfer has been performed
                req.app.locals.token.balanceOf(req.app.locals.wallet.address, tokenId).then((balance: any) => {
                    const tk = req.app.locals.metasMap.get(tokenAddr + tokenId);
                    if (tk != null) {
                        tk.availableTokens = balance.toString();
                        if (balance.isZero()) {
                            tk.isLocked = true;
                            sendLock(tokenId, true);
                        }
                    }
                });
            });
        })
        .catch((error: errors) => {
            res.status(412).json(error);
            logger.error("server.transfer.error %s", error);
            insertSaleEvent("transferInitiated", req.body.tokenId as string, 1, destinationAddr, 0, 0, 0, '', error);
        });
}

export { transfer };