import React, {useEffect, useState} from "react";
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { useSnackbar } from 'notistack';
import QRcodeScanner from '../QRcodeScanner';



function TokenSale() {

  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const token = location.state.token;

  const onNewScanResult = (decodedText, decodedResult) => {
    if (decodedText.length != 42) return;
    if (!decodedText.startsWith('0x')) return;

    enqueueSnackbar('Transfer token to :' + decodedText);
    navigate('/sales/transfer/', { state: { token: token, address: decodedText  }});
  };

  if (token === undefined)
    return (
      <><main><h1>Error loading token</h1></main></>
    );
  else
    return (
      <>
        <main>
          <h2>Sale of token #{id} </h2>
          <h2>Token price: {token.price}<b></b></h2>
          <p>When the cash transaction is completed, please scan the customer's personnal address</p>
          <QRcodeScanner
                  fps={10}
                  qrbox={250}
                  disableFlip={false}
                  qrCodeSuccessCallback={onNewScanResult}
          />
        </main>
      </>
    );
}

export default TokenSale;