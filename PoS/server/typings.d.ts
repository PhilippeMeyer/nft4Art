import { Request } from "express";

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
export interface RequestCustom extends Request {
    deviceId?: string;
    manager?: string;
    address?: string;
    appId?: string;
}
export type BN = {
    type: string;                           //"BigNumber"
    hex: string;                            //"0x65"
}
export type tokenDescription = {
    image_front: string;                    //"ipfs://bafybeigoobpr5lwtkyq3e2zdwnvf446by6lofbdmp4ftx6mawicq7wnwhq"
    image_back: string;                     //"ipfs://bafybeidcay57rdia6doyx5xztu3vzyia2hkp6xfn3bsfjwckd5iya4lafi"
    image: string;                          //"ipfs://bafkreicpcs7hs2rzrsvx6vt3ybcuv6yo4gs2khdk5cme3xofoflklqb2ai"
    tokenId: BN;
    description: string;                    //"Shard #01"
    author:string;                          //"Thomas Julier"
    image_raw:string;                       //"image_front"
    name: string;                           //"Sphere #01 explosion simulation - shard #01"
    id: string;                             //"0x759Aa410a4385bB94c4858D9B2624B7F1AF1b6c4101"
    tokenIdStr: string;                     //"101"
    addr: string                            //"0x759Aa410a4385bB94c4858D9B2624B7F1AF1b6c4"
    isLocked: boolean;                      //false
}
export type storedToken = {
    tokenId: number;
    id: string;
    isLocked: number;
    price: number;
    jsonData: string;
    createdOn: number;
}