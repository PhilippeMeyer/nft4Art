import React, {useEffect, useState} from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useSnackbar } from 'notistack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';

import { DataGrid, GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import NavbarManager from "../NavbarManager";

const httpServer = process.env.REACT_APP_SERVER;
const posUrl = httpServer + 'apiV1/auth/registeredPoS';
const updPosUrl = httpServer + 'apiV1/auth/authorizePoS?';


function RegisteredPoS() {

    const [data, setData] = useState();
    const { enqueueSnackbar, closeSnackbar } = useSnackbar();
    const location = useLocation();
    const navigate = useNavigate();
    const jwt = useSelector((state) => state.token.jwt);
    const device = useSelector((state) => state.token.device);

    const handleToggleCompleted = (params) => {
        console.log('click', params);
        const urlParams = new URLSearchParams({PoS: params.id, authorized: !params.value})
        fetch(updPosUrl + urlParams.toString(), {method: 'PUT',  headers: {"Content-type": "application/json;charset=UTF-8", "authorization": 'Bearer ' + jwt }});
        setData(data.map((elt) => { 
            if(elt.deviceId == params.id) elt.authorized = !elt.authorized;
            return elt
        }));
    }

    const columns = [
        { field: 'deviceId', headerName: 'id', minWidth: 300, flex: 2 },
        { field: 'browser', headerName: 'Browser', minWidth: 100, flex: 1 },
        { field: 'browserVersion', headerName: 'Version', minWidth: 70, flex: 0.5 },
        { field: 'ip', headerName: 'IP address', minWidth: 150, flex: 1},
        { field: 'authorized', headerName: 'Authorized', minWidth: 100, flex: 1, 
            renderCell: (params) => {
                let disabled = (params.id == device.device.deviceId);
                return (
                <Checkbox
                    checked={params.value == 1 ? true : false}
                    disableRipple
                    disableFocusRipple
                    onClick={() => handleToggleCompleted(params)}
                    disabled={disabled}
                /> );
            }, 
        },
        { field: 'isConnected', headerName: 'Connected', minWidth: 100, flex: 1,
            renderCell: (params) => (
                <Checkbox
                    checked={params.value == 1 ? true : false}
                    disableRipple
                    disableFocusRipple
                    disabled={true}
                />
            )
        }, 
        { field: 'createdOn', headerName: 'Date', minWidth: 200, flex: 2}
    ];

    useEffect(() => { 
        loadData(); }, [location]);


    const loadData = () => {
        fetch(posUrl, { method: 'GET',  headers: {"Content-type": "application/json;charset=UTF-8", "authorization": 'Bearer ' + jwt }})
        .then(response => response.json())
        .then(data => {
            setData(data.map((row, index) => { 
                row.key=index;
                return row; 
            } )); })
        .catch((error) => enqueueSnackbar("Error receiving data - " + error));
    };


    if (data === undefined || data.length == 0) return (<></>);
  
    return (
        <Box sx={{ height: 600, width: '100%', p:3}}>
            <h1 className='title'>List of registered Point Of Sale</h1>
            <DataGrid sx={{mx:5}}
                rows={data}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5,10]}
                getRowId={(row) => row.deviceId || row.id}
            />
            <NavbarManager />
        </Box>
    );
}

export default RegisteredPoS;