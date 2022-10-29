import { Request, Response } from "express";

import { logger } from "../../loggerConfiguration.js";


//
// /apiV1/information/3Dmodel
// Returns the 3d model associated with a token
//
// Gets as input the token for which the 3D model is required
//

function threeDmodel(req: Request, res: Response) {
    if (req.query.tokenId === 'undefined') {
      logger.warn('server.threeDmodel.missingTokenId');
      res.sendStatus(400);
      return;
    }
  
    logger.info('server.threeDmodel.tokenID %s', req.query.tokenId);

    let data: Buffer = req.app.locals.icons.get(req.query.tokenId + 'model');
    if (data == null) {
      logger.error('server.threeDmodel.missingModel %s', req.query.tokenId);
      res.sendStatus(404);
    }
    res.render("3dmodel", {model: "data:model/gltf-binary;base64," + data.toString('base64')});
}

export { threeDmodel };
