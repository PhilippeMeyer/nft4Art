import * as React from "react";
import {useState, useEffect} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux'

import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';

import { useSnackbar } from 'notistack';

import NavbarManager from "./NavbarManager";
import { loadTokens, updatePrice } from '../store/tokenSlice'


const httpServer = process.env.REACT_APP_SERVER;

function Tokens() {

  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const jwt = useSelector((state) => state.token.jwt);
  const tokens = useSelector((state) => state.token.data);

  const [priceUpdate, setPriceUpdate] = useState([]);

  useEffect(() => { 
    loadData(); }, [location]);

  
  const loadData = () => {
    if (jwt !== undefined)
      fetchData(jwt) 
      .then((tokens) => { dispatch(loadTokens(tokens)); })
      .catch((error) => { enqueueSnackbar('Error loading the tokens'); console.error(error); });
  };
  
  const updatePriceField = (e) => {
    if (e.target === undefined) return;

    let i = parseInt(e.target.id);
    let value = Number(e.target.value);

    if (priceUpdate.indexOf(i) == -1) setPriceUpdate([...priceUpdate, i]);
    dispatch(updatePrice({index: i, price: value }));
  };

  const save = async () => {
    let tokensUpdate = [];
    console.log(priceUpdate);
    priceUpdate.map((index) => { 
        let t = { id: tokens[index].id, price: tokens[index].price };
        tokensUpdate.push(t); 
    });
    console.log(tokensUpdate);
    const cancel = () => { loadData(); };
    
    const response = await fetch(httpServer + 'apiV1/price/updates', { method: 'PUT', body: JSON.stringify(tokensUpdate), 
                                 headers: {"Content-type": "application/json;charset=UTF-8", "authorization": 'Bearer ' + jwt }});
    if (!response.ok)  {
      const responseJson = await response.json();
      enqueueSnackbar("Error connecting to server - " + responseJson.error.message);
    }
  };

  const cancel = () => {};

  if (tokens.length == 0 || tokens.length === undefined) return (<><main><NavbarManager /></main></>);

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
                    onChange={updatePriceField}
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
        <NavbarManager />
      </main>
    </>
  );
}

function fetchData(jwt) {
  return fetch(httpServer + 'tokens', {
      method: 'get',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': 'Bearer ' + jwt
      }})
    .then((response) =>  response.json())
    .then((responseJson) => {
      return (responseJson);
  });
}

export default Tokens;