import React, {useEffect, useState, useRef} from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import { Box } from '@mui/system';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';


import Button from '@mui/material/Button';

const httpServer = process.env.REACT_APP_SERVER;
const saleTokenInvoice = httpServer + 'apiV1/sale/saleInvoice';

//const timeout = process.env.REACT_APP_SALES_TIMEOUT;
const timeout = 1000000000;

const lockUrl = httpServer + 'lockUnlock?';


function TokenSaleInvoice() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();

  const [price, setPrice] = useState(0);

  const jwt = useSelector((state) => state.token.jwt);
  const timer = useRef(null);
  
  const { handleSubmit, control, reset } = useForm({  });

  
  const token = location.state.token;
  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };

  const onSubmit= data => {
      clearTimeout(timer.current);

    data.price = price;
    data.tokenId = token.id;
    console.log('jwt ', jwtHeader);
    console.log('data ', data)
    fetch(saleTokenInvoice, {method: 'POST', body: JSON.stringify(data), headers: jwtHeader});

    enqueueSnackbar('Invoice prepared' );
    navigate('/sales/selectCollection/');
  };

  const cancel = () => {
    clearTimeout(timer.current);

    const params = new URLSearchParams({id: token.id, lock: false})
    fetch(lockUrl + params.toString(), {method: 'PUT'});
    navigate('/sales/selectCollection');
  };

  useEffect( () => {
    setPrice(token.price);
    timer.current = setTimeout(cancel, timeout);

    return () => clearTimeout(timer.current);
  }, []);

  const updatePriceField = (e) => { setPrice(e.target.value); }

  if (token === undefined)
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
        <Box className='saleMain' sx={{display: 'block'}} style={{backgroundImage:'url('+token.overviewUrl+')'}}>
          <Box className='boxTitleBlock'>
            <h1 className="title">Sale of token {token.description}</h1>
            <TextField className='leftAligned' label="New Price" variant="standard" type="number" defaultValue={token.price} color='warning'
                onChange={updatePriceField}
                InputProps={{ startAdornment: <InputAdornment position="start">Chf</InputAdornment>, style: {fontSize: 40 } }}
                InputLabelProps={{style: {fontSize: 35}}}
            />
          </Box>
          <Box sx={{mt:'6vh', px:"5vw"}}>
            <h1 className="title">Personal details</h1>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Grid container columnSpacing={{ xs: 1, sm: 2, md: 3 }} rowSpacing={0.7}>
                <Controller 
                  name='email'
                  control={control}
                  render={({field}) => <Grid item xs={12}>
                      <TextField
                        required
                        id="email"
                        name="email"
                        label="eMail"
                        fullWidth
                        autoComplete="eMail"
                        variant="standard"
                        onChange={(e) => { field.onChange(e?.target.value)}}
                      />
                    </Grid>}
                />
                <Controller 
                  name='firstName'
                  control={control}
                  render={({field}) => <Grid item xs={12} sm={6}>
                      <TextField
                        id="firstName"
                        name="firstName"
                        label="firstName"
                        fullWidth
                        autoComplete="given-name"
                        variant="standard"
                        onChange={(e) => { field.onChange(e?.target.value)}}
                      />
                  </Grid>}
                />
                <Controller 
                  name='lastName'
                  control={control}
                  render={({field}) => <Grid item xs={12} sm={6}>
                    <TextField
                        id="lastName"
                        name="lastName"
                        label="lastName"
                        fullWidth
                        autoComplete="family-name"
                        variant="standard"
                        onChange={(e) => { field.onChange(e?.target.value)}}
                    />
                  </Grid>}
                />
                <Controller 
                  name='address1'
                  control={control}
                  render={({field}) => <Grid item xs={12}>
                    <TextField
                        id="address1"
                        name="address1"
                        label="address1"
                        fullWidth
                        autoComplete="shipping address-line1"
                        variant="standard"
                        onChange={(e) => { field.onChange(e?.target.value)}}
                    />
                  </Grid>}
                />
                <Controller 
                  name='address2'
                  control={control}
                  render={({field}) => <Grid item xs={12}>
                    <TextField
                        id="address2"
                        name="address2"
                        label="address2"
                        fullWidth
                        autoComplete="shipping address-line2"
                        variant="standard"
                        onChange={(e) => { field.onChange(e?.target.value)}}
                    />
                  </Grid>}
                />
                <Controller 
                  name='city'
                  control={control}
                  render={({field}) => <Grid item xs={12} sm={6}>
                    <TextField
                      id="city"
                      name="city"
                      label="City"
                      fullWidth
                      autoComplete="shipping address-level2"
                      variant="standard"
                      onChange={(e) => { field.onChange(e?.target.value)}}
                    />
                  </Grid>}
                />
                <Controller 
                  name='state'
                  control={control}
                  render={({field}) => <Grid item xs={12} sm={6}>
                    <TextField
                      id="state"
                      name="state"
                      label="State/Province/Region"
                      fullWidth
                      variant="standard"
                      onChange={(e) => {field.onChange(e?.target.value)}}
                    />
                  </Grid>}
                />
                <Controller 
                  name='zip'
                  control={control}
                  render={({field}) => <Grid item xs={12} sm={6}>
                    <TextField
                      id="zip"
                      name="zip"
                      label="Zip / Postal code"
                      fullWidth
                      autoComplete="shipping postal-code"
                      variant="standard"
                      onChange={(e) => { field.onChange(e?.target.value)}}
                    />
                  </Grid>}
                />
                <Controller 
                  name='country'
                  control={control}
                  render={({field}) => <Grid item xs={12} sm={6}>
                    <TextField
                      id="country"
                      name="country"
                      label="Country"
                      fullWidth
                      autoComplete="shipping country"
                      variant="standard"
                      onChange={(e) => { field.onChange(e?.target.value)}}
                    />
                  </Grid>}
                />
              </Grid>

              <Box sx={{m:5}}>
                <Button sx={{mx:2}} type="submit" variant="contained">Submit</Button>
                <Button sx={{mx:2}} variant="contained" onClick={cancel}>Cancel</Button>
              </Box>
            </form>
          </Box>
        </Box>
      );
}

export default TokenSaleInvoice;