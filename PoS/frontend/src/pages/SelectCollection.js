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
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';

import { useTheme } from '@mui/material/styles';

import AppBar from '@mui/material/AppBar';
import TokenMap from './TokensMap';
import TokenGrid from './TokensGrid';
import ReactAnimateImages from '../services/ReactAnimateImages';

import { loadCollections, loadTokens } from '../store/tokenSlice'

import './Map.css';

const httpServer = process.env.REACT_APP_SERVER;
const collectionUrl = httpServer + 'apiV1/token/collections';
const tokenUrl = httpServer + 'apiV1/token/listAllToken';
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
          <Typography component={'div'}>{children} </Typography>
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
  const tokens = useSelector((state) => state.token.data);

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const loadData = () => {
    if (jwt === undefined) return;

    fetchData(tokenUrl, jwt) 
    .then((tokensData) => {
      tokensData.forEach((tk, index) => tk.index = index);
      dispatch(loadTokens(tokensData));

      fetchData(collectionUrl, jwt) 
      .then((collectionsData) => { 
        dispatch(loadCollections(collectionsData)); 
        collectionsData = loadImagesInCollections(collectionsData, tokensData);

        dispatch(loadCollections(collectionsData));
      })
      .catch((error) => { enqueueSnackbar('Error loading the collections'); console.error(error); }); 
    })
    .catch((error) => { enqueueSnackbar('Error loading the tokens'); console.error(error); });
};

  const loadImagesInCollections = (collectionsData, tokensData) => {
    let retValue = Object.assign({}, collectionsData);
    for (var key in collectionsData) {
      retValue[key] = collectionsData[key];

      if(collectionsData[key].map === undefined) {
        let tempvalue = {...collectionsData[key]};
        tempvalue.images = tokensData.map((token) => {if (token.collectionId == key) return token.iconUrl; }).filter((val) => val !== undefined);
        retValue[key] = tempvalue;
      }
    }
    return retValue;
  }

  const cardClick = (event) => {
    const allreadyExist = tabs.findIndex((elt) => elt.id == event.target.id);
    if(allreadyExist != -1) setValue(allreadyExist);
    else {
      var tab = {};
      tab.id = event.target.id;
      tab.grid = (collections[event.target.id].mapUrl === undefined);
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

  const handleCloseTab = (event, tab) => {
    setTabs(tabs.filter((t) => t !== tab ));
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
              <Tab label={<span>{tab.id}<IconButton component="div" onClick={event => handleCloseTab(event, tab)}><CloseIcon fontSize="small"/></IconButton></span>} {...a11yProps(index)} /> ))}

          <Tab icon={<AddIcon />} {...a11yProps(tabs.length)} />
        </Tabs>
      </Box>


      {tabs.map((tab, index) => (
        <TabPanel value={value} index={index} key={index}>
          {tab.grid ? <TokenGrid collectionId={tab.id}></TokenGrid> : <TokenMap collectionId={tab.id}></TokenMap>}
        </TabPanel> ))}

        <TabPanel value={value} index={tabs.length}>
          <Grid container spacing={5}>
              {Object.keys(collections).map((col, index) => (
                <Grid item key={index}>
                  <Card id={col}>
                    <CardActionArea id={col} onClick={cardClick}>
                      {collections[col].map !== undefined ?                       
                      <CardMedia
                        component="img"
                        height="150px"
                        width="150px"
                        image={collections[col].imageUrl}
                        id={col}
                        alt={col}
                        /> :
                      <ReactAnimateImages
                        style={{ height: "150px", width: "150px"}}
                        images={collections[col].images} 
                        framInterval={2000} 
                        id={col}
                      /> }                     
                        
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

function fetchData(url, jwt) {
  return fetch(url, { method: 'GET',  headers: { Accept: 'application/json', 'Content-Type': 'application/json',  authorization: 'Bearer ' + jwt  }})
    .then((response) =>  response.json())
    .then((responseJson) => {
      return (responseJson);
  });
}

