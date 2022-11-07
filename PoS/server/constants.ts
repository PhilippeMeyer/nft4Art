
export const NFT4ART_ETH_NETWORK = 1;
export const NFT4ART_BTC_NETWORK = 2;
export const NFT4ART_FIAT_NETWORK = 3;

// When (If?) a sale is recorded in the smart contract, the process follows those steps:
// 1 - Sale Initiated
// 2 - Sale stored in the SC (after receiving the transaction Hash)
// 3 - Sale paid as the money as been received
// 4 - Sale transferred, the tokens have been transferred to the buyer
// Before this sequence a database entry is performed to trace that a sale has been concluded with the message sale requested
export const NFT4ART_SALE_INITIATED = 1;
export const NFT4ART_SALE_REQUESTED_MSG = "saleRequested";
export const NFT4ART_SALE_INITIATED_MSG = "saleInitiated";
export const NFT4ART_SALE_ERROR_MSG = "saleError";
export const NFT4ART_SALE_STORED_MSG = "saleStored";
export const NFT4ART_SALE_LOGIN_POS_MSG = "saleLogin";
export const NFT4ART_SALE_PAID = 2;
export const NFT4ART_SALE_PAID_MSG = "salePaid";
export const NFT4ART_SALE_TRANSFERRED = 3;
export const NFT4ART_SALE_TRANSFERRED_MSG = "saleTransferred";
export const NFT4ART_ETHER = "eth";
export const NFT4ART_BTC = "btc";