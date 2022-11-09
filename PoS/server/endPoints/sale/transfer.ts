import { TransactionReceipt, TransactionResponse } from "@ethersproject/abstract-provider";
import { Response } from "express";
import { errors } from "ethers";

import { SaleEventRecord, RequestCustom } from "../../typings";
import { logger } from "../../loggerConfiguration.js";
import { insertSaleEvent } from "../../services/db.js"
import { sendLock, sendError } from "../../index.js"

//
// /apiV1/sale/transfer, parameters: the token's id and the destination address
//
// This end point transfers the specified token to the new owner.
// It performs the Blockchain transaction
//
async function transfer(req: RequestCustom, res: Response) {
    const tokenAddr: string = req.body.tokenAddr;                                           // Token's address
    const tokenId: string = req.body.tokenId;                                               // Token's id               
    const destinationAddr: string = req.body.destinationAddress;                            // Buyer's address

    logger.info("server.transfer.requested - token: %s, destination: %s", tokenId, destinationAddr);
    const tk = req.app.locals.metasMap.get(tokenId);
    if (tk == null) {
        logger.error("server.transfer.nonExitingToken");
        res.status(500).json({error: "non exsting token"});
        return;
    }

    insertSaleEvent("transferRequest", tokenId, tk.price, 1, destinationAddr, 0, 0, 0, '', '');
    res.sendStatus(202);

    transferToken(tk, destinationAddr, req.app)
        .then(() => {})
        .catch((error) => {
            logger.error('server.transfer.error %s', error.toString());
            sendError(412, 'Error in transferring token: ' + error.toString());
        });
}

function transferToken(tk:any, destinationAddr:string, app:any): Promise<string> {
    const tokenWithSigner = app.locals.token.connect(app.locals.wallet);

    if(tk.tokenIdNum == 1) {                                                    // Transfer of the video, only one token tranferred
        return new Promise<string>((resolve, reject) => {
            tokenWithSigner
                .safeTransferFrom(app.locals.wallet.address, destinationAddr, tk.tokenId, 1, [])
                .then((transferResult: TransactionResponse) => {
                    
                    insertSaleEvent("transferInitiated", tk.id, tk.price, 1, destinationAddr, 1, 0, 0, '', '');
                    logger.info("server.transfer.initiated - token: %s, destination: %s", tk.tokenId, destinationAddr);

                    transferResult.wait().then((transactionReceipt: TransactionReceipt) => {
                        insertSaleEvent("transferPerformed", tk.id, tk.price, 1, destinationAddr, 1, 1, 0, transactionReceipt.transactionHash, '');
                        logger.info( "server.transfer.performed token %s destination %s - TxHash: %s", tk.tokenIdStr, destinationAddr, transactionReceipt.transactionHash );

                        // Update the balance once the transfer has been performed
                        app.locals.token.balanceOf(app.locals.wallet.address, tk.tokenId).then((balance: any) => {
                            logger.info('server.transfer.updatingBalance');
                            tk.availableTokens = balance.toString();
                            tk.isLocked = balance.isZero();
                            sendLock(tk.id, true);
                            resolve(transactionReceipt.transactionHash);
                        });
                    });
                })
                .catch((error: errors) => {
                    logger.error("server.transfer.error %s", error);
                    insertSaleEvent("transferInitiated", tk.id, tk.price, 1, destinationAddr, 0, 0, 0, '', error.toString());
                    reject(error);
                });
        });
    }
    else {                                                                          // We distribute a video token (#1) for free
        return new Promise<string>((resolve, reject) => {
            tokenWithSigner
                .safeBatchTransferFrom(app.locals.wallet.address, destinationAddr, [tk.tokenIdNum, 1], [1, 1], [])
                .then((transferResult: TransactionResponse) => {
                    
                    insertSaleEvent("transferInitiated", tk.id, tk.price, 1, destinationAddr, 1, 0, 0, '', '');
                    logger.info("server.transfer.initiated - token: %s, destination: %s", tk.tokenId, destinationAddr);

                    transferResult.wait().then((transactionReceipt: TransactionReceipt) => {
                        insertSaleEvent("transferPerformed", tk.id, tk.price, 1, destinationAddr, 1, 1, 0, transactionReceipt.transactionHash, '');
                        logger.info( "server.transfer.performed token %s destination %s - TxHash: %s", tk.tokenIdStr, destinationAddr, transactionReceipt.transactionHash );

                        // Update the balance once the transfer has been performed
                        app.locals.token.balanceOf(app.locals.wallet.address, tk.tokenId).then((balance: any) => {
                            logger.info('server.transfer.updatingBalance');
                            tk.availableTokens = balance.toString();
                            tk.isLocked = balance.isZero();
                            sendLock(tk.id, true);
                            resolve(transactionReceipt.transactionHash);
                        });
                    });
                })
                .catch((error: errors) => {
                    logger.error("server.transfer.error %s", error);
                    insertSaleEvent("transferInitiated", tk.id, tk.price, 1, destinationAddr, 0, 0, 0, '', error.toString());
                    reject(error);
                });
        });

    }
}

export { transfer, transferToken };