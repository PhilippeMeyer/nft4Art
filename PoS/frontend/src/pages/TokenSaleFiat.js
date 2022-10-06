import React, {useEffect, useState} from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import QRcodeScanner from '../QRcodeScanner';

const httpServer = process.env.REACT_APP_SERVER;
const timeout = process.env.REACT_APP_SALES_TIMEOUT;

const lockUrl = httpServer + 'lockUnlock?';


function TokenSaleFiat() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  const token = location.state.token;

  const onNewScanResult = (decodedText, decodedResult) => {
    if (decodedText.length != 42) return;
    if (!decodedText.startsWith('0x')) return;

    enqueueSnackbar('Transfer token to :' + decodedText);
    clearTimeout(myTimeout);
    navigate('/sales/transfer/', { state: { token: token, address: decodedText  }});
  };

  const cancel = () => {
    const params = new URLSearchParams({id: token.id, lock: false})
    fetch(lockUrl + params.toString(), {method: 'PUT'});
    navigate(-1);
  };

  const myTimeout = setTimeout(cancel, timeout);

  if (token === undefined)
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
      <>
        <main>
          <h2>Sale of token #{token.id} in CHF</h2>
          <h2>Token price: {token.price}<b></b></h2>
          <p>When the cash transaction is completed, please scan the customer's personnal address</p>
          <QRcodeScanner
                  fps={10}
                  qrbox={250}
                  disableFlip={false}
                  qrCodeSuccessCallback={onNewScanResult}
          />
          <Button onClick={cancel}>Cancel</Button>
        </main>
      </>
    );
}

export default TokenSaleFiat;