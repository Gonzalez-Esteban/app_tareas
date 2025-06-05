// features/proyectos/proyectosThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../supabase/supabaseClient';
import dayjs from 'dayjs';

/**
 * payload esperado:
 * {
 *   nombre: string,
 *   objetivos: string,
 *   vencimiento: YYYY-MM-DD,
 *   sector: number,
 *   genero: string,
 *   id_uuid: string,
 *   etapas: [
 *     {
 *       nombre: string,
 *       tareas: [
 *         {
 *           descripcion: string,
 *           usuarios: [{ id: string, nombre: string }],
 *           fecha: YYYY-MM-DD,
 *           hora: HH:mm
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

export const crearProyectoYRegistro = createAsyncThunk(
  'proyectos/crearProyectoYRegistro',
  async (payload, { rejectWithValue }) => {
    try {
      const {
        nombre,
        objetivos,
        vencimiento,
        sector,
        genero,
        id_uuid,
        etapas
      } = payload;

      // 1. Insertar proyecto
      const { data: proyecto, error: errorProyecto } = await supabase
        .from('proyectos')
        .insert({
          nombre,
          objetivos,
          vencimiento: `${vencimiento}T00:00:00`,
          sector,
          genero,
          id_uuid
        })
        .select()
        .single();

      if (errorProyecto) throw errorProyecto;

      const id_proyecto = proyecto.id;

      // 2. Insertar tareas en registro_programadas
      for (let i = 0; i < etapas.length; i++) {
        const etapaNumero = i + 1;
        const etapa = etapas[i];

        for (let tarea of etapa.tareas) {
          const fechaCompleta = `${tarea.fecha}T${tarea.hora}:00`;

          // Paso 1: Insertar en programadas (tarea base)
          const { data: [programada], error: errorProgramada } = await supabase
            .from('programadas')
            .insert({
              descripcion: tarea.descripcion,
              tipo_recurrencia: 'unica',
              id_proyecto,
              usuarios_asignados: tarea.usuarios.map(u => u.id),
              creado_por: id_uuid,
              activa: true
            })
            .select();

          if (errorProgramada) throw errorProgramada;

          // Paso 2: Insertar en registro_programadas
          const { error: errorRegistro } = await supabase
            .from('registro_programadas')
            .insert({
              id_prog: programada.id,
              fecha_vencimiento: fechaCompleta,
              id_proyecto,
              etapa: etapaNumero,
              estado: 'Pendiente'
            });

          if (errorRegistro) throw errorRegistro;
        }
      }
      return { success: true, id_proyecto };
    } catch (err) {
      return rejectWithValue(err.message || 'Error al crear proyecto y tareas');
    }
  }
);
