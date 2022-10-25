import { Response } from "express";
import fs from "fs";
import path from "path";

import { logger } from "../../loggerConfiguration.js";
import { RequestCustom } from "../../requestCustom.js";
import { config } from "../../config.js"


//
// /apiV1/information/3Dmodel
// Returns the 3d model associated with a token
//
// Gets as input the token for which the 3D model is required
//

function threeDmodel(req: RequestCustom, res: Response) {
    if (req.query.tokenId === 'undefined') {
      logger.warn('server.threeDmodel.missingTokenId for address: %s', req.address);
      res.sendStatus(400);
      return;
    }
  
    logger.info('server.threeDmodel %s, tokenID %s', req.address, req.query.tokenId);

    // TODO Manage the tokenId to retreive the associated model. For now, always sending the same
    let data: Buffer = req.app.locals.icons.get(req.query.tokenId + 'model');
    res.render("3dmodel", {model: "data:model/gltf-binary;base64," + data.toString('base64')});
}

export { threeDmodel };
