import * as React from 'react';
import { useState, useEffect } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Wallet } from 'ethers';

export default function WalletCreation({userWallet}) {

    const modeInsertMnemonic = 1;
    const modeWalletExists = 2;
    const modeCompleted = 3;
    var walletJson;


    const [mnemonic, setMnemonic] = useState([]);
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState(-1);

    function getMnemonic(event) {
        setMnemonic(event.target.value.split(' '));
    }

    function getPassword(event) {
        setPassword(event.target.value);
    }

    function validate() {
        if (walletJson == null) {
            console.log(mnemonic);
            let w = Wallet.fromMnemonic(mnemonic.join(' '));
            console.log(w.address);
            w.encrypt(password).then((jsonWallet) => {
                localStorage.setItem('wallet', jsonWallet);
                console.log('localstorage created');
                userWallet = w;
                setMode(modeCompleted);
            })
        }
        else {
            userWallet = Wallet.fromEncryptedJsonSync(walletJson, password);
            setMode(modeCompleted);
        }
    }

    useEffect(() => { 
        walletJson = localStorage.getItem('wallet');
        if (walletJson == null) setMode(modeInsertMnemonic);
        else setMode(modeWalletExists);
    }, []);
    
    

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
    )} else if( mode == modeCompleted) { return (
        <Box>
                <p>Wallet Loaded!</p>
        </Box>
    )}
}