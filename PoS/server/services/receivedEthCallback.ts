import { utils } from 'ethers';
import { logger } from "../loggerConfiguration.js";

import { findSaleEventByAddress, findToken } from './db.js';
import { transferToken } from '../endPoints/sale/transfer.js';

//
// receivedEthCallback
// Callback activated when some ethers are received on the smart contract
//
// When a customer is paying in ether, the coins are lending on the smart contract and this should trigger the transfer if the amount received
// corresponds to the amount expected.
// Internally this callback is triggered by an event which is emitted in the smart contract when receiving money (actually it is the only possible 
// thing to do when receiveing ether)
//
// When the ether is received, the amount is verified against the transaction expected (stored in the smart contract)
// As the smart contract is indexed by tokenId and we receive here only the destination address (which has paid for the token), we use the local database to 
// retrieve the transaction details

function receivedEthCallback(from: any, amount: BigInteger, event: any, app:any) {
    console.log('from:', from, 'amount:', amount, 'event:', event);

    const amountFloat = parseFloat(utils.formatUnits(amount));
    const saleEvent = findSaleEventByAddress(from, amountFloat);
    if(saleEvent == null) {
      logger.error('server.receivedEth.cannotFindSale %s, %f', from, amountFloat);
      return;
    }       

    const tk:any = app.locals.metasMap.get(saleEvent.id);

    transferToken(tk, from, app).then(() => {}).catch(() => {});
}
    
export { receivedEthCallback };