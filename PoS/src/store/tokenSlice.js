import { createSlice } from '@reduxjs/toolkit';
import { act } from 'react-dom/test-utils';


export const tokenSlice = createSlice({
  name: 'token',

  initialState: {
    jwt: "",
    data: [],
    isEstablishingConnection: false,
    isConnected: false
  },

  reducers: {
    storeJwt: (state, action) => {
        state.jwt = action.payload;
    },

    loadTokens: (state, action) => {
        state.data = action.payload;
    },

    startConnecting: (state) => {
        state.isEstablishingConnection = true;
    },

    connectionEstalished: (state)  => {
        state.isEstablishingConnection = true;
        state.isConnected = true;
    },

    updatePrice: (state, action) => {
        let index;
        if (action.payload.index !== undefined) index = action.payload.index;                       // This is a user change 
        else if (action.payload.id !== undefined) index = parseInt(action.payload.id.slice(42));    // This is a server update
        else return;

        const newTokens = [...state.data];
        newTokens[index].price = action.payload.price;
        state.data = newTokens;
    },

    updateLock: (state, action) => {
      
      let index;
      if (action.payload.id !== undefined) index = parseInt(action.payload.id.slice(42));    // This is a server update
      else return;

      const newTokens = [...state.data];
      newTokens[index].isLocked = action.payload.isLocked;
      state.data = newTokens;
    },
  },
})

// Action creators are generated for each case reducer function
export const { storeJwt, loadTokens, startConnecting, connectionEstalished, updatePrice, updateLock } = tokenSlice.actions;

export default tokenSlice.reducer;