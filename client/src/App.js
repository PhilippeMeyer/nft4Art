import { ethers } from 'ethers';

import logo from './logo.svg';
import './App.css';

import Wallet from './Components/WalletCreation.js'

function App() {

  return (
    <div className="App">
      <header className="App-header">
        <Wallet />
      </header>
    </div>
  );
}

export default App;
