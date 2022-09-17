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
import DeleteIcon from '@mui/icons-material/Delete';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import MoreVertIcon from '@mui/icons-material/MoreVert';

function CreateVote() {

    const actions = [
      { icon: <CheckBoxOutlineBlankIcon onClick={() => handleClick('checkbox')}/>, name: 'Checkbox' },
      { icon: <ListIcon onClick={() => handleClick('option')}/>, name: 'Option List' },
      { icon: <RadioButtonCheckedIcon onClick={() => handleClick('choose')}/>, name: 'Choose' },
      { icon: <LinearScaleIcon onClick={() => handleClick('slider')}/>, name: 'Slider' },
      { icon: <StarHalfIcon onClick={() => handleClick('ranking')}/>, name: 'Ranking' },
      { icon: <CalendarMonthIcon onClick={() => handleClick('date')}/>, name: 'Date' },
    ];

    const [items, setItems] = useState([]);
    const [header, setHeader] = useState({ title: '', start: undefined, end: undefined });
    const [screenSize, setScreenSize] = useState({});

    const renderMargin = 3;
    const designMargin = 3;
    const txtFieldMx = 2;
    const iconMargin = 2;

    const handleClick = (item) => {
        let add = {};
        add.type = item;
        add.id = items.length;
        setItems([...items, add]);
    }

    const updateDimensions = () => {
        setScreenSize({screenWidth: window.innerWidth, screenHeight: window.innerHeight});
    }
    
    useEffect( () => {
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
  
        return () => {
          window.removeEventListener('resize', updateDimensions);
        } 
    }, []);
  

    function changedTitle(event) {
        setHeader({...header, [event.target.id] : event.target.value});
    }

    function formatTime(time) {
        var d = new Date(time)
        return (("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" + d.getFullYear());
    }

    function changedLabel(event) {
        var id = event.target.id.split('-')[0];
        setItems(items.map((it, _id) => {
            if(id == _id) it.label = event.target.value;
            return it;
        }))
    }
    function changedLabelCheck(event) {
        var ids = event.target.id.split('-');
        setItems(items.map((it, id) => {
            if(id == ids[0]) it.labels[ids[1]] = event.target.value;
            return it
        }));
    }
    function changedNumber(event) {
        var id = event.target.id.split('-')[0];
        setItems(items.map((it, _id) => {
            if(id == _id) {
                it.nb = event.target.value;
                it.labels = Array.from({length: it.nb});
            }
            return it;
        }));
    }
    function changedTicks(event) {
        var id = event.target.id.split('-')[0];
        setItems(items.map((it, _id) => {
            if(id == _id) {
                it.nb = event.target.value;
            }
            return it;
        }));
    }

    function deleteCard(_id) {
        console.log('to del:', _id);
        setItems(items.filter((it) => it.id != _id));
    }

    const handleDrag = (event) => {
        console.log(event.currentTarget);
        console.log("dragged", event);
    };

    const cardAction = (id) => (<Box><IconButton onClick={(e) => deleteCard(id)} aria-label="delete"><DeleteIcon/></IconButton><IconButton href={'/' + id} onDrag={(e) => handleDrag(id)} aria-label="delete"><MoreVertIcon/></IconButton></Box>);
      

    function generateLabels(item) {
        if ((item.nb == 0) || (item.nb === undefined) || (item.labels === undefined)) return;
        var ret = item.labels.map((u, i) => (<TextField sx={{ my: 1, mx: txtFieldMx}} id={item.id + "-" + i +"-txt"} value={u} label={"enter the label #" + i} variant="standard" onChange={changedLabelCheck} />))
        return ret;
    }

    function save() {
        var ret = {};
        var key;
        for (key in header) ret[key] = header[key];
        ret.items = items;
        console.log(ret);
    }

    function design(item, id) {
      switch(item.type) {
        case 'date':
          return (  <Card sx={{ mt: designMargin, ml: designMargin}}>
                        <CardHeader avatar={<CalendarMonthIcon sx={{ color: 'action.active'}} />} action={cardAction(id)} />
                        <Box sx={{ display: 'grid', width: '100%'}}>
                            <TextField id={id + "-txt"} sx={{ mx: txtFieldMx, my: 1}} label="enter the label for the date" variant="standard" onChange={changedLabel} />
                        </Box>
                    </Card> );

        case 'ranking':
          return (  <Card sx={{ mt: designMargin, ml: designMargin}}>
                        <CardHeader avatar={<StarHalfIcon sx={{ color: 'action.active'}} />} action={cardAction(id)} />
                        <Box sx={{ display: 'grid', width: '100%'}}>
                            <TextField id={id + "-txt"} sx={{ mx: txtFieldMx, my: 1}} label="enter the label for the rating" variant="standard" onChange={changedLabel} />
                        </Box>
                    </Card> );

        case 'choose':
          return (  <Card sx={{ mt: designMargin, ml: designMargin}}>
                        <CardHeader avatar={<RadioButtonCheckedIcon sx={{ color: 'action.active'}} />} action={cardAction(id)} />
                        <Box sx={{ display: 'grid', width: '100%'}}>
                            <TextField id={id + "-masterTxt"} sx={{ mx: txtFieldMx, my: 1}} label="Label for this block" variant="standard" onChange={changedLabel} />
                            <TextField id={id + "-nb"} sx={{ mx: txtFieldMx, my: 1}} label="enter the number of radio buttons" variant="standard" onChange={changedNumber} />
                            {generateLabels(item)}
                        </Box>
                    </Card>);

        case 'option':
          return (  <Card sx={{ mt: designMargin, ml: designMargin}}>
                        <CardHeader avatar={<ListIcon sx={{ color: 'action.active'}} />} action={cardAction(id)} />
                        <Box sx={{ display: 'grid', width: '100%'}}>
                            <TextField id={id + "-masterTxt"} sx={{ mx: txtFieldMx, my: 1}} label="Label for this block" variant="standard" onChange={changedLabel} />
                            <TextField id={id + "-nb"} sx={{ mx: txtFieldMx, my: 1}} label="enter the number of options" variant="standard" onChange={changedNumber} />
                            {generateLabels(item)}
                        </Box>
                    </Card>);

        case 'slider':
          return (  <Card sx={{ mt: designMargin, ml: designMargin}}>
                        <CardHeader avatar={<LinearScaleIcon sx={{ color: 'action.active'}} />} action={cardAction(id)} />
                        <Box sx={{ display: 'grid', width: '100%'}}>
                                <TextField id={id + "-masterTxt"} sx={{ mx: txtFieldMx, my: 1}} label="Label for this block" variant="standard" onChange={changedLabel} />
                                <TextField id={id + "-nb"} sx={{ mx: txtFieldMx, my: 1}} label="enter the number of ticks" variant="standard" onChange={changedTicks} />
                        </Box>
                    </Card>);

        case 'checkbox':
          return (  <Card sx={{ mt: designMargin, ml: designMargin}}>
                        <CardHeader avatar={<CheckBoxOutlineBlankIcon sx={{ color: 'action.active'}} />} action={cardAction(id)} />
                        <Box sx={{ display: 'grid', width: '100%'}}>
                                <TextField id={id + "-masterTxt"} sx={{ mx: txtFieldMx, my: 1}} label="Label for this block" variant="standard" onChange={changedLabel} />
                                <TextField id={id + "-nb"} sx={{ mx: txtFieldMx, my: 1}} label="enter the number of boxes" variant="standard" onChange={changedNumber} />
                                {generateLabels(item)}
                        </Box>
                    </Card>);
      }
    }

    function render(item, id) {
     switch(item.type) {
        case 'date':
          return (      <Card sx={{ mx: renderMargin, my: renderMargin}}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <DatePicker
                                label={item.label}
                                value={header.start}
                                onChange={(newValue) => { setHeader({...header, start : new Date(newValue.$y, newValue.$M, newValue.$D).getTime() });}}
                                renderInput={(params) => <TextField {...params}
                                sx={{mx: designMargin, my: designMargin}} />}
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

    return (
            <Box sx={{ height: screenSize.screenHeight, transform: 'translateZ(0px)', flexGrow: 1 }}>
                <SpeedDial
                    ariaLabel="SpeedDial"
                    sx={{ position: 'absolute', top: (screenSize.screenHeight - 500), right: 30 }}
                    icon={<SpeedDialIcon />}
                >
                    {actions.map((action) => (
                      <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                      />
                    ))}
                </SpeedDial>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', mx: designMargin, my: designMargin}}>
                    <Box sx={{ display: 'grid', width: '50%'}}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start'}}>
                            <h1 class="title">Vote Design Tool</h1>
                            <Button variant="contained" size="medium" sx={{width: '20%', mx:5, my: 3}}onClick={save}>Save</Button>
                        </Box>
                        <Divider />

                        <TextField id='title' sx={{mx: designMargin, mb: designMargin}} label="Enter the title for this vote" variant="standard" onChange={changedTitle} />
                        <TextField id='comment' multiline sx={{mx: designMargin, mb: designMargin}} label="Enter the goal of this vote" variant="standard" onChange={changedTitle} />
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="Start Date"
                            value={header.start}
                           onChange={(newValue) => { setHeader({...header, start : new Date(newValue.$y, newValue.$M, newValue.$D).getTime() });}}
                            renderInput={(params) => <TextField {...params}
                            sx={{mx: designMargin, mb: designMargin}} />}
                          />
                        </LocalizationProvider>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            label="End Date"
                            value={header.end}
                            onChange={(newValue) => { setHeader({...header, end : new Date(newValue.$y, newValue.$M, newValue.$D).getTime() });}}
                            renderInput={(params) => <TextField {...params}
                            sx={{mx: designMargin, mb: designMargin}} />}
                          />
                        </LocalizationProvider>

                        {items.map((item, id) => (design(item, id)))}
                    </Box>
                    <Box sx={{ display: 'grid', mx:5, width: '50%', mx: designMargin, my: designMargin}}>
                        <h1 class="title">How your vote will be rendered</h1>
                        <Divider />
                        {header.title === undefined ? <p></p> : <h2>{header.title}</h2>}
                        {header.comment === undefined ? <p></p> : <p class="comment">{header.comment}</p>}
                        {((header.start === undefined) || (header.end === undefined)) ? <p></p> : <p>The vote will start on: {formatTime(header.start)} and will terminate on: {formatTime(header.end)}</p>}
                        {items.map((item, id) => (render(item, id)))}
                    </Box>
                </Box>
            </Box>
    );
}

export default CreateVote;