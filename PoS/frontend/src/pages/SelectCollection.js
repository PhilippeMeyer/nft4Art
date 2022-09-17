import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import { useSnackbar } from 'notistack';
import { useSelector, useDispatch } from 'react-redux'

import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActionArea from '@mui/material/CardActionArea';
import { useTheme } from '@mui/material/styles';

import AppBar from '@mui/material/AppBar';
import TokenMap from './TokensMap';
import TokenGrid from './TokensGrid';

import { loadCollections } from '../store/tokenSlice'

import './Map.css';

const httpServer = process.env.REACT_APP_SERVER;
const colUrl = httpServer + 'apiV1/token/collections';
const mapUrlMap = httpServer + 'apiV1/token/collectionMap?collectionId=01';

const lockUrl = httpServer + 'lockUnlock?';


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function SelectCollection() {
  const theme = useTheme();
 
  const [value, setValue] = React.useState(0);
  const [tabs, setTabs] = React.useState([]);

  const dispatch = useDispatch();

  // Redux state for the jwt and the tokens
  const jwt = useSelector((state) => state.token.jwt);
  const collections = useSelector((state) => state.token.collections);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const loadData = () => {
    if (jwt !== undefined)
      fetchData(jwt) 
      .then((collections) => { dispatch(loadCollections(collections)); })
      .catch((error) => { enqueueSnackbar('Error loading the collections'); console.error(error); });
  };

  const onclick = (event) => {
  };

  const cardClick = (event) => {
    const allreadyExist = tabs.findIndex((elt) => elt.id == event.target.id);
    if(allreadyExist != -1) setValue(allreadyExist);
    else {
      var tab = {};
      tab.id = event.target.id;
      tab.grid = (collections[event.target.id].imageUrl === undefined);
      const index = tabs.length;
      setTabs([...tabs, tab]);
      setValue(index);
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  const handleChangeIndex = (index) => {
    setValue(index);
  };


  useEffect( () => {
      loadData();
  }, []);
  
  if (collections === undefined) {
    return(<></>)
  }


  return (
    <Box sx={{ width: '100%', height: '100%'}}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider'}}>
        <Tabs value={value} onChange={handleChange} aria-label="collections tabs">
          {tabs.map((tab, index) => (
              <Tab label={tab.id} {...a11yProps(index)} /> ))}

          <Tab label="+" {...a11yProps(tabs.length)} />
        </Tabs>
      </Box>


      {tabs.map((tab, index) => (
        <TabPanel value={value} index={index}>
          {tab.grid ? <TokenGrid collectionId={tab.id}></TokenGrid> : <TokenMap collectionId={tab.id}></TokenMap>}
        </TabPanel> ))}

        <TabPanel value={value} index={tabs.length}>
          <Grid container spacing={5}>
              {Object.keys(collections).map((col, index) => (
                <Grid item key={index}>
                  <Card id={col}>
                    <CardActionArea onClick={cardClick}>
                      <CardMedia
                        component="img"
                        height="140"
                        image={collections[col].imageUrl}
                        id={col}
                        alt={col}
                      />
                      <CardContent>
                        <React.Fragment>
                          <Typography variant="h5" component="div">
                            Collection : {col}
                          </Typography>
                          <Typography component='span' variant='body'>
                            #items:  {collections[col].tokenIds.length}
                          </Typography>
                        </React.Fragment>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
          </Grid>        
        </TabPanel>
    </Box>
  );
}

function fetchData(jwt) {
  return fetch(colUrl, {
      method: 'get',
      headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'authorization': 'Bearer ' + jwt
      }})
    .then((response) =>  response.json())
    .then((responseJson) => {
      return (responseJson);
  });
}

