import { Response } from "express";
import { SaleEventRecord, RequestCustom } from "../../typings";
import { PDF } from "swissqrbill/lib/node/esm/node/pdf.js";
import { mm2pt, formatAmount } from "swissqrbill/lib/node/esm/shared/utils.js";

import { logger } from "../../loggerConfiguration.js";
import { config } from "../../config.js";
import { sendQuantity, sendLock } from "../../index.js";
import * as cst from "../../constants.js";

import { findAllSaleEvents } from "../../services/db.js";


async function listSaleEvents(req: RequestCustom, res: Response) {

  res.status(200).json(findAllSaleEvents());
}


export { listSaleEvents }
