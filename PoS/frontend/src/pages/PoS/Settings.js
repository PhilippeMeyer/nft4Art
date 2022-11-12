import * as React from "react";
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useSelector, useDispatch } from 'react-redux'

import NavbarManager from "../NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
const addSCUrl = httpServer + 'apiV1/token/addSmartContract?scAddress=';
const deploySCUrl = httpServer + 'apiV1/token/createToken';
const changeWalletUrl = httpServer + 'apiV1/auth/changeWallet';


function Settings() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  
  const [scAddress, setScAddress] = useState();
  const [pwd1, setPwd1] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [paraphrase, setParaphrase] = useState('');

  const jwt = useSelector((state) => state.token.jwt);


  const generate = () => {
    fetch(addSCUrl + scAddress, { method: 'POST', headers: { authorization: 'Bearer ' + jwt }})
      .then((resp) => {
        console.log(resp)
        if (!resp.ok) {
          enqueueSnackbar('Error connecting to server: ' + resp.status);
        }
      })
      .catch((e) => { enqueueSnackbar('Error connecting to server: ' + e);});
  };

  const deploy = () => {
    fetch(deploySCUrl, { method: 'POST', headers: { authorization: 'Bearer ' + jwt }})
    .then((resp) => {
      console.log(resp)
      if (!resp.ok) {
        enqueueSnackbar('Error connecting to server: ' + resp.status);
      }
    })
    .catch((e) => { enqueueSnackbar('Error connecting to server: ' + e);});
  }

  const changeValue = (evt) => { setScAddress(evt.target.value)}

  const changeWallet = () => {
    if(pwd1 != pwd2) return;
    if(pwd1 === undefined) return;

    const obj = {password: pwd1, paraphrase: paraphrase};
    console.log(obj);
    fetch(changeWalletUrl, { method: 'POST', body: JSON.stringify(obj), headers: { authorization: 'Bearer ' + jwt, Accept: 'application/json', 'Content-Type': 'application/json' }})
    .then((resp) => {
      if (resp.ok) enqueueSnackbar('Wallet change successfully performed');
      else {
        enqueueSnackbar('Error connecting to server: ' + resp.status);
        return null;
      }
    })

  }

  return (
      <main>

        <Box sx={{ display: 'block', mt:4}}>
          <h1 className="title">Add an existing smart contract</h1>
          <h2 className="subTitle">This adds an existing smart contract to the database</h2>
          <TextField id="scAddress" label="Smart Contract address" variant="standard" sx={{justifyContent: 'flex-end'}} onChange={changeValue}/>
          <Button sx={{ ml:10, mt:3}} onClick={generate}>Add</Button>
        </Box>
        <Box sx={{ display: 'block', justifyContent: 'flex-start', mt:4}}>
          <h1 className="title">Deploy a new empty smart contract</h1>
          <h2 className="subTitle">This deploys a new smart contract on Ethereum</h2>
          <Button sx={{ ml:10, mt:3}} onClick={deploy}>Deploy a new Contract</Button>
        </Box>
        <Box sx={{ display: 'block', mt:4}}>
          <h1 className="title">Changing the wallet</h1>
          <TextField sx={{mb:2, display:'block'}} id="paraphrase" label="Wallet paraphrase" variant="standard" onChange={(e) => { setParaphrase(e.target.value) }} type="password"/>
          <TextField sx={{mb:2, display:'block'}} id="password" label="Wallet password" variant="standard" onChange={(e) => { setPwd1(e.target.value) }} type="password"/>
          <TextField sx={{mb:2, display:'block'}} id="password2" label="Password verification" variant="standard" onChange={(e) => { setPwd2(e.target.value)}} type="password"/>
          <Button sx={{ ml:10, mt:3}} onClick={changeWallet}>Change Wallet</Button>
          </Box>

        <NavbarManager />
      </main>
  );
}

export default Settings;