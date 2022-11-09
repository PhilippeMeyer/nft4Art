import { createSlice } from '@reduxjs/toolkit';
import { act } from 'react-dom/test-utils';


export const tokenSlice = createSlice({
  name: 'token',

  initialState: {
    jwt: "",
    data: [],
    collections: {},
    currentToken: {},
    device: {},
    isEstablishingConnection: false,
    isConnected: false,
    error: {}
  },

  reducers: {
    storeJwt: (state, action) => {
        state.jwt = action.payload;
    },

    loadTokens: (state, action) => {
      state.data = action.payload;
    },

    loadCollections: (state, action) => {
      state.collections = action.payload;
    },

    setCurrentToken: (state, action) => {
      state.currentToken = action.payload;
    },

    storeDevice: (state, action) => {
        state.device = action.payload;
    },

    startConnecting: (state) => {
        state.isEstablishingConnection = true;
    },

    connectionEstalished: (state)  => {
        state.isEstablishingConnection = true;
        state.isConnected = true;
    },

    updateQty: (state, action) => {
      let index;
      if (action.payload.id === undefined) return;

      const ind = state.data.findIndex((elt) => elt.id === action.payload.id )
      if (ind == -1) {
        console.error('No such token %s', action.payload.id)
        return;
      }

      const newTokens = [...state.data];

      newTokens[ind].availableTokens = action.payload.qty;
      state.data = newTokens;

      return state
    },

    updatePrice: (state, action) => {
        let index;
        if (action.payload.index !== undefined) index = action.payload.index;                       // This is a user change 
        else if (action.payload.id !== undefined) index = parseInt(action.payload.id);              // This is a server update
        else return;

        const newTokens = [...state.data];
        let realIndex = newTokens.findIndex((elt) => elt.tokenIdStr == index);
        if (realIndex == -1) {
          console.error('No such token %s', action.payload.id)
          return;
        }
  
        newTokens[realIndex].price = action.payload.price;
        state.data = newTokens;
        
        return state;
    },

    updateLock: (state, action) => {
      
      let index;
      if (action.payload.id === undefined) return;

      //index = parseInt(action.payload.id.slice(42));    // This is a server update
      const ind = state.data.findIndex((elt) => elt.id === action.payload.id )
      if (ind == -1) {
        console.error('No such token %s', action.payload.id)
        return;
      }

      const newTokens = [...state.data];

      newTokens[ind].isLocked = action.payload.isLocked;
      state.data = newTokens;

      return state
    },

    updateError: (state, action) => {
      state.error = action.payload;
    },

  },
})

// Action creators are generated for each case reducer function
export const { storeJwt, loadTokens, loadCollections, setCurrentToken, storeDevice, startConnecting, connectionEstalished, updatePrice, updateQty, updateLock, updateError } = tokenSlice.actions;

export default tokenSlice.reducer;