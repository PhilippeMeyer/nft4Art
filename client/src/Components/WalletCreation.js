import * as React from 'react';
import { useState } from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Wallet } from 'ethers';

export default function WalletCreation() {
    const [mnemonic, setMnemonic] = useState([]);

    function getMnemonic(event) {
        setMnemonic(event.target.value.split(' '));
    }

    function validate() {
        console.log(mnemonic);
        let w = Wallet.fromMnemonic(mnemonic.join(' '));
        console.log(w.address);
    }

    return (
        <Box>
            { (mnemonic.length == 0) ? <TextField id="mnemonic" label="Mnemonic" variant="standard" onChange={getMnemonic} /> :
            <Grid container>
                { mnemonic.map((word, id) => (<Grid item key={id}><TextField value={word}/></Grid> )) }
            </Grid> }
            { (mnemonic.length != 0) ? <Button onClick={validate}>Validate</Button> : <></>}
        </Box>
    )
}