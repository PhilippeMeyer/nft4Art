import { configureStore } from '@reduxjs/toolkit'
import tokenReducer from './tokenSlice'
import wsMiddleware from './wsMiddleware';


export default configureStore({

  reducer: {
    token: tokenReducer
  },

  middleware: [wsMiddleware]

})
