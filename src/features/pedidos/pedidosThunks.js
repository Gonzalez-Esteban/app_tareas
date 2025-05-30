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
