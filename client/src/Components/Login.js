import * as React from 'react';
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from "react-router-dom";

import { Wallet } from 'ethers';

import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

import { WalletContext } from '../WalletContext.js'
import NavbarManager from "./NavbarManager";

import { useSnackbar } from 'notistack';

//const httpServer = process.env.REACT_APP_SERVER;
const httpServer = 'http://192.168.1.5:8999/';

export default function Login() {

    const modeInsertMnemonic = 1;
    const modeWalletExists = 2;
    const modeCompleted = 3;
    const modeProgress = 4;

    const [wallet, setWallet] = useContext(WalletContext);

    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const navigate = useNavigate();

    useEffect(() => {
        if(wallet === undefined) { navigate('/wallet'); }
    }, []);


    return(
        <Box>
            <p>Welcome!</p>
            <NavbarManager />
        </Box>
    );
}