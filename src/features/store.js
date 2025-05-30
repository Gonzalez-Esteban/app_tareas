// store.js
import { configureStore } from '@reduxjs/toolkit';
import pedidosReducer from '../features/pedidos/pedidosSlice';

const store = configureStore({
  reducer: {
    pedidos: pedidosReducer,
  },
});

export default store;
