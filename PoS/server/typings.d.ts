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
