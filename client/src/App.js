import {useState} from 'react';
import logo from './logo.svg';
import './App.css';

import Wallet from './Components/WalletCreation.js'

function App() {

  const [wallet, setWallet] = useState({});
  return (
    <div className="App">
      <header className="App-header">
        <Wallet userWallet={wallet} />
      </header>
    </div>
  );
}

export default App;
