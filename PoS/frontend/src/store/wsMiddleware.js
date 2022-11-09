import { StateManagerFactory } from 'html5-qrcode/esm/state-manager';
import { startConnecting, connectionEstalished, updatePrice, updateLock, updateQty, updateError } from './tokenSlice'

const wsServer = process.env.REACT_APP_WS_SERVER || "wss://" + window.location.host;

const wsMiddleware = store => next => action => {
    let ws, jwt;


    if(startConnecting.match(action)) {
        if (store.getState().token.isEstablishingConnection) return next(action);

        ws  = new WebSocket(wsServer + 'ws?token=' + store.getState().token.jwt + '&deviceId=' + store.getState().token.device.device.deviceId);

        ws.onopen = () => {
            console.log('ws open');
            store.dispatch(connectionEstalished());
        };
        ws.onmessage = (e) => {
            console.log('received message: ', e);
            let msg = JSON.parse(e.data);

            if (msg.typeMsg === undefined) return

            switch(msg.typeMsg) {
                case 'price':
                    store.dispatch(updatePrice(msg));
                    break;
                case 'lock':
                    store.dispatch(updateLock(msg));
                    break;
                case 'qty':
                    store.dispatch(updateQty(msg));
                    break;
                case 'error':
                    store.dispatch(updateError(msg));
                    break;
                }
        };
        ws.onclose = (e) => {
            console.log('ws close: ', e);

            store.isEstablishingConnection = false;
            store.isConnected = false;
        };
    }
    
    return next(action);
    
}

export default wsMiddleware;