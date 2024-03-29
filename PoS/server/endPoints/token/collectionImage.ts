import { Request, Response } from "express";
import path from 'path';

import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";


async function collectionImage(req: Request, res: Response) {
    if(req.query.id === undefined) {
        logger.info('server.collectionImage.noCollection');
        res.sendStatus(400);
        return;
    }
    const colId:any = req.query.id;
    
    if (req.app.locals.collections[colId].image === undefined) {
        logger.info('server.collectionImage.undefiinedImageCollection');
        res.sendStatus(404);
        return;
    }
    res.sendFile(path.join(config.__dirname, config.cacheFolder, req.app.locals.collections[colId].image.replace('ipfs://', '')));
}

async function collectionMap(req: Request, res: Response) {
    const colId:any = req.query.id;
    if(colId === undefined) {
        logger.info('server.collectionImage.noCollection');
        res.sendStatus(400);
        return;
    }
    if (req.app.locals.collections[colId].map === undefined) {
        logger.info('server.collectionImage.undefiinedImageCollection');
        res.sendStatus(404);
        return;
    }

    res.sendFile(path.join(config.__dirname, config.cacheFolder, req.app.locals.collections[colId].map.replace('ipfs://', '')));
}

export { collectionImage, collectionMap };
