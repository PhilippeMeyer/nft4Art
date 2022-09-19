import * as React from 'react';
import { useState, useEffect } from 'react';

import { BigNumber, constants, Contract, ContractFactory, errors, providers, utils, Wallet } from "ethers";

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';

import { useSnackbar } from 'notistack';

import RenderVote from './RenderVote';
import EncodeVote from './EncodeVote';

const httpServer = process.env.REACT_APP_SERVER;
const urlGetVote = httpServer + 'apiV1/vote/getVote';
const urlGetWallet = httpServer + 'apiV1/vote/getWallet';
const urlSendVote = httpServer + 'apiV1/vote/sendVote';

export default function DisplayVote() {

    const [items, setItems] = useState([]);
    const [loaded, setLoaded] = useState(false);
    const [wallet, setWallet] = useState({});
    const [header, setHeader] = useState({ title: '', start: undefined, end: undefined });
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const renderMargin = 3;

    useEffect( () => {
        loadVote();
    }, []);

    const  loadVote = () => {
        fetchData() 
            .then((vote) => {
                console.log('vote:', vote);
                vote.items.forEach((item) => item.value = 0)
                setItems(vote.items);
                let key;
                let headerTemp = {};
                for(key in vote) {
                    if(key != 'items') headerTemp[key] = vote[key]
                }
                setHeader(headerTemp);

                fetchWallet().then(() => setLoaded(true));
            })
            .catch((error) => { enqueueSnackbar('Error loading the tokens'); console.error(error); });
    };
    
    function fetchData(jwt) {
        return fetch(urlGetVote, {
            method: 'get',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }})
          .then((response) =>  response.json())
          .then((responseJson) => {
            return (responseJson);
        });
    }
    function fetchWallet(jwt) {
        console.log('fetch wallet');
        return fetch(urlGetWallet, {
            method: 'get',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }
        })
          .then((response) =>  response.json())
          .then((responseJson) => {console.log(responseJson); Wallet.fromEncryptedJson(JSON.stringify(responseJson), "12345678").then((w) => setWallet(w))});    
    }

    async function performVote() {
        try {
            let overrides = { gasLimit: 750000 }
    
            const signer = wallet;
            const address = wallet.address;
            console.log('signer:', signer, 'addr:', address);
    
            EncodeVote(items);

            const domain = {
                name: 'GovernedNFT',
                version: '1.0.0',
                chainId: header.chainId,
                verifyingContract: header.contract
            };
    
            const types = { 
                BallotMessage: [
                    { name: 'from',     type: 'address' },
                    { name: 'voteId',   type: 'uint128' },
                    { name: 'data',     type: 'bytes' }
                ]
            };
    
            const values = {
                from: wallet.address,
                voteId: header.id,
                data: '0x01'
            };
    
            let signature = await signer._signTypedData(domain, types, values)
            console.log('Signature: ', signature)
/*
            await fetch(urlSendVote, { 
                method: 'POST', 
                headers:{ 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({domain: domain, types: types, values: values, signature: signature})
            });
*/            
        } catch(e) { console.error(e.message) }
    }

    function formatTime(time) {
        var d = new Date(time)
        return (("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear());
    }

    function manageChanges(update) {
        let value; 

        if(update.change === undefined) value = update.value;
        else {
            const mask = 1 << update.change;
            value = items[update.item].value ^= mask;
        }
        setItems(items.map((item) => {
            if(item.id == update.item) item.value = value
            return item;
        }))
    }

    return (
        <Box sx={{ display: 'grid', mx:5, width: '50%', mx: renderMargin, my: renderMargin}}>
            <Button variant="contained" disabled = {!loaded} onClick={performVote}>Vote</Button>
            <h1 className="title">Please vote! </h1>
            <Divider />
            {header.title === undefined ? <p></p> : <h2>{header.title}</h2>}
            {header.comment === undefined ? <p></p> : <p className="comment">{header.comment}</p>}
            {((header.start === undefined) || (header.end === undefined)) ? <p></p> : <p>This vote starts on: {formatTime(header.start)} and will terminate on: {formatTime(header.end)}</p>}
            {items.map((item, id) => (RenderVote(item, id, manageChanges)))}
        </Box>
    );
}