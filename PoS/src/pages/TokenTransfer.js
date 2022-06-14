import * as React from "react";
import { useNavigate, useLocation } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import QRcodeScanner from '../QRcodeScanner';

import NavbarManager from "./NavbarManager";
import { useAuth } from "../auth";

const httpServer = process.env.REACT_APP_SERVER;

function TokenTransfer() {

  const { authTokens } = useAuth();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  var token = location.state.token;

  return (
    <>
      <main>
        <h2>Transferring token {token.description} to {location.state.address}</h2>
        <h2>Token's price : <b>{token.price}</b></h2>
      </main>
    </>
  );
}

export default TokenTransfer;