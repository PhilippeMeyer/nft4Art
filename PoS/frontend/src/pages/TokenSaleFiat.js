import React, {useEffect, useState, useRef} from "react";
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
  const timer = useRef(null);

  const token = location.state.token;

  const onNewScanResult = (decodedText, decodedResult) => {
    clearTimeout(timer.current);

    if (decodedText.length != 42) return;
    if (!decodedText.startsWith('0x')) return;

    enqueueSnackbar('Transfer token to :' + decodedText);
    navigate('/sales/transfer/', { state: { token: token, address: decodedText  }});
  };

  const cancel = () => {
    clearTimeout(timer.current);

    const params = new URLSearchParams({id: token.id, lock: false})
    console.log('Cancel timeout tokenSaleFiat');
    fetch(lockUrl + params.toString(), {method: 'PUT'});
    navigate('/sales/selectCollection');
  };

  useEffect( () => {
    timer.current = setTimeout(cancel, timeout);

    return () => clearTimeout(timer.current);
  }, []);


  if (token === undefined)
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
      <>
        <main>
          <h1 className="title">Sale of token #{token.id} in CHF</h1>
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