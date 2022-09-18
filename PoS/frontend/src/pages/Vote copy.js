import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';

import { useSnackbar } from 'notistack';

import { RenderVote } from './CreateVote';


const httpServer = process.env.REACT_APP_SERVER;
const urlGetVote = httpServer + 'apiV1/vote/getVote';

function DisplayVote() {

    const [items, setItems] = useState([]);
    const [header, setHeader] = useState({ title: '', start: undefined, end: undefined });
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();

    const renderMargin = 3;


    console.log('enter vote');
    useEffect( () => {
        console.log('vote');
        loadVote();
    }, []);

    const loadVote = () => {
        fetchData() 
            .then((vote) => {
                console.log('vote: ', vote); 
                setItems(vote.items);
                let key;
                let headerTemp = {};
                for(key in vote) {
                    if(key != 'items') headerTemp[key] = vote[key]
                }
                setHeader(headerTemp);
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

    function formatTime(time) {
        var d = new Date(time)
        return (("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear());
    }

    return (
        <Box sx={{ display: 'grid', mx:5, width: '50%', mx: renderMargin, my: renderMargin}}>
            <h1 className="title">Please vote! </h1>
            <Divider />
            {header.title === undefined ? <p></p> : <h2>{header.title}</h2>}
            {header.comment === undefined ? <p></p> : <p class="comment">{header.comment}</p>}
            {((header.start === undefined) || (header.end === undefined)) ? <p></p> : <p>This vote starts on: {formatTime(header.start)} and will terminate on: {formatTime(header.end)}</p>}
            {items.map((item, id) => (RenderVote(item, id)))}
        </Box>
    );
}

export default { DisplayVote };