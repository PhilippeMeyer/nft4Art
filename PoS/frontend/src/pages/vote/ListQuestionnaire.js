import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ethers } from 'ethers';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';

import { useSnackbar } from 'notistack';

import NavbarManager from "../NavbarManager";
import '../../App.css';

const env = process.env.REACT_APP_ENV;
const httpServer = process.env.REACT_APP_SERVER;
const urlListQuestionnaire = httpServer + "apiV1/vote/listQuestionnaire";


export default function ListQuestionnaire() {
    const { enqueueSnackbar } = useSnackbar();

    const [questionnaires, setQuestionnaires] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {

        loadQuestionnaires();

    }, []);


    const loadQuestionnaires = async () => {
        try {
            let list = await fetchData();
            console.log('questionnaires:', list);
            list.forEach((elt) => {
                const data = JSON.parse(elt.jsonData);
                elt.header = data.header;
                elt.items = data.items;
                elt.header.idStr = ethers.BigNumber.from(elt.header.id).toString();

            });
            setQuestionnaires(list);
            console.log(list);
        } catch(error) { enqueueSnackbar('Error loading the tokens'); console.error(error); }
    };

    async function fetchData(jwt) {
        const response = await fetch(urlListQuestionnaire, { method: 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }});
        const responseJson = await response.json();
        console.log(responseJson);
        return (responseJson);
    }


    function formatTime(time) {
        var d = new Date(time)
        return (("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear());
    }

    function clickRow(event, item) { 
        console.log('event:', event, 'value:', item);
        const today = new Date();
        navigate('/manager/DisplayVote', {state: {vote: item}})
    }
    return (
    <>
        <main>
            <h1 className="title">Questionnaires list</h1>
            <Table aria-label="Questionnaires List">
                <TableHead>
                    <TableRow>
                        <TableCell>voteId</TableCell>
                        <TableCell>Title</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>End</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {questionnaires.map((elt, index) => 
                        <TableRow style={{fontSize: '4rem'}} key={elt.header.idStr} id={elt.header.idStr} onClick={(evt) => clickRow(evt, elt)}>
                            <TableCell align="left" component="th" scope="row">{elt.header.idStr}</TableCell>
                            <TableCell align="left" component="th" scope="row">{elt.header.title}</TableCell>
                            <TableCell align="left" component="th" scope="row">{elt.header.comment}</TableCell>
                            <TableCell align="left" component="th" scope="row">{formatTime(elt.header.start)}</TableCell>
                            <TableCell align="left" component="th" scope="row">{formatTime(elt.header.end)}</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </main>
    </>
    );
}
