import React from 'react';
import dayjs from 'dayjs';
import TarjetaProgramada from './TarjetaProgramada';

const Sidebar = ({ 
  isSidebarCollapsed, 
  setIsSidebarCollapsed,
  tareasProgramadas,
  tareaSeleccionada,
  setTareaSeleccionada,
  abrirModalProgramadas,
  cargarProgramadas,
  supabase,
  mostrarSoloPendientes,
  setMostrarSoloPendientes,
  loading
}) => {
  const tareasFiltradas = tareasProgramadas.filter(tarea => {
    if (mostrarSoloPendientes) {
      const ahora = dayjs();
      const fechaVencimiento = dayjs(tarea.fecha_vencimiento);
      const diff = fechaVencimiento.diff(ahora, 'minute');
      
      return diff > 0 && tarea.estado !== 'Realizada' && tarea.estado !== 'Cancelada';
    }
    return true;
  });
  
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
      {/* Cabecera del sidebar */}
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
              {tareasFiltradas.filter(t => t.estado === 'Vencida').length > 0 && (
                <span className="badge bg-danger rounded-pill">
                  {tareasFiltradas.filter(t => t.estado === 'Vencida').length}
                </span>
              )}
              {tareasFiltradas.filter(t => t.estado === 'Por vencer').length > 0 && (
                <span className="badge bg-warning rounded-pill">
                  {tareasFiltradas.filter(t => t.estado === 'Por vencer').length}
                </span>
              )}
              {tareasFiltradas.filter(t => t.estado === 'Pendiente').length > 0 && (
                <span className="badge bg-primary rounded-pill">
                  {tareasFiltradas.filter(t => t.estado === 'Pendiente').length}
                </span>
              )}
              {tareasFiltradas.filter(t => t.estado === 'Realizada').length > 0 && (
                <span className="badge bg-success rounded-pill">
                  {tareasFiltradas.filter(t => t.estado === 'Realizada').length}
                </span>
              )}
              {tareasFiltradas.filter(t => t.estado === 'Cancelada').length > 0 && (
                <span className="badge bg-secondary rounded-pill">
                  {tareasFiltradas.filter(t => t.estado === 'Cancelada').length}
                </span>
              )}
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
              onChange={() => {
                setMostrarSoloPendientes(!mostrarSoloPendientes);
                setTareaSeleccionada(null);
              }}
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
            {tareaSeleccionada ? (
              <>
                <button
                  className="btn btn-sm btn-outline-warning"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirModalProgramadas(tareaSeleccionada);
                  }}
                  style={{ padding: '5px 8px' }}
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (window.confirm('¿Eliminar esta tarea programada?')) {
                      await supabase.from('programadas').delete().eq('id', tareaSeleccionada.id);
                      cargarProgramadas();
                      setTareaSeleccionada(null);
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

      {/* Contenido del sidebar */}
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
            {tareasFiltradas.filter(t => t.estado === 'Vencida').length > 0 && (
              <span className="badge bg-danger rounded-pill">
                {tareasFiltradas.filter(t => t.estado === 'Vencida').length}
              </span>
            )}
            {tareasFiltradas.filter(t => t.estado === 'Por vencer').length > 0 && (
              <span className="badge bg-warning rounded-pill">
                {tareasFiltradas.filter(t => t.estado === 'Por vencer').length}
              </span>
            )}
            {tareasFiltradas.filter(t => t.estado === 'Pendiente').length > 0 && (
              <span className="badge bg-primary rounded-pill">
                {tareasFiltradas.filter(t => t.estado === 'Pendiente').length}
              </span>
            )}
            {tareasFiltradas.filter(t => t.estado === 'Realizada').length > 0 && (
              <span className="badge bg-success rounded-pill">
                {tareasFiltradas.filter(t => t.estado === 'Realizada').length}
              </span>
            )}
            {tareasFiltradas.filter(t => t.estado === 'Cancelada').length > 0 && (
              <span className="badge bg-secondary rounded-pill">
                {tareasFiltradas.filter(t => t.estado === 'Cancelada').length}
              </span>
            )}
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
              <div className="d-flex flex-column gap-2">
                {tareasFiltradas.map(tarea => (
                  <TarjetaProgramada
                    key={tarea.registro_id}
                    tarea={tarea}
                    selected={tareaSeleccionada?.registro_id === tarea.registro_id}
                    onSelect={(registro_id) =>
                      setTareaSeleccionada(tareasFiltradas.find(t => t.registro_id === registro_id))
                    }
                    onComplete={async (registro_id, nuevoEstado) => {
                      const updatedTareas = tareasProgramadas.map(t =>
                        t.registro_id === registro_id ? { ...t, estado: nuevoEstado } : t
                      );
                      setTareaSeleccionada(null);
                      
                      try {
                        const { error } = await supabase
                          .from('registro_programadas')
                          .update({ estado: nuevoEstado })
                          .eq('id', registro_id);

                        if (error) throw error;
                        cargarProgramadas();
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