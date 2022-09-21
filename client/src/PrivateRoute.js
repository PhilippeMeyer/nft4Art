import React from 'react';
import { useContext } from 'react';
import { Navigate } from 'react-router-dom';

import { WalletContext } from './WalletContext.js'


function PrivateRoute({ children } ) {
    const [wallet, setWallet] = useContext(WalletContext);

    return wallet !== undefined ? children : <Navigate to="/wallet" />;
}

export default PrivateRoute;