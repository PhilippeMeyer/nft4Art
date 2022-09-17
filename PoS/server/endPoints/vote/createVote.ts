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

async function createVote(req: Request, res: Response) {
    logger.info('server.vote.createVote');
    app.locals.vote = res.json(req.body);
    console.log('vote: ', app.locals.vote);
}

export {createVote};