import fs from 'fs';
import os from 'os';
import path from 'path';
import { Request, Response } from "express";
import sharp from 'sharp';
import { NFTStorage, File, Blob } from 'nft.storage';
import { filesFromPath } from 'files-from-path'
import axios from "axios";
import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";


import { app } from "../../app.js";
import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";

const overrides = { gasLimit: 750000 };

async function createVote(req: Request, res: Response) {
    logger.info('server.vote.createVote');

    try {
        app.locals.vote = req.body;
        app.locals.vote.contract = app.locals.token.address;
        const newVote = req.body;

        const token:Contract = app.locals.token;
        const curVote = await token.getVote();
        newVote.id = parseInt(curVote[0]) + 1;
        newVote.chainId = await app.locals.wallet.getChainId();
        const txResp = await token.setVote(newVote.id, newVote.start / 1000, newVote.end / 1000);
        const txReceipt = await txResp.wait();
        logger.info('server.vote.voteInserted #%s txHash: %s', newVote.id, txReceipt.transactionHash);

        res.sendStatus(200);

    } catch(err: any) {
        logger.error('server.vote.createVoteError %s txHash: %s', err.reason, err.transactionHash);
        res.sendStatus(500);
    }
}

async function getVote(req: Request, res: Response) {
    logger.info('server.vote.getVote');

    if(app.locals.vote === undefined) {
        res.sendStatus(404);
        return;
    }

    res.status(200).json(app.locals.vote);
}

async function sendVote(req: Request, res: Response) {
    logger.info('server.vote.sendVote');
    const token:Contract = app.locals.token;

    let {domain, types, values, signature} =  req.body;
    console.log(domain, types, values, signature);

    let ok = await token.verify(values, signature, overrides)
    console.log('Verification: ', ok)
    //values.data = "0x02"
    let tx = await token.vote(values, signature, [101], overrides)
    const receipt = await tx.wait()

    console.log('signature: ' + signature + ' Tx receipt: ' + receipt )


}

export { createVote, getVote, sendVote };