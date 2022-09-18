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


export default function RenderVote(item, id) {
    switch(item.type) {
       case 'date':
         return (      <Card sx={{ mx: renderMargin, my: renderMargin}}>
                           <LocalizationProvider dateAdapter={AdapterDayjs}>
                             <DatePicker
                               label={item.label}
                               value={new Date().getTime()}
                               renderInput={(params) => <TextField {...params} sx={{mx: designMargin, my: designMargin}} />}
                             />
                           </LocalizationProvider>
                       </Card> );
       case 'ranking':
         return (      <Card sx={{ mx: renderMargin, my: renderMargin}}>
                           <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                           <Rating sx={{mx:5, mb:3}} name={id + "-rating"}/>
                       </Card> );
       case 'choose':
           if (item.labels === undefined) return;
           return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                           <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                           <FormControl sx={{mx:5, mb:1}}>
                               <RadioGroup
                                   defaultValue={item.labels[0]}
                                   aria-labelledby={id + "-radio-buttons-group-label"}
                                   name={id + "-radio-buttons-group"}
                               >
                                   {item.labels.map((label, i) => (<FormControlLabel value={label} control={<Radio />} label={label} />))}
                               </RadioGroup>
                           </FormControl>
                       </Card> );
      case 'option':
           if (item.labels === undefined) return;
           return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                             <FormControl sx={{mx:2, my:2, width:'90%'}}>
                               <InputLabel id="demo-simple-select-label">{item.label}</InputLabel>
                               <Select
                                 labelId="demo-simple-select-label"
                                 id="demo-simple-select"
                                 label={item.label}
                               >
                                 {item.labels.map((label, i) => (<MenuItem value={i}>{label}</MenuItem>))}
                               </Select>
                             </FormControl>
                       </Card> );

       case 'slider':
         return (      <Card sx={{ mx: renderMargin, my: renderMargin}}>
                           <Box sx={{mx: 1, my: 1}}>
                               <Box sx={{mx: 1}}><p>{item.label}</p></Box>
                               <Slider
                                   aria-label={item.label}
                                   defaultValue={0}
                                   valueLabelDisplay="auto"
                                   step={1}
                                   marks
                                   min={0}
                                   max={item.nb}
                                   sx={{ml:5, mr:5, width:'90%'}}
                               />
                           </Box>
                       </Card>);

       case 'checkbox':
           if (item.labels === undefined) return;
           return (    <Card sx={{ mx: renderMargin, my: renderMargin}}>
                           <Box sx={{mx: 2}}><p>{item.label}</p></Box>
                           <FormGroup sx={{mx:5, mb:2}}>
                               {item.labels.map((label, i) => (<FormControlLabel control={<Checkbox defaultChecked />} label={label} />))}
                           </FormGroup>
                       </Card> );
    }
}
