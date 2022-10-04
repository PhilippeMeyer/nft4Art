import { Request, Response } from "express";
import { NFTStorage, File, Blob } from 'nft.storage';
import { Contract, errors, providers, utils, ethers } from "ethers";


import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";
import { insertNewVote, findOneVote, insertNewQuestionnaire, findAllQuestionnaire } from '../../services/db.js';

//
// createQuestionnaire
// create a questionnaire for an upcoming vote
//
// Parameters:
//  - The parameters are retrieved from a form data structure sent by the client
//
// Defaulted parameters:
//  - The voteId is incremented from the last recorded vote on the smart contract
async function createQuestionnaire(req: Request, res: Response) {
    logger.info('server.vote.createQuestionnaire');

    try {
        const client = new NFTStorage({ token: config.nftSorageToken });
        const newVote = req.body;
        const token:Contract = req.app.locals.token;

        newVote.header.contract = req.app.locals.token.address;
        const curVote = await token.getVote();                          // getVote returns the voteId in the first position of a tuple
        newVote.header.id = curVote[0].add(ethers.constants.One);       // incrementing the voteId
        newVote.header.chainId = await req.app.locals.wallet.getChainId();

        const questionnaireStr = JSON.stringify(newVote);               // Storing the questionnaire on Ipfs
        const bytes = new TextEncoder().encode(questionnaireStr);
        var cid = await client.storeBlob(new Blob([bytes]));            // cid of the questionnaire that is going to be stored on chain
        const checksum = utils.keccak256(bytes);

        const txResp = await token.setVote(newVote.header.id, Math.floor(newVote.header.start / 1000), Math.floor(newVote.header.end / 1000), cid);
        const txReceipt = await txResp.wait();
        logger.info('server.vote.voteInserted #%s txHash: %s', newVote.id, txReceipt.transactionHash);
        logger.info('server.vote.voteInsertedIpfs #%s', cid);
        insertNewQuestionnaire(newVote.header.id.toHexString(), cid, checksum, questionnaireStr);
        logger.info('server.vote.voteInserted.completed');

        res.status(200).json({status: 200, voteId: newVote.header.id.toHexString()});

    } catch(err: any) {
        logger.error('server.vote.createVoteError %s txHash: %s', err, err.transactionHash);
        res.status(500).json({error: { name: "errorCreateVote", message: err.reason }});;
    }
}

//
// getQuestionnaire
// Get the questionnaire definition
//
// End point Parameter:
//  - questionnaireId: id of the questionnaire
//
// Returns the specified questionnaire in json format
//
async function getQuestionnaire(req: Request, res: Response) {
    logger.info('server.vote.getQuestionnaire');

    if (req.query.questionnaireId == undefined)
        res.status(404).json({error: server.vote.getQuestionnaire.noId, message: 'No Id specified' });
        return;
    }
    const questionnaire = findOneQuestionnaire(req.query.questionnaireId);
    if (questionnaire.length == 0) {
        logger.info('server.vote.getQuestionnaire.wrongVoteId');
        res.status(404).json({error: server.vote.getQuestionnaire.wrongVoteId, message: 'This vote Id does not exist'});
    }
    const ret = JSON.parse(questionnaire.jsonData);
    res.status(200).json(ret);
}

//
// listQuestionnaire
// Get the list of all the questionnaires
//
// Parameters: none
//
// Returns:
//  - a json array of all the questionnaires in the system (including their jsonData)
//

async function listQuestionnaire(req: Request, res: Response) {
    const questionnaires = findAllQuestionnaire();
    res.status(200).json(questionnaires);
}

export { createQuestionnaire, getQuestionnaire, listQuestionnaire };