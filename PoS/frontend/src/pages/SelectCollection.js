import * as React from "react";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux'
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import ListSubheader from '@mui/material/ListSubheader';
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';


import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';

import './Map.css';

import NavbarManager from "./NavbarManager";
import { storeJwt, loadTokens } from '../store/tokenSlice'

const httpServer = process.env.REACT_APP_SERVER;
const colUrl = httpServer + 'apiV1/token/collections';
const mapUrlMap = httpServer + 'apiV1/token/collectionMap?collectionId=01';

const lockUrl = httpServer + 'lockUnlock?';


function SelectCollection() {  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local state for the screen and pict dimensions and the clickable regions 
  const [collections, setCollections] = React.useState();

  // Redux state for the jwt and the tokens
  const jwt = useSelector((state) => state.token.jwt);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const loadData = () => {
    if (jwt !== undefined)
      fetchData(jwt) 
      .then((collections) => { setCollections(collections); })
      .catch((error) => { enqueueSnackbar('Error loading the collections'); console.error(error); });
  };

  const onclick = (event) => {
  };


  useEffect( () => {
      loadData();
  }, []);
  
  if (collections === undefined) {
    return(<></>)
  }

  return (
    <>
      <main>
        <div>
          <Grid container spacing={5}>
            {Object.keys(collections).map((col, index) => (
              <Grid item key={index}>
                <Card>
                  <CardMedia
                    component="img"
                    height="140"
                    image={collections[col].imageUrl}
                    alt={col}
                  />
                  <CardContent>
                  <Typography variant="h5">
                      Collection : {col}
                    </Typography>
                    <Typography>
                      #items:  {collections[col].tokenIds.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>        
        </div>
      </main>
    </>
  );
}

function fetchData(jwt) {
  return fetch(colUrl, {
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

export default SelectCollection;