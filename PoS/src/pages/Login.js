import * as React from "react";
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import Box from '@mui/material/Box';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useSnackbar } from 'notistack';
import { v4 as uuidv4 } from 'uuid';
import {browserName, browserVersion} from 'react-device-detect';
import { useDispatch } from 'react-redux'
import { storeJwt, startConnecting, storeDevice } from '../store/tokenSlice'

import logo from './nft.png';

const httpServer = process.env.REACT_APP_SERVER;
const deviceItemId = 'nft4ArtPosId';

function Login() {
    const [open, setOpen] = React.useState(false);
    const [password, setPassword] = React.useState();
    const [deviceId, setDeviceId] = React.useState();
    const [constructorHasRun, setConstructorHasRun] = useState(false);
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const constructor = () => {
        if (constructorHasRun) return;
        setConstructorHasRun(true);

        let device = localStorage.getItem(deviceItemId);
        if(device != null) {
          let dev = JSON.parse(device);
          setDeviceId(JSON.parse(device));
          dispatch(storeDevice(dev));
        }
    };

    const characteristicsDevice = () => {
        return { 
            device: {
                deviceId: uuidv4(),
                browser: browserName,
                browserVersion: browserVersion,
            }
        };
    }

    const handleOpenDialog = () => {
      setOpen(true);
    };
  
    const handleClose = () => {
      setOpen(false);
    };
  
    const handleLogin = () => {
      setOpen(false);
      performLogin(password);
    };

    const filterPassword = (key, value) => { 
        if (key === 'password') return undefined;
        else return value; 
    };

    const performLogin = async(pwd) => {
        let obj = deviceId == null ? characteristicsDevice() : deviceId;
        if (typeof pwd != 'undefined') obj.password = pwd;
         
        try {
            const response = await fetch(httpServer + 'apiV1/auth/signin', { method: 'POST', body: JSON.stringify(obj), headers: {"Content-type": "application/json;charset=UTF-8"}});
            console.log('rep:', response);
            let responseJson = await response.json();
            console.log('rep:', responseJson);

            if (response.ok) {
                if (deviceId == null) {
                    setDeviceId(obj);
                    dispatch(storeDevice(obj));
                    localStorage.setItem(deviceItemId, JSON.stringify(obj, filterPassword)); 
                }
                console.log('storage done');
                dispatch(storeJwt(responseJson.accessToken));
                console.log('redux done1');
                dispatch(startConnecting());
                console.log('redux done2');
                if (pwd !== undefined) navigate('/manager/tokens')
                else navigate('/sales/map');
            }
            else {
              enqueueSnackbar("Error after connecting to server - " + responseJson.error.message);
              console.error("Error after connecting to server - " + responseJson.error.message);
            }
        } catch(error) { 
          enqueueSnackbar("Error connecting to server - " + error); 
          console.error("Error connecting to server -" + error); 
        }
    }
    
    constructor();

    return (
      <>
        <main>
            <img src={logo} className="App-logo" alt="logo" />
            <Box display="flex" justifyContent="space-evenly" >        
              <Button variant="contained" className="button" onClick={handleLogin}>Sales login</Button>
              <Button variant="contained" className="button" onClick={handleOpenDialog}>Admin login</Button>
            </Box>

            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Login as Admin </DialogTitle>
              <DialogContent>
                <DialogContentText>
                  To connect as admin, please enter the wallet's password.
                </DialogContentText>
                <TextField
                  autoFocus
                  margin="dense"
                  id="password"
                  label="Wallet's password"
                  type="password"
                  fullWidth
                  variant="standard"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleLogin}>Login</Button>
              </DialogActions>
            </Dialog>
        </main>
      </>
    );
  }
  export default Login;

  