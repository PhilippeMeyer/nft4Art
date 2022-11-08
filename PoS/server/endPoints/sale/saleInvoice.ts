import { Response } from "express";
import { SaleEventRecord, RequestCustom } from "../../typings";
import * as chqr from "swissqrbill";

import { logger } from "../../loggerConfiguration.js";
import { config } from "../../config.js";
import * as cst from "../../constants.js";

import { findNextInvoiceId, insertInvoice, insertSaleEvent } from "../../services/db.js";

const logo = config.galleryLogo;
const imageWidth = 120;
const w = [chqr.utils.mm2pt(15), chqr.utils.mm2pt(80), chqr.utils.mm2pt(30)] as const;


async function saleInvoice(req: RequestCustom, res: Response) {
    const tokenId: string = req.body.tokenId;
    const price: number = Number.parseFloat(req.body.price);
    const vat:number = price * 0.077;
    const totalPrice: number = price + vat;
    const email: string = req.body.email;
    const firstName: string = req.body.firstName;
    const lastName: string = req.body.lastName;
    const address1: string = req.body.address1;
    const address2: string = req.body.address2;
    const city: string = req.body.city;
    const state: string = req.body.state;
    const zip: string = req.body.zip;
    const country: string = req.body.country;
    const destinationAddr: string = req.body.destinationAddr;

    const token = req.app.locals.metasMap.get(tokenId);
    if (token == null) {
      logger.error("server.saleInvoice.nonExitingToken");
      res.status(500).json({error: "non existing token"});
      return;
    }

    const invoiceId = findNextInvoiceId();
    const invoiceNumber = 'TJ' + invoiceId.toString();

    const data = {
        currency: "CHF",
        amount: totalPrice,
        creditor: {
          name: "The Lighthouse",
          message: token.author + ' - ' + token.description,
          address: "Raemistrasse",
          buildingNumber: "5",
          zip: 8001,
          city: "Zürich",
          account: "CH7309000000150914342",
          country: "CH"
        },
        debtor: {
          name: firstName + ' ' + lastName,
          address: address1 + ' ' + (address2 === 'undefined') ? '' : address2,
          zip: zip,
          city: city,
          country: country
        },
        invoiceNumber: invoiceNumber,
        destinationAddr: destinationAddr,
        tokenId: token.id
      };

      insertInvoice(data);
      insertSaleEvent(cst.NFT4ART_SALE_STORED_MSG, token.id as string, price, 1, destinationAddr, 1, 0, 0, '', '');


      const table = {
        width: chqr.utils.mm2pt(170),
        x: 175,
        rows: [
          {
            height: 30,
            strokeColor: "black",
            columns: [ {  text: "Anzahl" }, { text: "Bezeichnung" }, { text: "Total" } ]
          }, {
            columns: [
             {
                text: "1",
              }, {
                text: token.author + ' - ' + token.description,
              }, {
                text: "CHF " + chqr.utils.formatAmount(price),
              }
            ]
          }, {
            height: 40,
            columns: [
             {
                text: "",
              }, {
                text: "Summe",
                font: "Helvetica-Bold",
              }, {
                text: "CHF " + chqr.utils.formatAmount(price),
                font: "Helvetica-Bold",
              }
            ]
          }, {
            columns: [
              {
                text: "",
              }, {
                text: "MwSt.",
              }, {
                text: "7.7%",
              }
            ]
          }, {
            columns: [
              {
                text: "",
              }, {
                text: "MwSt. Betrag",
              }, {
                text: "CHF " + chqr.utils.formatAmount(vat),
              }
            ]
          }, {
            height: 40,
            columns: [
              {
                text: "",
              }, {
                text: "Rechnungstotal",
                font: "Helvetica-Bold",
              }, {
                text: "CHF " + chqr.utils.formatAmount(totalPrice),
                font: "Helvetica-Bold"
              }
            ]
          }
        ]
      };

      table.rows.forEach((row:any) => row.columns.forEach((col:any, index:any) => col.width = w[index]));
      
      const pdf = new chqr.PDF(data as any, config.invoiceFolder + data.invoiceNumber + ".pdf", { "autoGenerate": false, "size": "A4" });
      pdf.image(logo, 20, 20, { width: 120 });
      pdf.font("Helvetica");
      pdf.fontSize(12);
      pdf.text('The Lighthouse', {align: 'right'}).moveDown(0.3);
      pdf.text('Raemistrasse 5', {align: 'right'}).moveDown(0.3);
      pdf.text('8001 Zürich', {align: 'right'}).moveDown(0.3);
      pdf.text('mail@lighthouse.com', {align: 'right'}).moveDown(0.3);
      pdf.moveDown(4);
      pdf.fontSize(18).text('Invoice #' + data.invoiceNumber);
      pdf.moveDown(1);
      pdf.fontSize(14).text(token.name);
      pdf.moveDown(4);
      let x = pdf.x;
      let y = pdf.y;
      pdf.image(req.app.locals.icons.get(tokenId), x, y + 30, {width: imageWidth});
      pdf.text('', x, y);

      pdf.addTable(table);

      pdf.addQRBill();
      pdf.end();
}

export { saleInvoice }