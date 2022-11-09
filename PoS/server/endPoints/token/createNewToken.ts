import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";
import { Response } from "express";

import { SaleEventRecord, RequestCustom } from "../../typings";
import { insertNewSmartContract } from '../../services/db.js';
import { logger } from "../../loggerConfiguration.js";
import { init } from '../../init.js';
import { config } from '../../config.js';


async function createNewToken(req :RequestCustom, res :Response) {

    let factory = new ContractFactory(req.app.locals.gvdNftDef.abi, req.app.locals.gvdNftDef.bytecode, req.app.locals.wallet);
    let contract = await factory.deploy();
    await contract.deployed();
    logger.info('server.createSmartContract %s', contract.address);
    insertNewSmartContract(contract.address);

    res.status(200).json({contractAddress: contract.address});

    logger.info('server.createSmartContract.restartingServer');
    init(req.app, config);
};


export { createNewToken };