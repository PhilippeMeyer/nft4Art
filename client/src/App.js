import { useState, useContext, createContext } from 'react';
import { Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import './App.css';

import { WalletContext } from './WalletContext.js';
import PrivateRoute from './PrivateRoute.js';

import WalletCreation from './Components/WalletCreation.js';
import Login from './Components/Login.js';
import RenderVote from './Components/RenderVote.js';
import ListQuestionnaire from './Components/ListQuestionnaire.js';

function App() {

  const [wallet, setWallet] = useState(undefined);

  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
        <ThemeProvider theme={darkTheme}>
            <WalletContext.Provider value={[wallet, setWallet]}>
                <CssBaseline />
                <div className="App">
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/wallet" element={ <WalletCreation />} />
                        <Route path="/vote" element={ <PrivateRoute> <RenderVote /> </PrivateRoute> } />
                        <Route path="/listQuestionnaire" element={ <PrivateRoute> <ListQuestionnaire /> </PrivateRoute> } />
                    </Routes>
                </div>
            </WalletContext.Provider>
        </ThemeProvider>
  );
}

export default App;
