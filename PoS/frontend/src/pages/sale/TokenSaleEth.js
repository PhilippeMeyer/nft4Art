import React, {useEffect, useState, useRef} from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Box } from '@mui/system';
import InputAdornment from '@mui/material/InputAdornment';

import QRcodeScanner from '../../QRcodeScanner';

const timeout = process.env.REACT_APP_SALES_TIMEOUT *1000;

const httpServer = process.env.REACT_APP_SERVER;
const lockUrl = httpServer + 'lockUnlock?';
const priceUrl = httpServer + 'apiV1/price/priceInCrypto?';
const QRcode = httpServer + 'QRcode';


function TokenSaleEth() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const [constructorHasRun, setConstructorHasRun] = useState(false);
  const [price, setPrice] = useState(undefined);
  const [finalPrice, setFinalPrice] = useState();
  const timer = useRef(null);

  const token = location.state.token;
  console.log(token);

  const constructor = () => {
    if (constructorHasRun) return;
    setConstructorHasRun(true);

    const params = new URLSearchParams({tokenId: token.id, crypto: 'eth'})
    let res = fetch(priceUrl + params.toString()).then((response) => {
      response.json().then((data) => {
        console.log(data);
        setPrice(data);
      });
    });
  };

  useEffect( () => {
    timer.current = setTimeout(cancel, timeout);

    return () => clearTimeout(timer.current);
  }, []);


  const onNewScanResult = (decodedText, decodedResult) => {
    clearTimeout(timer.current);
    
    if (decodedText.length != 42) return;
    if (!decodedText.startsWith('0x')) return;

    enqueueSnackbar('Transfer token to :' + decodedText);
    navigate('/sales/transferEth/', { state: { token: token, address: decodedText, finalPrice: finalPrice, price: price  }});
  };

  const cancel = () => {
    clearTimeout(timer.current);

    const params = new URLSearchParams({id: token.id, lock: false})
    console.log('Cancel tokenSaleEth', token);
    fetch(lockUrl + params.toString(), {method: 'PUT'});
    navigate('/sales/selectCollection');
  };

  const setNogociatedPrice = (value)  => {
    setFinalPrice(value);
  };

  
  constructor();
  
  if ((token === undefined) || (price === undefined))
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
        <Box className='saleMain' style={{backgroundImage:'url('+token.overviewUrl+')'}}>
          <Box className='boxTitle'>
            <h1 className="title">Sale of token {token.description} in Ether</h1>
            <h1 className="title">Token price: {price.priceFiat} CHF / {price.price.toFixed(5)} Ethers (Ether price: {price.rate.toFixed(2)} CHF)</h1>
            <TextField sx={{mb:2}} className='leftAligned' autoFocus id="amount" label="Negociated price" type="number" variant="standard" color="warning"
                  onChange={(e) => setNogociatedPrice(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">ETH</InputAdornment>, style: {fontSize: 40 } }}
                  InputLabelProps={{style: {fontSize: 35}}}
            />
            <h2 className="subTitle">The ethers should be sent to the address: {token.addr} represented by the QR code below</h2>
            <img src={QRcode}/>
            <h2 className="subTitle">Please scan below the customer's personnal address</h2>
          </Box>
          <Box className='qrCode'>
            <QRcodeScanner
                  fps={10}
                  qrbox={250}
                  disableFlip={false}
                  qrCodeSuccessCallback={onNewScanResult}
            />
            <Button sx={{m:{xs:0, md:2}}} onClick={cancel} color='primary' variant="info">primary</Button>
          </Box>
        </Box>
    );
}

export default TokenSaleEth;