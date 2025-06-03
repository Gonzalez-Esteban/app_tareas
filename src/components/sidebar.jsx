import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import TarjetaProgramada from './TarjetaProgramada';
import { setMostrarSoloPendientes } from '../features/programadas/programadasSlice';
import { fetchTareasProgramadas } from '../features/programadas/programadasThunks'; // Asegúrate de importar tu thunk
import { useEffect, useRef } from 'react';


const Sidebar = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  progSeleccionada,
  setProgSeleccionada,
  abrirModalProgramadas,
  supabase,
  loading
}) => {
  const dispatch = useDispatch();
  const tarjetasRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tarjetasRef.current && !tarjetasRef.current.contains(event.target)) {
        setProgSeleccionada(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
  dispatch(fetchTareasProgramadas());
}, [dispatch]);

  // 🔁 Estado desde Redux

  const tareasProgramadas = useSelector(state => state.programadas.tareas);
  const mostrarSoloPendientes = useSelector(state => state.programadas.mostrarSoloPendientes);

  // 📋 Aplicar filtro
  const tareasFiltradas = tareasProgramadas.filter(tarea => {
    if (mostrarSoloPendientes) {
      const ahora = dayjs();
      const fechaVencimiento = dayjs(tarea.fecha_vencimiento);
      const diff = fechaVencimiento.diff(ahora, 'minute');
      return diff > 0 && tarea.estado !== 'Realizada' && tarea.estado !== 'Cancelada';
    }
    return true;
  });

