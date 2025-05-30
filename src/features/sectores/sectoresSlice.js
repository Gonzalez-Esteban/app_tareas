// features/sectores/sectoresSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { fetchSectores } from './sectoresThunks';

const initialState = {
  sectores: [],
  loading: false,
  error: null,
};

const sectoresSlice = createSlice({
  name: 'sectores',
  initialState,
  reducers: {
    clearSectores: (state) => {
      state.sectores = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSectores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSectores.fulfilled, (state, action) => {
        state.sectores = action.payload;
        state.loading = false;
      })
      .addCase(fetchSectores.rejected, (state, action) => {
        state.error = action.payload || 'Error al cargar sectores';
        state.loading = false;
      });
  },
});

export const { clearSectores } = sectoresSlice.actions;
export default sectoresSlice.reducer;
