// features/pedidos/pedidosSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchPedidos } from './pedidosThunks';
import { deletePedido, updateEstadoPedido } from './pedidosThunks';

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
      })
          // DELETE
    .addCase(deletePedido.fulfilled, (state, action) => {
      const id = action.payload;
      state.pedidos = state.pedidos.filter(p => p.id !== id);
    })

    // UPDATE ESTADO
    .addCase(updateEstadoPedido.fulfilled, (state, action) => {
      const { id, nuevoEstado } = action.payload;
      const pedido = state.pedidos.find(p => p.id === id);
      if (pedido) {
        pedido.estado = nuevoEstado;
      }
    });
  },
});

export const { clearPedidos } = pedidosSlice.actions;
export default pedidosSlice.reducer;
