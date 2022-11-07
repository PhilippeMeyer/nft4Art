import { Response } from "express";
import { SaleEventRecord, RequestCustom } from "../../typings";
import path from 'path';

import { logger } from "../../loggerConfiguration.js";
import { config } from "../../config.js"
import { findAllInvoices } from "../../services/db.js";


async function listInvoices(req: RequestCustom, res: Response) {
  const invoices = findAllInvoices();
  res.status(200).json(invoices);
}

async function getPdfInvoice(req: RequestCustom, res: Response) {
  if (typeof req.query.invoice === "undefined") {
    logger.warn('server.getPdfInvoice.noTokenIdSpecified');
    res.status(400).json({ error: { name: "noInvoiceSpecified", message: "The invoice Id is missing" }} );
    return;
  }
  res.sendFile(path.join(config.__dirname, config.invoiceFolder + req.query.invoice + '.pdf'));
}

export { listInvoices, getPdfInvoice }