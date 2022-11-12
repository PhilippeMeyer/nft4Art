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

const cerateWalletUrl = httpServer + 'apiV1/token/createWallet';


//
// Login
// login screen for the PoS
//
// The login offers two possible route: login as manager or login as sales
//
// The first connection on a new point of dale has to be performed as a maneger in order to register the point of sale in the system
// The password used by the manager is the wallet password on the server. Providing the password and openning a PoS has a manageer loads the
// wallet on the server side. It has to be done before any further operation.
//
//
// The device structure stored in local storage contains
//  - deviceId : unique device identifier
//  - browser: name of the browser used
//  - browserVersion
//


function Login() {
  const [open, setOpen] = React.useState(false);
  const [createWalletDialog, setCreateWalletDialog] = React.useState(false);

    const [password, setPassword] = React.useState();
    const [deviceId, setDeviceId] = React.useState();
    const [pwd1, setPwd1] = useState('');
    const [pwd2, setPwd2] = useState('');
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

    var characteristicsDevice = () => {
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

    const openCreateWalletDialog = () => { setCreateWalletDialog(true); }
  
    const handleClose = () => {
      setOpen(false);
      setCreateWalletDialog(false);
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
        if (typeof pwd != 'undefined') obj = {device: obj.device, password: pwd};
         
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

//TODO: change the button to icon and locate on the side
//Manage the pdf returned by the server
//Remove the dialog when done

    const handleCreateWallet = () => {
      if(pwd1 != pwd2) return;
      if(pwd1 === undefined) return;

      const obj = {password: pwd1};
      console.log(obj);
      fetch(cerateWalletUrl, { method: 'POST', body: JSON.stringify(obj), headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }})
      .then((resp) => {
        if (resp.ok) return resp.blob();
        else {
          enqueueSnackbar('Error connecting to server: ' + resp.status);
          return null;
        }
      })
      .then((data) => { 
        if (data == null) return;
        var a = document.createElement("a");
        a.href = window.URL.createObjectURL(data);
        a.download = "paperWallet.zip";
        a.click(); 
      })
      .catch((e) => { enqueueSnackbar('Error connecting to server: ' + e);});
    };
  
    
    constructor();

    return (
      <>
      <Box className="loginScreen">
        <img src={logo} className="App-logo" alt="logo" />
        <Box display="flex" justifyContent="space-evenly" >        
          <Button variant="contained" className="button" onClick={handleLogin}>Sales login</Button>
          <Button variant="contained" className="button" onClick={handleOpenDialog}>Admin login</Button>
        </Box>
        </Box>
        <Box className="settingsButton">
          <Button variant="contained"  sx={{display:"none"}} onClick={openCreateWalletDialog}>Create Wallet</Button>
        </Box>

        <Dialog open={open} onClose={handleClose} onKeyUp={(e) => { if(e.key =='Enter') handleLogin();}}>
          <DialogTitle>Login as Admin </DialogTitle>
          <DialogContent>
            <DialogContentText>
              To connect as admin, please enter the wallet's password.
            </DialogContentText>
            <TextField focused
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

        <Dialog open={createWalletDialog} onClose={handleClose}>
          <DialogTitle>Create a new wallet</DialogTitle>
          <DialogContent>
            <DialogContentText>
              To create a new wallet, choose and keep safely the associated password.
            </DialogContentText>
            <Box sx={{ display: 'block', justifyContent: 'flex-start', mt:4}}>
              <TextField sx={{mb:2, display:'block'}} id="password" label="Wallet password" variant="standard" onChange={(e) => { setPwd1(e.target.value) }} type="password"/>
              <TextField sx={{mb:2, display:'block'}} id="password2" label="Password verification" variant="standard" onChange={(e) => { setPwd2(e.target.value)}} type="password"/>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleCreateWallet}>Create Wallet</Button>
          </DialogActions>
        </Dialog>
        </>
    );
  }
  export default Login;

  