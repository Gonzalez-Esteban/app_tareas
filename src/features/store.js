import { configureStore } from '@reduxjs/toolkit';
import pedidosReducer from '../features/pedidos/pedidosSlice';
import sectoresReducer from '../features/sectores/sectoresSlice';
import programadasReducer from '../features/programadas/programadasSlice';

const store = configureStore({
  reducer: {
    pedidos: pedidosReducer,
    sectores: sectoresReducer, 
    programadas: programadasReducer
  },
});


export default store;