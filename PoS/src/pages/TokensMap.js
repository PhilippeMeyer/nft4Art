import React, { Component } from "react";
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux'

import './Map.css';

import NavbarManager from "./NavbarManager";
import { storeJwt, loadTokens } from '../store/tokenSlice'

const httpServer = process.env.REACT_APP_SERVER;
const mapUrl = httpServer + 'map';
const mapImg = httpServer + 'map.jpg';
const lockUrl = httpServer + 'lockUnlock?';


function TokenMap() {  
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Local state for the screen and pict dimensions and the clickable regions 
  const [screenSize, setScreenSize] = useState({});
  const [pictSize, setPictSize] = useState({});
  const [map, setMap] = useState({});

  // Redux state for the jwt and the tokens
  const jwt = useSelector((state) => state.token.jwt);
  const tokens = useSelector((state) => state.token.data);
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
    const response = await fetch(mapUrl, { method: 'GET', headers: jwtHeader });
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
    let t = tokens[event.target.id];
    const params = new URLSearchParams({id: t.id, lock: true})
    fetch(lockUrl + params.toString(), { method: 'PUT', headers: jwtHeader });
    navigate('/sales/token/' + event.target.id, { state: { token: tokens[event.target.id]  }});
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

  if ((map.areas === undefined) || (pictSize.pictWidth === undefined)) return;

  let h = map.height;
  let w = map.width;
  const pictStyle = { width: pictSize.pictWidth, height: pictSize.pictHeight };

  return (
    <>
      <main>
        <div className="image" style={pictStyle}>
          <img src={mapImg} id="physicalimage" style={pictStyle}/>
          {map.areas.map((row) => {
            let s = {top: (row.y *100 / h) + "%", left: (row.x *100 / w) + "%", width: (row.width *100 / w) + "%", height: (row.height *100 /h) + "%"};
            let cl;
            if (row.index < tokens.length)  cl = tokens[row.index].isLocked ? 'locked' : 'unLocked';
            else cl = 'locked';
            
            return <a id={row.index} key={row.index} style={s} onClick={onclick} className={cl} ></a>
          })}
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