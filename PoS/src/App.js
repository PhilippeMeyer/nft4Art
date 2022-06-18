import * as React from "react";
import { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import PrivateRoute from './PrivateRoute';
//import { AuthContext } from "./auth";

import Login from './pages/Login';
import Tokens from './pages/Tokens';
import Wallets from './pages/Wallets';
import Contracts from './pages/Contracts';
import TokensMap from "./pages/TokensMap";
import TokenSale from "./pages/TokenSale";
import TokenTransfer from "./pages/TokenTransfer";
import RegisteredPoS from './pages/RegisteredPoS';
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
            <Route path="/manager/pointOfSale" element={<PrivateRoute><RegisteredPoS /></PrivateRoute>} />
            <Route path="/sales/map" element={<PrivateRoute><TokensMap /></PrivateRoute>} />
            <Route path="/sales/token/:id" element={<TokenSale />} />
            <Route path="/sales/transfer" element={<TokenTransfer />} />
          </Routes>
        </div>
      </ThemeProvider>  
  );
}

export default App;
