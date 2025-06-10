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
          id, estado, fecha_vencimiento, demora, id_prog, id_proyecto, etapa,
          programadas (
            id, descripcion, creado_por, usuarios_asignados, tipo_recurrencia, activa
          )
        `)
        .gte('fecha_vencimiento', hoyInicio)
        .lte('fecha_vencimiento', hoyFin)
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      // Obtener proyectos asociados
      const idsProyecto = [...new Set(data.filter(r => r.id_proyecto).map(r => r.id_proyecto))];

      let proyectos = {};
      if (idsProyecto.length > 0) {
        const { data: proyectosData, error: proyectosError } = await supabase
          .from('proyectos')
          .select('id, nombre, vencimiento, etapas')
          .in('id', idsProyecto);

        if (proyectosError) throw proyectosError;

        proyectosData.forEach(p => {
          proyectos[p.id] = p;
        });
      }

      // Mapear tareas
      const tareas = data.map(r => ({
        ...r.programadas,
        registro_id: r.id,
        id_prog: r.id_prog,
        id_proyecto: r.id_proyecto,
        etapa: r.etapa,
        estado: r.estado,
        demora: r.demora,
        fecha_vencimiento: r.fecha_vencimiento,
        proyecto: r.id_proyecto ? proyectos[r.id_proyecto] : null
      }));

      return tareas;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
