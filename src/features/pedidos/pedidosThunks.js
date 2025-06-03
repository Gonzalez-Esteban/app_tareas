// features/pedidos/pedidosThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabase/supabaseClient';

export const fetchPedidos = createAsyncThunk(
  'pedidos/fetchPedidos',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase
        .from('pedidos')
        .select('*,tareas(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

  // Borrar pedido
export const deletePedido = createAsyncThunk(
  'pedidos/deletePedido',
  async (id, { rejectWithValue }) => {
    const confirm = window.confirm("¿Estás seguro de borrar este pedido?");
    if (!confirm) return rejectWithValue('Cancelado por el usuario');

    try {
      const { error } = await supabase.from("pedidos").delete().eq("id", id);
      if (error) throw error;
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// Cambiar estado
export const updateEstadoPedido = createAsyncThunk(
  'pedidos/updateEstadoPedido',
  async ({ id, nuevoEstado }, { rejectWithValue }) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', id);

      if (error) throw error;
      return { id, nuevoEstado };
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
