import { configureStore } from '@reduxjs/toolkit';
import pedidosReducer from '../features/pedidos/pedidosSlice';
import sectoresReducer from '../features/sectores/sectoresSlice';
import programadasReducer from '../features/programadas/programadasSlice';
import proyectosReducer from '../features/proyectos/proyectosSlice';

const store = configureStore({
  reducer: {
    pedidos: pedidosReducer,
    sectores: sectoresReducer, 
    programadas: programadasReducer,
    proyectos: proyectosReducer
  },
});


export default store;