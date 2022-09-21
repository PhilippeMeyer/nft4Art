import * as React from 'react';
import { useState, useEffect } from 'react';
import { Wallet } from 'ethers';

import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';

import { useSnackbar } from 'notistack';
import RenderVote from '../utils/RenderVote.js'

//const httpServer = process.env.REACT_APP_SERVER;
const httpServer = 'http://192.168.1.5:8999/';
const urlGetVote = httpServer + 'apiV1/vote/getVote';

export default function WalletCreation({userWallet}) {

    const modeInsertMnemonic = 1;
    const modeWalletExists = 2;
    const modeCompleted = 3;
    const modeProgress = 4;

    const [mnemonic, setMnemonic] = useState([]);
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState(-1);
    const [progress, setProgress] = useState(1);
    const [walletJson, setWalletJson] = useState({});
    const [vote, setVote] = useState({});

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

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
        if (mode == modeInsertMnemonic) {
            let w = Wallet.fromMnemonic(mnemonic.join(' '));
            setMode(modeProgress);

            w.encrypt(password, progressCallback).then((jsonWallet) => {
                localStorage.setItem('wallet', jsonWallet);
                userWallet = w;
                setMode(modeCompleted);
            })
        }
        else if (mode == modeWalletExists) {
            setMode(modeProgress);
            Wallet.fromEncryptedJson(walletJson, password, progressCallback).then((w) => {userWallet = w; loadVote(); })
        }
    }

    const loadVote = async () => {
        try {
            let voteTemp = await fetchData();
            console.log('vote:', vote);
            voteTemp.items.forEach((item) => item.value = 0)
            let key;
            let headerTemp = {};
            for(key in voteTemp) {
                if(key != 'items') headerTemp[key] = vote[key]
            }
            //voteTemp.header = headerTemp;
            setVote({ header: headerTemp, items: voteTemp.items });
            setMode(modeCompleted);

            //fetchWallet().then(() => setLoaded(true));
        } catch(error) { enqueueSnackbar('Error loading the tokens'); console.error(error); }
    };
    
    async function fetchData(jwt) {
        const response = await fetch(urlGetVote, { method: 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }});
        const responseJson = await response.json();
        console.log(responseJson);
        return (responseJson);
    }


    useEffect(() => { 
        let wj = localStorage.getItem('wallet');
        if (wj == null) setMode(modeInsertMnemonic);
        else { 
            setWalletJson(wj);
            setMode(modeWalletExists);
        }
    }, []);
   
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
      

    if(mode == modeInsertMnemonic) { return(
        <Box>
        { (mnemonic.length == 0) ?
            <Box><TextField id="mnemonic" label="Mnemonic" variant="standard" onChange={getMnemonic} /></Box>
            :
            <Box>
                <Grid container>
                    { mnemonic.map((word, id) => (<Grid item key={id}><TextField value={word}/></Grid> )) }
                </Grid>
                <TextField id="password" label="password" variant="standard" type="password" onChange={getPassword} />
            </Box>
        }
        { (mnemonic.length != 0) && (password != '')? <Button onClick={validate}>Validate</Button> : <></>}
        </Box>
    )} else if(mode == modeWalletExists) { return (
        <Box>
            <TextField id="password" label="password" variant="standard" type="password" onChange={getPassword} />
            <Button onClick={validate}>Validate</Button>
        </Box>
    )} else if( mode == modeCompleted) { console.log(vote); return (
        <Box>
                <RenderVote questionList = {vote} />
        </Box>
    )} else if (mode == modeProgress) { return (
        <Box>
            <CircularProgressWithLabel value={progress} />
        </Box>
    )}
}