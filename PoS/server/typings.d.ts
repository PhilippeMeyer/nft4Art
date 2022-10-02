export type DeviceResponse = {
    password: string;
    device: DeviceFromClient;
};

export type DeviceFromClient = {
    deviceId: string;
    browser: string;
    browserVersion: string;
};

export type AppLogin = {
    signature: string;
    message: AppLoginMessage;
};
export type AppLoginMessage = {
    appId: string;
    address: string;
    nonce: number;
};
type ItemVote = {
    type: string,
    id: number,
    label: string,
    nb?: number,
    labels?: string[]
};
export type Vote = {
    header: {
        title: string,
        start: number,
        end: number,
        contract?: strng,
        id?: any,
        chainId?: number
      },

    items: ItemVote[]
};
export type SaleEventRecord = {
    typeMsg: string;
    id: string;
    isLocked: boolean;
    destinationAddr?: string;
    isStored?: boolean,
    isTransferred?: boolean;
    isFinalized?: boolean;
    txId?: string;
    error?: string;
};
export type registeredPosRecord = {
    deviceId: string;
    autorized: number; 
    namePoS: string;
    browser: string;
    browserVersion: string;
    ip: string;
}
