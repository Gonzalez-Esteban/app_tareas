// features/programadas/programadasSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchTareasProgramadas } from './programadasThunks';

const initialState = {
  tareas: [],
  mostrarSoloPendientes: true, 
  loading: false,
  error: null,
};

const programadasSlice = createSlice({
  name: 'programadas',
  initialState,
  reducers: {
    setTareasProgramadas: (state, action) => {
      state.tareas = action.payload;
    },
    setMostrarSoloPendientes: (state, action) => {
      state.mostrarSoloPendientes = action.payload;
    },
    clearTareasProgramadas: (state) => {
      state.tareas = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTareasProgramadas.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTareasProgramadas.fulfilled, (state, action) => {
        state.tareas = action.payload;
        state.loading = false;
      })
      .addCase(fetchTareasProgramadas.rejected, (state, action) => {
        state.error = action.payload || 'Error al cargar tareas programadas';
        state.loading = false;
      });
  },
});

export const {
    clearTareasProgramadas, 
    setTareasProgramadas,
    setMostrarSoloPendientes
} = programadasSlice.actions;
export default programadasSlice.reducer;
