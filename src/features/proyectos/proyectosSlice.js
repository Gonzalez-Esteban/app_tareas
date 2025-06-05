// features/proyectos/proyectosSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { crearProyectoYRegistro } from './proyectosThunks';

const initialState = {
  loading: false,
  error: null,
  success: false,
  proyectoId: null
};

const proyectosSlice = createSlice({
  name: 'proyectos',
  initialState,
  reducers: {
    resetEstadoProyecto: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.proyectoId = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(crearProyectoYRegistro.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
        state.proyectoId = null;
      })
      .addCase(crearProyectoYRegistro.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.proyectoId = action.payload.id_proyecto;
      })
      .addCase(crearProyectoYRegistro.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al crear el proyecto';
        state.success = false;
        state.proyectoId = null;
      });
  }
});

export const { resetEstadoProyecto } = proyectosSlice.actions;
export default proyectosSlice.reducer;
