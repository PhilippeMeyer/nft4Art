import React, {useEffect, useState, useRef} from "react";
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import { Box } from '@mui/system';
import InputAdornment from '@mui/material/InputAdornment';

import TextField from '@mui/material/TextField';

import Button from '@mui/material/Button';
import QRcodeScanner from '../QRcodeScanner';

const httpServer = process.env.REACT_APP_SERVER;
//const timeout = process.env.REACT_APP_SALES_TIMEOUT;
const timeout = 1000000000;

const lockUrl = httpServer + 'lockUnlock?';


function TokenSaleFiat() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const timer = useRef(null);

  const token = location.state.token;

  const onNewScanResult = (decodedText, decodedResult) => {
    clearTimeout(timer.current);

    if (decodedText.length != 42) return;
    if (!decodedText.startsWith('0x')) return;

    enqueueSnackbar('Transfer token to :' + decodedText);
    navigate('/sales/transfer/', { state: { token: token, address: decodedText  }});
  };

  const cancel = () => {
    clearTimeout(timer.current);

    const params = new URLSearchParams({id: token.id, lock: false})
    console.log('Cancel timeout tokenSaleFiat');
    fetch(lockUrl + params.toString(), {method: 'PUT'});
    navigate('/sales/selectCollection');
  };

  useEffect( () => {
    timer.current = setTimeout(cancel, timeout);

    return () => clearTimeout(timer.current);
  }, []);

  const updatePriceField = () => {}

  if (token === undefined)
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
        <Box className='saleMain' style={{backgroundImage:'url('+token.overviewUrl+')'}}>
           {/*  <Box className='boxTitle'>
              <h1 className="title">Sale of token {token.description}</h1>
              <TextField className='leftAligned' label="New Price" variant="standard" type="number" defaultValue={token.price} color='warning'
                  onChange={updatePriceField}
                  InputProps={{ startAdornment: <InputAdornment position="start">Chf</InputAdornment>, style: {fontSize: 40 } }}
                  InputLabelProps={{style: {fontSize: 35}}}
              />
            </Box>
            <Box className='qrCode'>
            <QRcodeScanner
                    fps={10}
                    qrbox={250}
                    disableFlip={false}
                    qrCodeSuccessCallback={onNewScanResult}
            />
            <Button sx={{m:5}} onClick={cancel} color='warning'>Cancel</Button>
            </Box> */}
            <Box className='boxTitle'>
              <h1 className="title">Sale of token {token.description}</h1>
              <TextField className='leftAligned' label="New Price" variant="standard" type="number" defaultValue={token.price} color='warning'
                  onChange={updatePriceField}
                  InputProps={{ startAdornment: <InputAdornment position="start">Chf</InputAdornment>, style: {fontSize: 40 } }}
                  InputLabelProps={{style: {fontSize: 35}}}
              />
            </Box>
            <Box className='qrCode'>
            <QRcodeScanner
                    fps={10}
                    qrbox={250}
                    disableFlip={false}
                    qrCodeSuccessCallback={onNewScanResult}
            />
            <Button sx={{m:{xs:0, md:2}}} onClick={cancel} color='warning'>Cancel</Button>
            </Box>
        </Box>
    );
}

export default TokenSaleFiat;