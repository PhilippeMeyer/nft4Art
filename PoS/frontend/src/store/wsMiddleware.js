import { StateManagerFactory } from 'html5-qrcode/esm/state-manager';
import { startConnecting, connectionEstalished, updatePrice, updateLock } from './tokenSlice'

const wsServer = process.env.REACT_APP_WS_SERVER || "wss://" + window.location.host;

const wsMiddleware = jwt => store => next => action => {
    let ws;


    if(startConnecting.match(action)) {
        if (store.getState().token.isEstablishingConnection) return next(action);
        console.log('jwt:', jwt, 'server:', wsServer);
        ws  = new WebSocket(wsServer + 'ws?token=' + jwt);

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