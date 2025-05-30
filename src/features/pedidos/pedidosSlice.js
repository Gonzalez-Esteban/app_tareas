// features/pedidos/pedidosSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchPedidos } from './pedidosThunks';

const initialState = {
  pedidos: [],
  loading: false,
  error: null,
};

const pedidosSlice = createSlice({
  name: 'pedidos',
  initialState,
  reducers: {
    clearPedidos: (state) => {
      state.pedidos = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPedidos.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPedidos.fulfilled, (state, action) => {
        state.pedidos = action.payload;
        state.loading = false;
      })
      .addCase(fetchPedidos.rejected, (state, action) => {
        state.error = action.payload || 'Error al cargar pedidos';
        state.loading = false;
      });
  },
});

export const { clearPedidos } = pedidosSlice.actions;
export default pedidosSlice.reducer;
