import React, {useEffect, useState, useRef} from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import QRcodeScanner from '../QRcodeScanner';
import TextField from '@mui/material/TextField';

const timeout = process.env.REACT_APP_SALES_TIMEOUT *1000;

const httpServer = process.env.REACT_APP_SERVER;
const lockUrl = httpServer + 'lockUnlock?';
const priceUrl = httpServer + 'apiV1/priceInCrypto?';
const QRcode = httpServer + 'QRcode';


function TokenSaleEth() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const [constructorHasRun, setConstructorHasRun] = useState(false);
  const [price, setPrice] = useState({});
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
  
  if (token === undefined)
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
      <>
        <main>
          <h1 className="title">Sale of token #{token.id} in Ether</h1>
          <h2>Token price: {token.price} CHF</h2>
          <h2>Token price: {price.priceFiat} Ethers based on Ether price at {price.rate}</h2>
          <TextField  autoFocus margin="dense" id="amount" label="Negociated price" type="number" variant="standard"
                  onChange={(e) => setNogociatedPrice(e.target.value)}
          />
          <br></br>
          <h2>The ethers should be sent to the address: {token.addr} represented by the QR code below</h2>
          <img src={QRcode} />
          <br></br>
          <p>When the cash transaction is completed, please scan the customer's personnal address</p>
          <QRcodeScanner
                  fps={10}
                  qrbox={250}
                  disableFlip={false}
                  qrCodeSuccessCallback={onNewScanResult}
          />
          <Button onClick={cancel}>Cancel</Button>
        </main>
      </>
    );
}

export default TokenSaleEth;