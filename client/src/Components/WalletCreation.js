import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";
import { Wallet } from 'ethers';
import { v4 as uuidv4 } from 'uuid';

import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { useSnackbar } from 'notistack';
import { WalletContext } from '../WalletContext.js'
import { RestartAlt } from '@mui/icons-material';

const httpServer = process.env.REACT_APP_SERVER;
const urlGetVote = httpServer + 'apiV1/vote/getVote';
const urlLogin = httpServer + 'apiV1/auth/appLogin';


export default function WalletCreation() {

    const modeInsertMnemonic = 1;
    const modeWalletExists = 2;
    const modeCompleted = 3;
    const modeProgress = 4;

    const [wallet, setWallet] = useContext(WalletContext);

    const [mnemonic, setMnemonic] = useState([]);
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState(-1);
    const [progress, setProgress] = useState(1);
    const [walletJson, setWalletJson] = useState({});
    const [vote, setVote] = useState({});

    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    function getMnemonic(event) {
        setMnemonic(event.target.value.split(' '));
    }

    function getPassword(event) {
        setPassword(event.target.value);
    }

    function progressCallback(value) {
        setProgress(Math.floor(value * 100));
    }

    function validate() {
        if (mode === modeInsertMnemonic) {
            let w = Wallet.fromMnemonic(mnemonic.join(' '));
            setMode(modeProgress);

            w.encrypt(password, progressCallback).then((jsonWallet) => {
                localStorage.setItem('wallet', jsonWallet);
                setWallet(w);
                setMode(modeCompleted);
            })
        }
        else if (mode === modeWalletExists) {
            setMode(modeProgress);
            Wallet.fromEncryptedJson(walletJson, password, progressCallback).then((w) => { 
                setWallet(w);
            })
        }
    }

    const loginServer = async () => {
        var appId = localStorage.getItem('appId');
        if (appId == null) {
            appId = uuidv4();
            localStorage.setItem('appId', appId);
        }

        const addr = await wallet.getAddress();
        const appLoginMessage = { appId: appId, address: addr, nonce: Date.now()};
        console.log('message: ', JSON.stringify(appLoginMessage));
        const signature = await wallet.signMessage(JSON.stringify(appLoginMessage));
        console.log('signature:', signature);
        let msg = { message: appLoginMessage, signature: signature };
        

        const res = await fetch(urlLogin, {
            method: 'POST',  headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
            body: JSON.stringify(msg) }); 

        if (res.status !== 200) { console.log('Error login server: ' + res.status); return; }
        const ret = await res.json();
        const jwt = ret.accessToken;
        localStorage.setItem('jwt', jwt);
    }

    useEffect(() => { 
        let wj = localStorage.getItem('wallet');
        if (wj == null) setMode(modeInsertMnemonic);
        else { 
            setWalletJson(wj);
            setMode(modeWalletExists);
        }
    }, []);

    useEffect(() => {
        if (wallet !== undefined) loginServer().then(() => navigate('/'));         
    }, [wallet]);

    function CircularProgressWithLabel(props) {
        return (
          <Box sx={{ position: 'relative', display: 'inline-flex'}}>
            <CircularProgress variant="determinate" size={100} {...props} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary">
                {props.value + '%'}
              </Typography>
            </Box>
          </Box>
        );
      }
      

    if(mode === modeInsertMnemonic) { return(
        <Box>
        { (mnemonic.length === 0) ?
            <Box><TextField id="mnemonic" label="Mnemonic" variant="standard" onChange={getMnemonic} /></Box>
            :
            <Box>
                <Grid container>
                    { mnemonic.map((word, id) => (<Grid item key={id}><TextField value={word}/></Grid> )) }
                </Grid>
                <TextField id="password" label="password" variant="standard" type="password" onChange={getPassword} />
            </Box>
        }
        { (mnemonic.length !== 0) && (password !== '')? <Button onClick={validate}>Validate</Button> : <></>}
        </Box>
    )} else if(mode === modeWalletExists) { return (
        <Box>
            <TextField id="password" label="password" variant="standard" type="password" onChange={getPassword} />
            <Button onClick={validate}>Validate</Button>
        </Box>
    )} else if( mode === modeCompleted) { console.log(vote); return (
        <Box>
                <p>Wallet Loaded</p>
        </Box>
    )} else if (mode === modeProgress) { return (
        <Box>
            <CircularProgressWithLabel value={progress} />
        </Box>
    )}
}