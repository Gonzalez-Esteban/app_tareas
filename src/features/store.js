import { configureStore } from '@reduxjs/toolkit';
import pedidosReducer from '../features/pedidos/pedidosSlice';
import sectoresReducer from '../features/sectores/sectoresSlice';

const store = configureStore({
  reducer: {
    pedidos: pedidosReducer,
    sectores: sectoresReducer, // <-- este debe existir
  },
});

export default store;