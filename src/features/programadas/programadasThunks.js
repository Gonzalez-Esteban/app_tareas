// features/programadas/programadasThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabase/supabaseClient';
import dayjs from 'dayjs';

export const fetchTareasProgramadas = createAsyncThunk(
  'programadas/fetchTareasProgramadas',
  async (_, { rejectWithValue }) => {
    try {
      const hoyInicio = dayjs().startOf('day').toISOString();
      const hoyFin = dayjs().endOf('day').toISOString();

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('registro_programadas')
        .select(`
          id, estado, fecha_vencimiento, demora, id_prog,
          programadas (
            id, descripcion, creado_por, usuarios_asignados, tipo_recurrencia, activa
          )
        `)
        .eq('programadas.activa', true)
        .gte('fecha_vencimiento', hoyInicio)
        .lte('fecha_vencimiento', hoyFin)
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;

      const tareasFiltradas = data
        .filter(item => item.programadas !== null)
        .map(r => ({
          ...r,
          ...r.programadas,
          registro_id: r.id,
        }));

      return tareasFiltradas;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
