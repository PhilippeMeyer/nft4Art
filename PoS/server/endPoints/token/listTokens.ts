import { Request, Response } from "express";

import { config } from "../../config.js";
import { logger } from "../../loggerConfiguration.js";


async function listAllTokens(req: Request, res: Response) {
    res.status(200).json(req.app.locals.metas);
}

async function listFilteredTokens(req: Request, res: Response) {
    res.status(200).json(req.app.locals.metas.filter((meta:any) => (meta.tokenIdNum > 1 && meta.tokenIdNum <150)));
}

export { listAllTokens, listFilteredTokens };
