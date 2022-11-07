import { Response } from "express";
import { SaleEventRecord, RequestCustom } from "../../typings";

import { logger } from "../../loggerConfiguration.js";
import { config } from "../../config.js"
import { findAllInvoices } from "../../services/db.js";


async function listInvoices(req: RequestCustom, res: Response) {
  const invoices = findAllInvoices();
  res.status(200).json(invoices);
}

async function getPdfInvoice(req: RequestCustom, res: Response) {
}

export { listInvoices, getPdfInvoice }