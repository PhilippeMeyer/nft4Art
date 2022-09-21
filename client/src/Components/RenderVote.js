/* global BigInt */

import * as React from 'react';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import ListIcon from '@mui/icons-material/List';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import StarHalfIcon from '@mui/icons-material/StarHalf';
import LinearScaleIcon from '@mui/icons-material/LinearScale';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Slider from '@mui/material/Slider';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';

import { useSnackbar } from 'notistack';

import * as cst from '../utils/constants.js'
import {encodeVote, decodeVote} from '../utils/encode-decodeVote.js'
import { WalletContext } from '../WalletContext.js'
import NavbarManager from "./NavbarManager";
import '../App.css';

const urlGetVote = "";


export default function RenderVote({questionList}) {
    const { enqueueSnackbar } = useSnackbar();

    const [items, setItems] = useState([]);
    const [header, setHeader] = useState({});

    useEffect(() => {
        if(questionList === undefined) questionList = require('../utils/testQuestionnaire.json');

        setItems(questionList.items);
        setHeader(questionList.header);
    }, []);


    if (header === undefined)  return (<></>);


    const loadVote = async () => {
        try {
            let voteTemp = await fetchData();
            console.log('vote:', voteTemp);
            voteTemp.items.forEach((item) => item.value = 0)
            setHeader(voteTemp.header);
            setItems(voteTemp.items);
        } catch(error) { enqueueSnackbar('Error loading the tokens'); console.error(error); }
    };

    async function fetchData(jwt) {
        const response = await fetch(urlGetVote, { method: 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }});
        const responseJson = await response.json();
        console.log(responseJson);
        return (responseJson);
    }


    function callback(update) {
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

    function internalCallback(event, value) {
        let ids;

        // Events received from material design for the different components
        //
        //  - Checkbox
        //      The component id is received in the target.id property.
        //      The id is constructed as: #item-line#-checkbox
        //      The value is provided in the callback second parameter
        //
        //  - Radio Buttons
        //      The component id is received in the target.id property.
        //      The id is constructed as: #item-line#-checkbox
        //      The value is provided in the callback second parameter
        //
        //  - Ranking
        //      The component id is received in the target.name property and
        //      the id contains a reference to clicked star
        //      The value is provided on the event.value
        //
        //  - Option list
        //      The component id is received in the target.name property and the id property is undefined
        //      The value is received in the event.value property
        //
        //  - Slider
        //      The component id is received in the target.name property and the id property is undefined
        //      The value is received in the event.value property
        //
        //  - Calendar
        //      The event received contains the date split in components and the second parameter contains the id

        if(event.target === undefined)  {       // Calendar case
            callback({item: value, value: event})
        }
        else {
            if(event.target.id !== undefined) {
                if (event.target.id.indexOf('-' + cst.checkboxLbl) != -1) {
                    ids = event.target.id.split('-');
                    callback({item: ids[0], change: ids[1], value: event.target.checked})
                }
                else if (event.target.id.indexOf('-' + cst.chooseLbl) != -1) {
                    ids = event.target.id.split('-');
                    callback({item: ids[0], value: value});
                }
                else if (event.target.name.indexOf('-' + cst.rankingLbl) != -1) {
                    ids = event.target.name.split('-');
                    callback({item: ids[0], value: value});                }
                }
            else {
                if (event.target.name.indexOf('-' + cst.optionLbl) != -1) {
                    let id = event.target.name.split('-')[0];
                    callback({item: id, value: event.target.value});
                }
                if (event.target.name.indexOf('-' + cst.sliderLbl) != -1) {
                    let id = event.target.name.split('-')[0];
                    callback({item: id, value: event.target.value});
                }
            }
        }
    }

    function renderItem(item, id) {
        switch(item.type) {
            case cst.dateLbl:
                return (    <Card sx={{ mx: cst.renderMargin, my: cst.renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <LocalizationProvider dateAdapter={AdapterDayjs}>
                                 <DatePicker
                                   id={id + '-' + cst.dateLbl}
                                   value={new Date(item.value).getTime()}
                                   renderInput={(params) => <TextField {...params} sx={{mx: cst.designMargin, my: cst.designMargin}} />}
                                   onChange={(e) => internalCallback(e,id)}
                                 />
                               </LocalizationProvider>
                            </Card> );
            case cst.rankingLbl:
                return (    <Card sx={{ mx: cst.renderMargin, my: cst.renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <Rating  sx={{mx:5, mb:3}}
                                        name={id + "-" + cst.rankingLbl}
                                        value={item.value}
                                        id={id + '-' + cst.rankingLbl}
                                        onChange={internalCallback}/>
                            </Card> );
            case cst.chooseLbl:
                if (item.labels === undefined) return;
                return (    <Card sx={{ mx: cst.renderMargin, my: cst.renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <FormControl sx={{mx:5, mb:1}}>
                                   <RadioGroup
                                      id={id + '-' + cst.chooseLbl}
                                      aria-labelledby={id + "-radio-buttons-group-label"}
                                      value={item.value}
                                      name={id + "-radio-buttons-group"}
                                      onChange={internalCallback}
                                   >
                                       {item.labels.map((label, i) => (<FormControlLabel value={i} control={<Radio id={id + '-' + i + '-' + cst.chooseLbl}/>} label={label} />))}
                                   </RadioGroup>
                               </FormControl>
                            </Card> );
            case cst.optionLbl:
                if (item.labels === undefined) return;
                return (    <Card sx={{ mx: cst.renderMargin, my: cst.renderMargin}}>
                                 <FormControl sx={{mx:2, my:2, width:'90%'}}>
                                   <InputLabel id="simple-select-label">{item.label}</InputLabel>
                                   <Select
                                     labelId={id + "-" + cst.optionLbl}
                                     name={id + "-" + cst.optionLbl}
                                     label={item.label}
                                     onChange={internalCallback}>

                                        {item.labels.map((label, i) => (<MenuItem value={i}>{label}</MenuItem>))}
                                   </Select>
                                 </FormControl>
                            </Card> );

            case cst.sliderLbl:
                if (item.nb === undefined) return;
                return (    <Card sx={{ mx: cst.renderMargin, my: cst.renderMargin}}>
                               <Box sx={{mx: 1, my: 1}}>
                                   <Box sx={{mx: 1}}><p>{item.label}</p></Box>
                                   <Slider
                                      name={id + '-' + cst.sliderLbl}
                                      aria-label={item.label}
                                      value={item.value}
                                      valueLabelDisplay="auto"
                                      step={1}
                                      marks
                                      min={0}
                                      max={parseInt(item.nb)}
                                      sx={{ml:5, mr:5, width:'90%'}}
                                      onChange={internalCallback}
                                   />
                               </Box>
                            </Card>);

            case cst.checkboxLbl:
                if (item.labels === undefined) return;
                return (    <Card sx={{ mx: cst.renderMargin, my: cst.renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <FormGroup sx={{mx:5, mb:2}} id={id} onChange={internalCallback}>
                                   {item.labels.map((label, i) => (
                                      <FormControlLabel control={<Checkbox id={id + '-' + i + '-' + cst.checkboxLbl} checked={item.value & 1<<i}/>} label={label} />)
                                    )}
                               </FormGroup>
                            </Card> );
        }
    }

    function formatTime(time) {
        var d = new Date(time)
        return (("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear());
    }


    function save() {
        var ret = {};
        var key;
        //for (key in header) ret[key] = header[key];
        ret.items = items;
        ret.header = header;
        console.log(ret);
        let test = encodeVote(items);
        console.log(test);
        decodeVote(test, items);
    }

    return (
            <>
                <Box><h1 className="title">Please Vote Now!</h1> <Button variant="contained" size="medium" sx={{width: '20%', mx:5, my: 3}}onClick={save}>Save your vote</Button> </Box>
                <Divider />
                {header.title === undefined ? <p></p> : <h2>{header.title}</h2>}
                {header.comment === undefined ? <p></p> : <p className="comment">{header.comment}</p>}
                {((header.start === undefined) || (header.end === undefined)) ? <p></p> : <p>The vote will start on: {formatTime(header.start)} and will terminate on: {formatTime(header.end)}</p>}
                {items.map((item, id) => (renderItem(item, id)))}
            </>
    )
}