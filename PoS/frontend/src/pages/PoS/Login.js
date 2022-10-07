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
import { storeJwt, startConnecting, storeDevice } from '../../store/tokenSlice'

import logo from './nft2art.png';

const httpServer = process.env.REACT_APP_SERVER;
const deviceItemId = 'nft4ArtPosId';


//
// Login
// login screen for the PoS
//
// The login offers two possible route: login as manager or login as sales
//
// The first connection on a new point of dale has to be performed as a maneger in order to register the point of sale in the system
// The password used by the manager is the wallet password on the server. Providing the password and openning a PoS has a manageer loads the
// wallet on the server side
//
// The device structure stored in local storage contains
//  - deviceId : unique device identifier
//  - browser: name of the browser used
//  - browserVersion
//


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
          setDeviceId(dev);
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
            let responseJson = await response.json();

            if (response.ok) {
                if (deviceId == null) {
                    setDeviceId(obj);
                    dispatch(storeDevice(obj));
                    localStorage.setItem(deviceItemId, JSON.stringify(obj, filterPassword)); 
                }
                dispatch(storeJwt(responseJson.accessToken));
                dispatch(startConnecting(responseJson.accessToken));
                if (pwd !== undefined) navigate('/manager/tokens')
                else navigate('/sales/selectCollection');
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
                <Button type="submit" onClick={handleLogin}>Login</Button>
              </DialogActions>
            </Dialog>
        </main>
      </>
    );
  }
  export default Login;

  