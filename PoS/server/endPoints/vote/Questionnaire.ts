import fs from 'fs';
import os from 'os';
import path from 'path';
import { Request, Response } from "express";
import sharp from 'sharp';
import { NFTStorage, File, Blob } from 'nft.storage';
import { filesFromPath } from 'files-from-path'
import axios from "axios";
import { Contract, errors, providers, utils, ethers } from "ethers";


import { app } from "../../app.js";
import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";
import { insertNewVote, findOneVote, insertNewQuestionnaire, findAllQuestionnaire } from '../../services/db.js';



async function createQuestionnaire(req: Request, res: Response) {
    logger.info('server.vote.createQuestionnaire');

    try {
        const client = new NFTStorage({ token: config.nftSorageToken });
        const newVote = req.body;
        const token:Contract = app.locals.token;

        newVote.header.contract = app.locals.token.address;
        const curVote = await token.getVote();
        newVote.header.id = curVote[0].add(ethers.constants.One);
        newVote.header.chainId = await app.locals.wallet.getChainId();
        const txResp = await token.setVote(newVote.header.id, Math.floor(newVote.header.start / 1000), Math.floor(newVote.header.end / 1000));
        const txReceipt = await txResp.wait();
        logger.info('server.vote.voteInserted #%s txHash: %s', newVote.id, txReceipt.transactionHash);
        const str = JSON.stringify(newVote);
        const bytes = new TextEncoder().encode(str);
        var cid = await client.storeBlob(new Blob([bytes]));
        logger.info('server.vote.voteInsertedIpfs #%s', cid);
        const checksum = utils.keccak256(bytes);
        insertNewQuestionnaire(newVote.header.id.toHexString(), cid, checksum, str);
        app.locals.vote = newVote;
        logger.info('server.vote.voteInserted.completed');

        res.sendStatus(200);

    } catch(err: any) {
        logger.error('server.vote.createVoteError %s txHash: %s', err, err.transactionHash);
        res.status(500).json({error: { name: "errorCreateVote", message: err.reason }});;
    }
}

async function getQuestionnaire(req: Request, res: Response) {
    logger.info('server.vote.getVote');

    if(app.locals.vote === undefined) {
        res.sendStatus(404);
        return;
    }

    res.status(200).json(app.locals.vote);
}

async function listQuestionnaire(req: Request, res: Response) {
    const questionnaires = findAllQuestionnaire();
    res.status(200).json(questionnaires);
}

export { createQuestionnaire, getQuestionnaire, listQuestionnaire };