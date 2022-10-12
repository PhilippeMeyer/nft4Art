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


function Settings() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  
  const [scAddress, setScAddress] = useState();

  const jwt = useSelector((state) => state.token.jwt);
  const dispatch = useDispatch();

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

  const changeValue = (evt) => { setScAddress(evt.target.value)}

  return (
    <>
      <main>
      <h1 className="title">Add an existing smart contract</h1>
      <h2 className="subTitle">This adds an existing smart contract to the database</h2>
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt:4}}>
        <TextField id="scAddress" label="Smart Contract address" variant="standard" sx={{justifyContent: 'flex-end'}} onChange={changeValue}/>
        <Button sx={{ ml:10, mt:3}} onClick={generate}>Add</Button>
      </Box>
        <NavbarManager />
      </main>
    </>
  );
}

export default Settings;