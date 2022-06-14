import * as React from "react";
import {useState, useEffect} from 'react';
import { useLocation } from "react-router-dom";

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import NavbarManager from "./NavbarManager";
import { useAuth } from "../auth";

const httpServer = process.env.REACT_APP_SERVER;

function PoS() {

  const { authTokens } = useAuth();

  const generate = () => {

  } 

  return (
    <>
      <main>
      <h1>This feature generates paper wallets for the customers</h1>
      <p>After specifying the number of wallets required, those will be directly dowloaded ready to be printed</p>
        <Button onClick={generate}>Generate</Button>
        <NavbarManager />
      </main>
    </>
  );
}

function fetchData(jwt) {
  console.log('fatch data ' + jwt);
  return fetch(httpServer + 'tokens', {
      method: 'get',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': 'Bearer ' + jwt
      }})
    .then((response) => response.json())
    .then((responseJson) => {
      return (responseJson);
  });
}

export default PoS;