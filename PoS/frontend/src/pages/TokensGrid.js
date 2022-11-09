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
import IconButton from '@mui/material/IconButton';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';

import { loadCollections } from '../store/tokenSlice'

import './Map.css';

import NavbarManager from "./NavbarManager";
import { loadTokens, setCurrentToken } from '../store/tokenSlice'
import { toBeEnabled } from "@testing-library/jest-dom/dist/matchers";

const httpServer = process.env.REACT_APP_SERVER;
const imageSize = 200;

const lockUrl = httpServer + 'lockUnlock?';
const tokenUrl = httpServer + 'apiV1/token/list';

function TokenGrid({ collectionId }) {  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local state for the screen and pict dimensions and the clickable regions 
  const [selected, setSelected] = React.useState();
  const [currency, setCurrency] = React.useState('fiat');
  const [screenSize, setScreenSize] = useState({});

  // Redux state for the jwt and the tokens
  const jwt = useSelector((state) => state.token.jwt);
  const tokens = useSelector((state) => state.token.data);
  const [open, setOpen] = React.useState(false);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const updateDimensions = () => {
    setScreenSize({screenWidth: window.innerWidth, screenHeight: window.innerHeight});
  }

  const loadData = () => {
    if (jwt !== undefined)
      fetchData(jwt) 
      .then((tks) => { 
          tks.forEach((tk, index) => tk.index = index);
          dispatch(loadTokens(tks)); 
      })
      .catch((error) => { enqueueSnackbar('Error loading the tokens'); console.error(error); });
  };

  const onclick = (event) => {
    const sel = tokens.find((elt) => elt.id == event.target.id);
    if(tokens[sel.index].isLocked) return;

    setSelected(sel);
    setOpen(true);
  };

  const handleSale = () => { 
    const params = new URLSearchParams({id: selected.id, lock: true})
    fetch(lockUrl + params.toString(), { method: 'PUT', headers: jwtHeader });
    dispatch(setCurrentToken(selected));
    navigate('/sales/token/' + currency + '/' + selected.id, { state: { token: selected  }});
  };

  useEffect( () => {
      updateDimensions();
      window.addEventListener("resize", updateDimensions);

      loadData();

      return () => {
        window.removeEventListener('resize', updateDimensions);
      } 
  }, []);
  
  const defineColumns = () => {
    return Math.floor(screenSize.screenWidth / imageSize);
  };

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const changeCurrency = (event) => {
    setCurrency(event.target.value);
  };

  return (
    <>
          <ImageList cols={defineColumns()}>
            {tokens.filter(elt => elt.collectionId == collectionId).map((token) => (
              <ImageListItem key={token.id} style={{cursor:tokens[token.index].isLocked ? "not-allowed" : "default"}}>
                <img
                  src={token.iconUrl}
                  alt={token.description}
                  id={token.id}
                  loading="lazy"
                  onClick={onclick}
                  style={{backgroundColor:'white', opacity:token.isLocked ? 0.5 : 1}}
                />
                <ImageListItemBar
                  title={`Price: ${token.price} CHF`}
                  subtitle={`Qty: ${token.availableTokens}`}
                  actionIcon={
                    <Tooltip title={`${token.description} - ${token.author}`}>
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.54)' }}
                        aria-label={`info about ${token.description}`}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Sale currency</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Which currency is the customer requesting?
              </DialogContentText>
              <RadioGroup name="use-radio-group" defaultValue="fiat" onChange={changeCurrency}>
              <FormControlLabel value="invoice" label="Invoice" control={<Radio />} />
              <FormControlLabel value="fiat" label="Cash - Chf" control={<Radio />} />
                <FormControlLabel value="btc" label="Bitcoin" control={<Radio />} />
                <FormControlLabel value="eth" label="Ether" control={<Radio />} />
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSale}>Sell</Button>
            </DialogActions>
          </Dialog>
    </>
  );
}

function fetchData(jwt) {
  return fetch(tokenUrl, {
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

export default TokenGrid;