import * as React from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Rating from '@mui/material/Rating';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Card from '@mui/material/Card';
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
import DeleteIcon from '@mui/icons-material/Delete';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';


const renderMargin = 3;
const designMargin = 3;
const txtFieldMx = 2;
const iconMargin = 2;

const rankingLbl  = 'ranking';
const dateLbl     = 'date';
const chooseLbl   = 'choose';
const optionLbl   = 'option';
const sliderLbl   = 'slider';
const checkboxLbl = 'checkbox';


    function RenderVote(item, id, callback) {

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
                    if (event.target.id.indexOf('-' + checkboxLbl) != -1) {
                        ids = event.target.id.split('-');
                        callback({item: ids[0], change: ids[1], value: event.target.checked})
                    }
                    else if (event.target.id.indexOf('-' + chooseLbl) != -1) {
                        ids = event.target.id.split('-');
                        callback({item: ids[0], value: value});
                    }
                    else if (event.target.name.indexOf('-' + rankingLbl) != -1) {
                        ids = event.target.name.split('-');
                        callback({item: ids[0], value: event.value});                }
                    }
                else {
                    if (event.target.name.indexOf('-' + optionLbl) != -1) {
                        let id = event.target.name.split('-')[0];
                        callback({item: id, value: event.target.value});
                    }
                    if (event.target.name.indexOf('-' + sliderLbl) != -1) {
                        let id = event.target.name.split('-')[0];
                        callback({item: id, value: event.target.value});
                    }
                }
            }
        }

        switch(item.type) {
            case dateLbl:
                return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <LocalizationProvider dateAdapter={AdapterDayjs}>
                                 <DatePicker
                                   id={id + '-' + dateLbl}
                                   value={new Date(item.value).getTime()}
                                   renderInput={(params) => <TextField {...params} sx={{mx: designMargin, my: designMargin}} />}
                                   onChange={(e) => internalCallback(e,id)}
                                 />
                               </LocalizationProvider>
                            </Card> );
            case rankingLbl:
                return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <Rating  sx={{mx:5, mb:3}}
                                        name={id + "-" + rankingLbl}
                                        value={item.value}
                                        id={id + '-' + rankingLbl}
                                        onChange={internalCallback}/>
                            </Card> );
            case chooseLbl:
                if (item.labels === undefined) return;
                return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <FormControl sx={{mx:5, mb:1}}>
                                   <RadioGroup
                                      id={id + '-' + chooseLbl}
                                      aria-labelledby={id + "-radio-buttons-group-label"}
                                      value={item.value}
                                      name={id + "-radio-buttons-group"}
                                      onChange={internalCallback}
                                   >
                                       {item.labels.map((label, i) => (<FormControlLabel value={i} control={<Radio id={id + '-' + i + '-' + chooseLbl}/>} label={label} />))}
                                   </RadioGroup>
                               </FormControl>
                            </Card> );
            case optionLbl:
                if (item.labels === undefined) return;
                return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                                 <FormControl sx={{mx:2, my:2, width:'90%'}}>
                                   <InputLabel id="simple-select-label">{item.label}</InputLabel>
                                   <Select
                                     labelId={id + "-" + optionLbl}
                                     name={id + "-" + optionLbl}
                                     label={item.label}
                                     onChange={internalCallback}>

                                        {item.labels.map((label, i) => (<MenuItem value={i}>{label}</MenuItem>))}
                                   </Select>
                                 </FormControl>
                            </Card> );

            case sliderLbl:
                return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                               <Box sx={{mx: 1, my: 1}}>
                                   <Box sx={{mx: 1}}><p>{item.label}</p></Box>
                                   <Slider
                                      name={id + '-' + sliderLbl}
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

            case checkboxLbl:
                if (item.labels === undefined) return;
                return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                               <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                               <FormGroup sx={{mx:5, mb:2}} id={id} onChange={internalCallback}>
                                   {item.labels.map((label, i) => (
                                      <FormControlLabel control={<Checkbox id={id + '-' + i + '-' + checkboxLbl} checked={item.value & 1<<i}/>} label={label} />)
                                    )}
                               </FormGroup>
                            </Card> );
        }
    }
