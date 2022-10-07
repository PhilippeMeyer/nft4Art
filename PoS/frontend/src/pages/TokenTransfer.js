import * as React from "react";
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import QRcodeScanner from '../QRcodeScanner';

import NavbarManager from "./NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
const timeout = process.env.REACT_APP_SALES_TIMEOUT;
const lockUrl = httpServer + 'lockUnlock?';
const tfrUrl = httpServer + 'apiV1/sale/transfer';

function TokenTransfer() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const jwt = useSelector((state) => state.token.jwt);

  var token = location.state.token;

  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const cancel = () => {
    clearTimeout(myTimeout);
    console.log('cancel');
    const params = new URLSearchParams({id: token.id, lock: false})
    fetch(lockUrl + params.toString(), { method: 'PUT', headers: jwtHeader });
    navigate('/sales/selectCollection');
  };

  const transfer = () => {
    clearTimeout(myTimeout);
    fetch(tfrUrl, { method: 'POST', headers: jwtHeader, body: JSON.stringify({tokenAddr: token.addr, tokenId: token.tokenIdStr, destinationAddress: location.state.address}) })
      .then(() =>  { 
        enqueueSnackbar('Initiated transfer token to :' + location.state.address);
        setTimeout( () => navigate('/sales/selectCollection'), 2000);
      })
      .catch((error) => { 
        enqueueSnackbar('Error in transfer token :' + error); 
        console.error(error); 
        setTimeout( () => navigate('/sales/selectCollection'), 2000);
      });
  };

  const myTimeout = setTimeout(cancel, timeout);

  return (
    <>
      <main>
        <h2>Transferring token {token.description} to {location.state.address}</h2>
        <h2>Token's price : <b>{token.price}</b></h2>
        <Button onClick={transfer}>Transfer</Button>
        <Button onClick={cancel}>Cancel</Button>
      </main>
    </>
  );
}

export default TokenTransfer;