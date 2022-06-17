import * as React from "react";
import { useNavigate, useLocation } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import QRcodeScanner from '../QRcodeScanner';

import NavbarManager from "./NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
const lockUrl = httpServer + 'lockUnlock?';

function TokenTransfer() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  var token = location.state.token;

  const cancel = () => {
    const params = new URLSearchParams({id: token.id, lock: false})
    fetch(lockUrl + params.toString(), {method: 'PUT'});
    navigate('/sales/map');
  };

  const transfer = () => {}

  const myTimeout = setTimeout(cancel, 8000);

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