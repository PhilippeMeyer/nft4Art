import fs from 'fs';
import os from 'os';
import path from 'path';
import { Request, Response } from "express";
import sharp from 'sharp';
import { NFTStorage, File, Blob } from 'nft.storage';
import { filesFromPath } from 'files-from-path'
import axios from "axios";
import { Contract, errors, providers, utils, Wallet } from "ethers";


import { app } from "../../app.js";
import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";
import { insertNewVote, findOneVote, insertNewQuestionnaire, findAllQuestionnaire } from '../../services/db.js';


const overrides = { gasLimit: 750000 };


async function sendVote(req: Request, res: Response) {
    logger.info('server.vote.sendVote');
    const token:Contract = app.locals.token;

    let {domain, types, values, signature, } =  req.body;
    console.log(domain, types, values, signature);

    const existingVote = findOneVote(values.voteId, values.from);
    if(existingVote != null) {
        res.status(403).json({error: { name: "errorSendVote", message: "This owner has already voted" }});
        return;
    }

    try {
        let ok = await token.verify(values, signature, overrides)
        logger.info('server.vote.sendVote.Verification: %s', ok);

        let tx = await token.vote(values, signature, [101], overrides)
        const receipt = await tx.wait();
        logger.info('server.vote.sendVote.success Tx hash: ', receipt.transactionHash );

        insertNewVote(values.voteId, values.from, JSON.stringify(values));
        res.sendStatus(200);

    } catch(err:any) { 
        logger.error('server.vote.sendVote.error %s', err.reason);
        res.status(500).json({error: { name: "errorSendVote", message: err.reason }});
    }
}


export { sendVote };