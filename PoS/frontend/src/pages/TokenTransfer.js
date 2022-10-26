import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import { Box } from '@mui/system';

import QRcodeScanner from '../QRcodeScanner';

import NavbarManager from "./NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
//const timeout = process.env.REACT_APP_SALES_TIMEOUT;
const timeout = 1000000000;
const lockUrl = httpServer + 'lockUnlock?';
const tfrUrl = httpServer + 'apiV1/sale/transfer';

function TokenTransfer() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const jwt = useSelector((state) => state.token.jwt);
  const timer = useRef(null);

  var token = location.state.token;

  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const cancel = () => {
    clearTimeout(timer.current);
    
    console.log('cancel timeout tokenTransfer');
    const params = new URLSearchParams({id: token.id, lock: false})
    fetch(lockUrl + params.toString(), { method: 'PUT', headers: jwtHeader });
    navigate('/sales/selectCollection');
  };

  const transfer = () => {
    clearTimeout(timer.current);
    
    fetch(tfrUrl, { method: 'POST', headers: jwtHeader, body: JSON.stringify({tokenAddr: token.addr, tokenId: token.id, destinationAddress: location.state.address}) })
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

  useEffect( () => {
    timer.current = setTimeout(cancel, timeout);

    return () => clearTimeout(timer.current);
  }, []);

  return (
    <>
      <main>
        <Box className='saleMain'>
            <img className="opaqueImg" src={token.overviewUrl}/>
            <Box className='boxTitle'>
              <h1 className="title">Confirming the transfer of token {token.description} to {location.state.address}</h1>        
              <h1 className="title">Token's price : <b>{token.price}</b></h1>
              <Button onClick={transfer} color="warning">Transfer</Button>
              <Button onClick={cancel} color="warning">Cancel</Button>
            </Box>

        </Box>
      </main>
    </>
  );
}

export default TokenTransfer;