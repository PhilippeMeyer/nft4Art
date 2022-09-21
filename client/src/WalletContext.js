import { createContext, useContext } from "react";

const WalletContext = createContext(null);
const useWallet = () => useContext(WalletContext);

export { WalletContext, useWallet };