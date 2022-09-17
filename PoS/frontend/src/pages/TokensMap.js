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

import './Map.css';

import NavbarManager from "./NavbarManager";
import { storeJwt, loadTokens } from '../store/tokenSlice'

const httpServer = process.env.REACT_APP_SERVER;
const mapUrl = httpServer + 'map';
const mapUrlImg = httpServer + 'apiV1/token/collectionImg?id=';
const mapUrlMap = httpServer + 'apiV1/token/collectionMap?id=';

const lockUrl = httpServer + 'lockUnlock?';


function TokenMap({ collectionId }) {  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local state for the screen and pict dimensions and the clickable regions 
  const [screenSize, setScreenSize] = useState({});
  const [pictSize, setPictSize] = useState({});
  const [map, setMap] = useState({});
  const [selected, setSelected] = React.useState();
  const [currency, setCurrency] = React.useState();

  // Redux state for the jwt and the tokens
  const jwt = useSelector((state) => state.token.jwt);
  const tokens = useSelector((state) => state.token.data);
  const [open, setOpen] = React.useState(false);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();


  const updateDimensions = () => {
    setScreenSize({screenWidth: window.innerWidth, screenHeight: window.innerHeight});

    const imageRatio = map.width / map.height;
    const screenRatio = window.innerWidth / window.innerHeight;
    let renderHeight, renderWidth, gapLeft, gapTop;
    
    if (screenRatio > imageRatio) {
        renderHeight = window.innerHeight;
        renderWidth = imageRatio * window.innerHeight;
        gapLeft = (window.innerWidth - renderWidth) / 2;
    } else {
        renderWidth = window.innerWidth;
        renderHeight = window.innerWidth / imageRatio;
        gapTop = (window.innerHeight - renderHeight) / 2;
    }
    setPictSize({pictWidth: renderWidth, pictHeight: renderHeight});
  };

  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const loadMap = async (jwt) => {
    const response = await fetch(mapUrlMap + collectionId, { method: 'GET', headers: jwtHeader });
    const responseJson = await response.json();
    return (responseJson);
  }

  const loadData = () => {
    if (jwt !== undefined)
      fetchData(jwt) 
      .then((tokens) => { dispatch(loadTokens(tokens)); })
      .catch((error) => { enqueueSnackbar('Error loading the tokens'); console.error(error); });
  };

  const onclick = (event) => {
    setSelected(event.target.id);
    setOpen(true);
  };

  const handleSale = () => {  
    let t = tokens[selected];
    const params = new URLSearchParams({id: t.id, lock: true})
    fetch(lockUrl + params.toString(), { method: 'PUT', headers: jwtHeader });
    navigate('/sales/token/' + currency + '/' + selected, { state: { token: tokens[selected]  }});
  };

  useEffect( () => {
    loadMap(jwt).then((m) => {
      setMap(m);
      loadData();
    });

    return () => {
      window.removeEventListener('resize', updateDimensions);
    }
  }, []);
  
  useEffect( () => {
    if (map.areas === undefined) return;
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
  }, [map]);

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const changeCurrency = (event) => {
    setCurrency(event.target.value);
  };

  if ((map.areas === undefined) || (pictSize.pictWidth === undefined)) return;

  let h = map.height;
  let w = map.width;
  const pictStyle = { width: pictSize.pictWidth, height: pictSize.pictHeight };

  return (
    <>
      <main>
        <div className="image" style={pictStyle}>
          <img src={mapUrlImg + collectionId} id="physicalimage" style={pictStyle}/>
          {map.areas.map((row) => {
            let s = {top: (row.y *100 / h) + "%", left: (row.x *100 / w) + "%", width: (row.width *100 / w) + "%", height: (row.height *100 /h) + "%"};
            let cl;
            if (row.index < tokens.length)  cl = tokens[row.index].isLocked ? 'locked' : 'unLocked';
            else cl = 'locked';
            
            return <a id={row.index} key={row.index} style={s} onClick={onclick} className={cl} ></a>
          })}

          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Sale currency</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Which currency is the customer requesting?
              </DialogContentText>
              <RadioGroup name="use-radio-group" defaultValue="fiat" onChange={changeCurrency}>
                <FormControlLabel value="fiat" label="Chf" control={<Radio />} />
                <FormControlLabel value="btc" label="Bitcoin" control={<Radio />} />
                <FormControlLabel value="eth" label="Ether" control={<Radio />} />
              </RadioGroup>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button onClick={handleSale}>Sell</Button>
            </DialogActions>
          </Dialog>

        </div>
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

export default TokenMap;