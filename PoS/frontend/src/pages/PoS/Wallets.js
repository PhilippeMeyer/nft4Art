import * as React from "react";
import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useSelector, useDispatch } from 'react-redux'

import NavbarManager from "../NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
const url = httpServer + 'apiV1/information/generateWallets';


function Wallets() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  
  const [nbWallets, setNbWallets] = useState();

  const jwt = useSelector((state) => state.token.jwt);
  const dispatch = useDispatch();

  const generate = () => {
    fetch(url + '?nbWallets=' + nbWallets, { headers: {"authorization": 'Bearer ' + jwt }})
    .then((resp) => {
      if (resp.ok) return resp.blob();
      else {
        enqueueSnackbar('Error connecting to server: ' + resp.status);
        return null;
      }
    })
    .then((data) => { 
      if (data == null) return;
      var a = document.createElement("a");
      a.href = window.URL.createObjectURL(data);
      a.download = "paperWallet.zip";
      a.click(); 
    })
    .catch((e) => { enqueueSnackbar('Error connecting to server: ' + e);});
  };

  const changeValue = (evt) => { setNbWallets(evt.target.value)}

  return (
    <>
      <main>
      <h1 className="title">Generate paper wallets for the customers</h1>
      <h2 className="subTitle">After specifying the number of wallets required, those will be directly dowloaded in a zip file containing the paper wallets and their enveloppes, ready to be printed</h2>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt:4}}>
        <TextField id="nbWallets" label="Nb wallets to create" variant="standard" type="number" sx={{justifyContent: 'flex-end'}} onChange={changeValue}/>
        <Button sx={{ ml:10, mt:3}} onClick={generate}>Generate</Button>
      </Box>
        <NavbarManager />
      </main>
    </>
  );
}

export default Wallets;