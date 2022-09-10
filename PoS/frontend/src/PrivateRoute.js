import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'

//import { useAuth } from "./auth";


function PrivateRoute({ children } ) {
    const jwt = useSelector((state) => state.token.jwt);
    
    //TODO verify the token's expiry 
    //JWT Decode
    //https://github.com/auth0/jwt-decode/tree/master/lib
    //https://stackoverflow.com/questions/38552003/how-to-decode-jwt-token-in-javascript-without-using-a-library

    return jwt !== undefined ? children : <Navigate to="/login" />;  
}

export default PrivateRoute;