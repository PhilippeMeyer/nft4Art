import * as React from "react";
import {useState, useEffect} from 'react';
import { useLocation } from "react-router-dom";

import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import { useAuth } from "../auth";

const httpServer = process.env.REACT_APP_SERVER;

function Tokens() {
  const [constructorHasRun, setConstructorHasRun] = useState(false);
  const [tokens, setTokens] = useState([[]]);
  const [jwt, setJwt] = React.useState();
  const location = useLocation();
  const { authTokens } = useAuth();

  useEffect(() => {
    if (authTokens !== undefined)
      fetchData(authTokens) 
      .then((tokens) => { setTokens(tokens); console.log(tokens); })
      .catch((error) => { console.error(error); });
  }, [location]);

  const updatePrice = (e) => { 
    let i = parseInt(e.target.id);
    console.log('id: ' + e.target.id + " value: " + e.target.value); 
    tokens[i].priceUpdated = true;
    tokens[i].price = e.target.value;
  };

  const save = async () => {
    let tokensUpdate = [];

    tokens.map((token) => { 
      if (token.priceUpdated) {
        let t = { id: token.id, price: token.price };
        tokensUpdate.push(t); 
      }
    });
    
    const response = await fetch(httpServer + 'apiV1/price/updates', { method: 'PUT', body: JSON.stringify(tokensUpdate), 
                                 headers: {"Content-type": "application/json;charset=UTF-8", "authorization": 'Bearer ' + authTokens }});
    const responseJson = await response.json();
    if (!response.ok)  console.log("Error connecting to server - " + responseJson.error.message);
  };

  const cancel = () => {};

  return (
    <>
      <main>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tokens.map((token, index) => 
              <TableRow style={{fontSize: '4rem'}} key={token.id}>
                <TableCell align="left" component="th" scope="row">
                  <Avatar src={token.iconUrl} sx={{ width: 70, height: 70 }}/>
                </TableCell>
                <TableCell align="left" component="th" scope="row">{token.tokenIdStr}</TableCell>
                <TableCell align="left" component="th" scope="row">{token.availableTokens}</TableCell>
                <TableCell align="left" component="th" scope="row">{token.description}</TableCell>
                <TableCell align="left" component="th" scope="row">
                  <TextField id={index.toString()} label="New Price" variant="standard" type="number" defaultValue={token.price} 
                    onChange={updatePrice}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Chf</InputAdornment>,
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <Button onClick={cancel}>Cancel</Button>
        <Button onClick={save}>Save</Button>
      </main>
    </>
  );
}

function fetchData(jwt) {
  console.log('fatch data ' + jwt);
  return fetch(httpServer, {
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

export default Tokens;