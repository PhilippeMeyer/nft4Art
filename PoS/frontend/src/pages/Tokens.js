import * as React from "react";
import {useState, useEffect} from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux'
import PropTypes from 'prop-types';

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';

import { useSnackbar } from 'notistack';

import NavbarManager from "./NavbarManager";
import { loadTokens, updatePrice } from '../store/tokenSlice'


const httpServer = process.env.REACT_APP_SERVER;


function TablePaginationActions(props) {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5}}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};


function Tokens() {

  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const jwt = useSelector((state) => state.token.jwt);
  const tokens = useSelector((state) => state.token.data);

  const [priceUpdate, setPriceUpdate] = useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - tokens.length) : 0;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => { 
    loadData(); }, [location]);

  
  const loadData = () => {
    if (jwt !== undefined)
      fetchData(jwt) 
      .then((tokens) => { dispatch(loadTokens(tokens)); })
      .catch((error) => { enqueueSnackbar('Error loading the tokens'); console.error(error); });
  };
  
  const updatePriceField = (e) => {
    if (e.target === undefined) return;

    console.log('target: ', e.target.id, e.target.value);
    let i = parseInt(e.target.id);
    let value = Number(e.target.value);

    if (priceUpdate.indexOf(i) == -1) setPriceUpdate([...priceUpdate, i]);
    dispatch(updatePrice({index: i, price: value }));
  };

  const save = async () => {
    let tokensUpdate = [];
    console.log(priceUpdate);
    priceUpdate.map((index) => {
        let tk = tokens.find((elt) => elt.tokenIdStr == index)
        console.log(tk);
        if (tk != null)  {
          let t = { id: tk.id, price: tk.price };
          tokensUpdate.push(t); 
        }
    });
    console.log(tokensUpdate);
    const cancel = () => { loadData(); };
    
    const response = await fetch(httpServer + 'apiV1/price/updates', { method: 'PUT', body: JSON.stringify(tokensUpdate), 
                                 headers: {"Content-type": "application/json;charset=UTF-8", "authorization": 'Bearer ' + jwt }});
    if (!response.ok)  {
      const responseJson = await response.json();
      enqueueSnackbar("Error connecting to server - " + responseJson.error.message);
    }
  };

  const cancel = () => {};

  if (tokens.length == 0 || tokens.length === undefined) return (<><main><NavbarManager /></main></>);

  return (
      <Box sx={{width: 4/5, m:5, p:5}}>
        <h1 className="title">Tokens available for sale</h1><br></br>
        <Table aria-label="tokens table">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Id</TableCell>
              <TableCell>Collection</TableCell>
              <TableCell>Qty</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
            ? tokens.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            : tokens).map((token, index) => 
              <TableRow style={{fontSize: '4rem'}} key={token.id}>
                <TableCell align="left" component="th" scope="row">
                  <Avatar src={token.iconUrl} sx={{ width: 70, height: 70 }}/>
                </TableCell>
                <TableCell align="left" component="th" scope="row">{token.tokenIdStr}</TableCell>
                <TableCell align="left" component="th" scope="row">{token.collectionId}</TableCell>
                <TableCell align="left" component="th" scope="row">{token.availableTokens}</TableCell>
                <TableCell align="left" component="th" scope="row">{token.description}</TableCell>
                <TableCell align="left" component="th" scope="row">
                  <TextField id={token.tokenIdStr} label="New Price" variant="standard" type="number" defaultValue={token.price} 
                    onChange={updatePriceField}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">Chf</InputAdornment>,
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter className="rightAligned">
            <TableRow className="rightAligned">
              <TablePagination className="rightAligned"
                rowsPerPageOptions={[5, 10, 20, { label: 'All', value: -1 }]}
                colSpan={3}
                count={tokens.length}
                rowsPerPage={rowsPerPage}
                page={page}
                SelectProps={{
                  inputProps: {
                    'aria-label': 'rows per page',
                  },
                  native: true,
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>

        </Table>
        <Box>
          <Button sx={{p:10}} onClick={cancel}>Cancel</Button>
          <Button sx={{p:10}} onClick={save}>Save</Button>
        </Box>
        <NavbarManager />
      </Box>
  );
}

function fetchData(jwt) {
  return fetch(httpServer + 'tokens', {
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


export default Tokens;