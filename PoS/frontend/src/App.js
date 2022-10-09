import * as React from "react";
import { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import PrivateRoute from './PrivateRoute';
//import { AuthContext } from "./auth";

import Login from './pages/PoS/Login';
import Tokens from './pages/Tokens';
import Wallets from './pages/PoS/Wallets';
import Contracts from './pages/Contracts';
import TokensMap from "./pages/TokensMap";
import TokensGrid from "./pages/TokensGrid";
import SelectCollection from "./pages/SelectCollection";
import TokenSaleFiat from "./pages/TokenSaleFiat";
import TokenSaleEth from "./pages/TokenSaleEth";
import TokenSaleBtc from "./pages/TokenSaleBtc";
import TokenTransfer from "./pages/TokenTransfer";
import TokenTransferEth from "./pages/TokenTransferEth";
import RegisteredPoS from './pages/PoS/RegisteredPoS';
import DisplayVote from "./pages/vote/DisplayVote";
import ListQuesionnaire from "./pages/vote/ListQuestionnaire";
import CreateVote  from './pages/vote/CreateVote';

import './App.css';


function App() {

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });
  

  return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <div className="App">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/manager/tokens" element={<PrivateRoute><Tokens /></PrivateRoute>} />
            <Route path="/manager/wallets" element={<PrivateRoute><Wallets /></PrivateRoute>} />
            <Route path="/manager/contracts" element={<PrivateRoute><Contracts /></PrivateRoute>} />
            <Route path="/manager/createVote" element={<PrivateRoute><CreateVote /></PrivateRoute>} />
            <Route path="/manager/listQuestionnaire" element={<PrivateRoute><ListQuesionnaire /></PrivateRoute>} />
            <Route path="/manager/displayVote" element={<PrivateRoute><DisplayVote /></PrivateRoute>} />
            <Route path="/manager/pointOfSale" element={<PrivateRoute><RegisteredPoS /></PrivateRoute>} />
            <Route path="/sales/selectCollection" element={<PrivateRoute><SelectCollection /></PrivateRoute>} />
            <Route path="/sales/map" element={<PrivateRoute><TokensMap /></PrivateRoute>} />
            <Route path="/sales/grid" element={<PrivateRoute><TokensGrid /></PrivateRoute>} />
            <Route path="/sales/token/fiat/:id" element={<TokenSaleFiat />} />
            <Route path="/sales/token/eth/:id" element={<TokenSaleEth />} />
            <Route path="/sales/token/btc/:id" element={<TokenSaleBtc />} />
            <Route path="/sales/transfer" element={<TokenTransfer />} />
            <Route path="/sales/transferETh" element={<TokenTransferEth />} />
          </Routes>
        </div>
      </ThemeProvider>  
  );
}

export default App;
