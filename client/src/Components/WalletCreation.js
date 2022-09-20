import * as React from 'react';
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Wallet } from 'ethers';

export default function WalletCreation() {
    const [mnemonic, setMnemonic] = useState([]);
    const [password, setPassword] = useState('');

    function getMnemonic(event) {
        setMnemonic(event.target.value.split(' '));
    }
    function getPassword(event) {
        setPassword(event.target.value);
    }

    function validate() {
        console.log(mnemonic);
        let w = Wallet.fromMnemonic(mnemonic.join(' '));
        console.log(w.address);
        w.encrypt(password).then((jsomWallet) => {
            localStorage.setItem('wallet', jsomWallet);
        })
    }

    return (
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
    )
}