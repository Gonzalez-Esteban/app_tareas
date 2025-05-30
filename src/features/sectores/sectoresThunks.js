// features/sectores/sectoresThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabase/supabaseClient';

export const fetchSectores = createAsyncThunk(
  'sectores/fetchSectores',
  async (_, { rejectWithValue }) => {
    try {
      const { data, error } = await supabase.from('sectores').select('*');
      if (error) throw error;
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);
