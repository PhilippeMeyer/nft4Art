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
