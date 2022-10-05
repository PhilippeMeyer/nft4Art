import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";

import { logger } from "../loggerConfiguration.js";

async function createSmartContract(app: any) {

    let factory = new ContractFactory(app.locals.gvdNftDef.abi, app.locals.gvdNftDef.bytecode, app.locals.wallet);
    let contract = await factory.deploy();
    await contract.deployed();
    logger.info('server.createSmartContract %s', contract.address);
    return contract
}

export { createSmartContract };