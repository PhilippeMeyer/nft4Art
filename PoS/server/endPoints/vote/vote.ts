import fs from 'fs';
import os from 'os';
import path from 'path';
import { Request, Response } from "express";
import sharp from 'sharp';
import { NFTStorage, File, Blob } from 'nft.storage';
import { filesFromPath } from 'files-from-path'
import axios from "axios";
import { Contract, errors, providers, utils, Wallet } from "ethers";


import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";
import { insertNewVote, findOneVote, insertNewQuestionnaire, findAllQuestionnaire, findAllVote } from '../../services/db.js';


const overrides = { gasLimit: 750000 };


async function sendVote(req: Request, res: Response) {
    logger.info('server.vote.sendVote');
    const token:Contract = req.app.locals.token;

    let {domain, types, values, signature, } =  req.body;
    console.log(domain, types, values, signature);

    if(values.from == "0x0") {                                                          //This is for test purposes inserting votes in the database only
        insertNewVote(values.voteId.hex, values.from, JSON.stringify(values));
        res.sendStatus(200);
        return
    }

    const existingVote = findOneVote(values.voteId.hex, values.from);
    if(existingVote != null) {
        res.status(403).json({error: { name: "errorSendVote", message: "This owner has already voted" }});
        return;
    }

    try {
        let ok = await token.verify(values, signature, overrides)
        logger.info('server.vote.sendVote.Verification: %s', ok);

        const tokensOwned = await token.tokensOwned(values.from);
        if (tokensOwned.length == 0) {
            logger.info('server.vote.sendVote.noOwnedTokens');
            res.status(403).json({error: { name: "errorSendVote", message: "This individual does not own a token" }});
        }
        let tx = await token.vote(values, signature, tokensOwned[0], overrides)
        const receipt = await tx.wait();
        logger.info('server.vote.sendVote.success Tx hash: %s', receipt.transactionHash );

        insertNewVote(values.voteId.hex, values.from, JSON.stringify(values));
        res.sendStatus(200);

    } catch(err:any) { 
        logger.error('server.vote.sendVote.error %s', err.reason);
        res.status(500).json({error: { name: "errorSendVote", message: err.reason }});
    }
}

async function getVotes(req: Request, res: Response) {
    if (typeof req.query.voteId === "undefined") {
        logger.warn('server.getVotes.noVotIdspecified');
        res.status(404).json({error: 'noVoteIdSpecified', message: 'No VoteId specified'});
        return;
    }
    res.status(200).json(findAllVote(req.query.voteId as string));
}


export { sendVote, getVotes };