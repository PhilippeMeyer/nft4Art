import * as React from "react";
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import { useSelector, useDispatch } from 'react-redux'

import NavbarManager from "../NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
const url = httpServer + 'apiV1/information/generateWallets';


function Wallets() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  
  const jwt = useSelector((state) => state.token.jwt);
  const dispatch = useDispatch();

  const generate = () => {
    fetch(url, { headers: {"authorization": 'Bearer ' + jwt }})
    .then((resp) => {
      console.log(resp)
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

  return (
    <>
      <main>
      <h1>This feature generates paper wallets for the customers</h1>
      <p>After specifying the number of wallets required, those will be directly dowloaded in a zip file containing the paper wallets and their enveloppes, ready to be printed</p>
        <Button onClick={generate}>Generate</Button>
        <NavbarManager />
      </main>
    </>
  );
}

export default Wallets;