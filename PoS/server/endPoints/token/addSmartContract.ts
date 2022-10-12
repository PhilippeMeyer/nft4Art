import { Request, Response } from "express";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";

import * as dbPos from '../../services/db.js';
import { logger } from "../../loggerConfiguration.js";
import { loadToken } from "../../init.js"


//
// addSmartContract
// Add an existing smart contract to the smart contract list
//
// Parameter:
//  - scAdresss: address of the smart contract
//
// This end point adds a smart contract in the list stored in the database and starts the server initialization
//

async function addSmartContract(req: Request, res: Response) {
    if(req.query.scAddress === undefined) {
        logger.warn('server.addSmartContract.NoAddress');
        res.sendStatus(404);
    }
    
    res.sendStatus(200);

    dbPos.insertNewSmartContract(req.query.scAddress as string);
    const token = await new Contract(req.query.scAddress as string, req.app.locals.gvdNftDef.abi, req.app.locals.ethProvider);

    loadToken(token, req.app);
}


export { addSmartContract };