const eliminarProgramada = async (idProg) => {
  try {
    const { error } = await supabase
      .from('programadas')
      .delete()
      .eq('id', idProg);

    if (error) throw error;

    dispatch(fetchTareasProgramadas());
    setProgSeleccionada(null);
    console.log("Tarea programada eliminada correctamente");
  } catch (error) {
    console.error("Error al eliminar tarea programada:", error.message);
    alert("No se pudo eliminar la tarea. Verifica si hay registros dependientes.");
  }
};


  // ✅ Cambio de filtro
  const handleToggleFiltro = () => {
    dispatch(setMostrarSoloPendientes(!mostrarSoloPendientes));
    setProgSeleccionada(null);
  };



  return (
    <div
      className="sidebar-scroll"
      style={{
        width: isSidebarCollapsed ? '50px' : '390px',
        backgroundColor: '#212529',
        overflowY: 'auto',
        transition: 'width 0.3s ease',
        position: 'fixed',
        top: '56px',
        bottom: 0,
        left: 0,
        zIndex: 1000,
        borderRight: '1px solid #4a5568',
        scrollbarWidth: 'thin',
        scrollbarColor: '#444 #212529'
      }}
    >
      {/* Cabecera */}
      <div style={{
        padding: '10px',
        position: 'sticky',
        top: 0,
        backgroundColor: '#212529',
        zIndex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        borderTop: '1px solid #4a5568',
        alignItems: 'center',
        borderBottom: '1px solid #2d3748',
        minHeight: '40px'
      }}>
        {!isSidebarCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h6 style={{ color: '#a0aec0', whiteSpace: 'normal', margin: 0 }}>
              <i className="bi bi-calendar3 me-1"> </i>
              Programadas
            </h6>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              {['Vencida', 'Por vencer', 'Pendiente', 'Realizada', 'Cancelada'].map(estado => (
                tareasFiltradas.filter(t => t.estado === estado).length > 0 && (
                  <span
                    key={estado}
                    className={`badge bg-${{
                      'Vencida': 'danger',
                      'Por vencer': 'warning',
                      'Pendiente': 'primary',
                      'Realizada': 'success',
                      'Cancelada': 'secondary'
                    }[estado]} rounded-pill`}
                  >
                    {tareasFiltradas.filter(t => t.estado === estado).length}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          style={{
            background: 'none',
            border: 'none',
            color: '#a0aec0',
            cursor: 'pointer',
            padding: '8px',
            flexShrink: 0,
            marginLeft: isSidebarCollapsed ? '0' : 'auto'
          }}
        >
          <i className={`bi bi-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>

      {/* Botones de acción */}
      {!isSidebarCollapsed && (
        <div style={{
          padding: '10px',
          borderBottom: '1px solid #4a5568',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div className="form-check form-switch" style={{ margin: 0 }}>
            <input
              className="form-check-input"
              type="checkbox"
              id="filtroPendientes"
              checked={!mostrarSoloPendientes}
              onChange={handleToggleFiltro}
              style={{
                backgroundColor: !mostrarSoloPendientes ? '#a0aec0' : '#4a5568',
                borderColor: !mostrarSoloPendientes ? '#a0aec0' : '#4a5568',
              }}
            />
            <label
              className="form-check-label"
              htmlFor="filtroPendientes"
              style={{
                color: '#a0aec0',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              {mostrarSoloPendientes ? 'Pendientes' : 'Todos'}
            </label>
          </div>

          <div style={{ display: 'flex', gap: '5px' }}>
            {progSeleccionada ? (
              <>
                <button
                  className="btn btn-sm btn-outline-warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirModalProgramadas(progSeleccionada);
                  }}
                  style={{ padding: '5px 8px' }}
                >
                  <i className="bi bi-pencil"></i>
                </button>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={async (e) => {
                  e.stopPropagation();
                   console.log("Botón clickeado");

                  if (!progSeleccionada) {
                    console.warn("No hay tarea seleccionada");
                    return;
                  }

                  if (window.confirm('¿Eliminar esta tarea programada?')) {
                    console.log("Eliminando tarea programada con id:", progSeleccionada.id_prog);
                    await eliminarProgramada(porgSeleccionada.id_prog);
                  }
                }}
                style={{ padding: '5px 8px' }}
              >
                <i className="bi bi-trash"></i>
              </button>
              </>
            ) : (
              <button
                className="btn btn-sm btn-outline-primary"
                onClick={() => abrirModalProgramadas()}
                style={{ padding: '5px 8px' }}
              >
                <i className="bi bi-calendar2-plus"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contenido del Sidebar */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: isSidebarCollapsed ? '16px 8px' : '16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {isSidebarCollapsed ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: '#a0aec0',
            height: '100%',
            gap: '4px'
          }}>
            <i className="bi bi-calendar3" style={{ fontSize: '1.2rem' }}></i>
            {['Vencida', 'Por vencer', 'Pendiente', 'Realizada', 'Cancelada'].map(estado => (
              tareasFiltradas.filter(t => t.estado === estado).length > 0 && (
                <span
                  key={estado}
                  className={`badge bg-${{
                    'Vencida': 'danger',
                    'Por vencer': 'warning',
                    'Pendiente': 'primary',
                    'Realizada': 'success',
                    'Cancelada': 'secondary'
                  }[estado]} rounded-pill`}
                >
                  {tareasFiltradas.filter(t => t.estado === estado).length}
                </span>
              )
            ))}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="text-center my-4">
                <div className="spinner-border spinner-border-sm text-light" role="status"></div>
              </div>
            ) : tareasFiltradas.length === 0 ? (
              <div className="text-center py-4 text-secondary">
                <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
                <p>Sin tareas {mostrarSoloPendientes ? 'pendientes' : 'programadas'}</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" ref={tarjetasRef}>
                {tareasFiltradas.map(tarea => (
                  <TarjetaProgramada
                    key={tarea.registro_id}
                    tarea={tarea}
                    selected={progSeleccionada?.registro_id === tarea.registro_id}
                       onSelect={(registro_id) => {
                        const progSeleccionada = tareasFiltradas.find(t => t.registro_id === registro_id);
                        console.log("Tarea seleccionada:", progSeleccionada); 
                        setProgSeleccionada(progSeleccionada);
                      }}
                    onComplete={async (registro_id, nuevoEstado) => {
                      const updatedTareas = tareasProgramadas.map(t =>
                        t.registro_id === registro_id ? { ...t, estado: nuevoEstado } : t
                      );
                      setProgSeleccionada(null);
                      try {
                        const { error } = await supabase
                          .from('registro_programadas')
                          .update({ estado: nuevoEstado })
                          .eq('id', id);

                        if (error) throw error;
                        dispatch(fetchTareasProgramadas());
                      } catch (error) {
                        console.error("Error actualizando estado:", error);
                      }
                    }}
                  />
                ))}
              </div>

            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
