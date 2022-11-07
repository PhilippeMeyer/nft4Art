import React, {useEffect, useState, useRef} from "react";
import { useForm, Controller } from "react-hook-form";
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import PropTypes from 'prop-types';

import { useSnackbar } from 'notistack';
import { useTheme } from '@mui/material/styles';
import { Box } from '@mui/system';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import PageviewOutlinedIcon from '@mui/icons-material/PageviewOutlined';
import TrendingFlatOutlinedIcon from '@mui/icons-material/TrendingFlatOutlined';
import SyncAltOutlinedIcon from '@mui/icons-material/SyncAltOutlined';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import InfoIcon from '@mui/icons-material/Info';
import Tooltip from '@mui/material/Tooltip';


import NavbarManager from "../NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
const listInvoicesUrl = httpServer + 'apiV1/sale/listInvoices';
const getInvoiceUrl = httpServer + 'apiV1/sale/getInvoice?invoice=';

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


function ListInvoices() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [dialog, setDialog] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState(false);
  const [iban, setIban] = useState();
  const [destAddr, setDestAddr] = useState();

  const jwt = useSelector((state) => state.token.jwt);
  const jwtHeader = { 'Accept': 'application/json', 'Content-Type': 'application/json', 'authorization': 'Bearer ' + jwt };


  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - invoices.length) : 0;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClose = () => {}
  const changeCurrency = () => {}
  const handleTransfer = () => {
    setDialog(false);
    setConfirmationDialog(true);
  }

  useEffect(() => { 
    loadData(jwtHeader); 
    setRowsPerPage(Math.floor((window.innerHeight - 300)/120));
  }, [location]);

  const viewInvoice = (invoice) => {
    console.log(invoice);
    fetch(getInvoiceUrl + invoice.invoiceNumber, { method: 'get', headers: jwtHeader}).then((res) => res.blob()).then((pdfBlob) => {
      const objectURL = URL.createObjectURL(pdfBlob);
      window.open(objectURL, '_blank');
    });

  }

  const loadData = (jwt) => {
    if (jwt !== undefined)
      fetchData(jwt) 
      .then((invoices) => {
        invoices.forEach((invoice) => { invoice.data = JSON.parse(invoice.jsonData )})
        setInvoices(invoices);
        console.log(invoices); 
      })
      .catch((error) => { enqueueSnackbar('Error loading the invoices'); console.error(error); });
  };
  
  const cancel = () => {
  };

  useEffect( () => {
    loadData(jwtHeader); 
    setRowsPerPage(Math.floor((window.innerHeight - 300)/120));
  }, []);

 
  if (invoices === undefined)
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
      <>
        <Box sx={{width: {sm: 4/5}, m: {sm:5}, p:{sm:5}}}>
          <h1 className="title">Invoices</h1><br></br>
          <Table aria-label="invoices table">
            <TableHead>
              <TableRow>
                <TableCell># Invoice</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }}}>TokenId</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
              ? invoices.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : invoices).map((invoice, index) => 
                <TableRow style={{fontSize: '4rem'}} key={invoice.invoiceNumber}>
                  <TableCell align="left" component="th" scope="row">{invoice.invoiceNumber}</TableCell>
                  <TableCell align="left" component="th" scope="row">{invoice.invoiceNumber}</TableCell>
                  <TableCell align="left" component="th" scope="row">{invoice.data.debtor.name}</TableCell>
                  <TableCell align="left" component="th" scope="row">{invoice.data.amount} CHF</TableCell>
                  <TableCell align="left" component="th" scope="row">
                    <IconButton onClick={() => { viewInvoice(invoice); }}><PageviewOutlinedIcon/></IconButton>
                    <IconButton onClick={() => { setDialog(true); }}><SyncAltOutlinedIcon/></IconButton>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 20, { label: 'All', value: -1 }]}
                  colSpan={5}
                  count={invoices.length}
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
          <Box sx={{mt:5}}>
            <Button sx={{p:1}} onClick={cancel}>Cancel</Button>
          </Box>
          <NavbarManager />
        </Box>

        <Dialog open={dialog} onClose={handleClose}>
          <DialogTitle>Invoice Paid - Token Transfer</DialogTitle>
          <DialogContent>
            <Box sx={{display: 'block'}}>
            <TextField sx={{mb:2, display:'block'}} className='leftAligned' autoFocus id="iban" label="Payment reference" type="text" variant="standard" color="warning"
                  onChange={(e) => setIban(e.target.value)}
            />
            <TextField sx={{mb:2, display:'block'}} className='leftAligned' autoFocus id="destAddr" label="Destination Address" type="text" variant="standard" color="warning"
                  onChange={(e) => setDestAddr(e.target.value)}
            />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleTransfer}>Transfer Token</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={confirmationDialog} onClose={handleClose}>
          <DialogTitle>Token Transfer Confirmation</DialogTitle>
          <DialogContent>
            <Box sx={{display: 'block'}}>
            <TextField sx={{mb:2, display:'block'}} className='leftAligned' autoFocus id="iban" label="Payment reference" type="text" variant="standard" color="warning"
                  onChange={(e) => setIban(e.target.value)}
            />
            <TextField sx={{mb:2, display:'block'}} className='leftAligned' autoFocus id="destAddr" label="Destination Address" type="text" variant="standard" color="warning"
                  onChange={(e) => setDestAddr(e.target.value)}
            />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleTransfer}>Transfer Token</Button>
          </DialogActions>
        </Dialog>
      </>
    );
}

function fetchData(jwt) {
  return fetch(listInvoicesUrl, { method: 'get', headers: jwt})
    .then((response) =>  response.json())
    .then((responseJson) => {
      return (responseJson);
  });
}


export default ListInvoices;