import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';

const TarjetaProyecto = ({
  proyecto,
  tareas,
  proyectoSeleccionado,
  etapaSeleccionada,
  tareaSeleccionada,
  onSeleccionarProyecto,
  onSeleccionarEtapa,
  onSeleccionarTarea,
  onEditarTarea,
  onEliminarTarea,
  onAgregarTarea,
  onEditarProyecto,
  onEditarEtapa,
  onEliminarProyecto,
  onEliminarEtapa,
   reiniciar 
}) => {
  const [mostrarEtapas, setMostrarEtapas] = useState(false);
  const [etapasExpandidas, setEtapasExpandidas] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef();
  const etapasRefs = useRef({});
  const curvasRefs = useRef({});
  const [lineasInfo, setLineasInfo] = useState({});

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  setMostrarEtapas(false);
  setEtapasExpandidas([]);
}, [reiniciar]);

  const tareasPorEtapa = tareas?.reduce((acc, tarea) => {
    const etapaIndex = tarea.etapa || 1;
    if (!acc[etapaIndex]) acc[etapaIndex] = [];
    acc[etapaIndex].push(tarea);
    return acc;
  }, {}) || {};

  const estaSeleccionadoProyecto = proyectoSeleccionado?.id === proyecto.id && !etapaSeleccionada && !tareaSeleccionada;

  const toggleEtapas = (e) => {
    e.stopPropagation();
    setMostrarEtapas(prev => !prev);
  };

  const toggleTareas = (etapaNum, e) => {
    e.stopPropagation();
    setEtapasExpandidas(prev =>
      prev.includes(etapaNum) ? prev.filter(n => n !== etapaNum) : [...prev, etapaNum]
    );
  };

  useEffect(() => {
  if (reiniciar) {
    setMostrarEtapas(false);
    setEtapasExpandidas([]);
  }
}, [reiniciar]);
  useEffect(() => {
    const nuevasLineas = {};

    requestAnimationFrame(() => {
      proyecto.etapas?.forEach((_, i) => {
        const etapaNum = i + 1;
        const key = `${proyecto.id}-${etapaNum}`;

        if (!etapasExpandidas.includes(etapaNum)) return;

        const etapaEl = etapasRefs.current[key];
        const curvaEl = curvasRefs.current[key];
        const containerEl = containerRef.current;

        if (etapaEl && curvaEl && containerEl) {
          const etapaBottom = etapaEl.getBoundingClientRect().bottom;
          const curvaTop = curvaEl.getBoundingClientRect().top;
          const containerTop = containerEl.getBoundingClientRect().top;

          nuevasLineas[key] = {
            top: etapaBottom - containerTop,
            height: curvaTop - etapaBottom
          };
        }
      });
      setLineasInfo(nuevasLineas);
    });
  }, [etapasExpandidas, tareas]);

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onSeleccionarProyecto?.(proyecto);
      }}
      style={{
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: `2px solid ${estaSeleccionadoProyecto ? '#63b3ed' : '#4a5568'}`,
        backgroundColor: 'transparent',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <div style={{ position: 'relative', paddingRight: '66px' }}>
        <h6 className="fw-bold mb-2 d-flex align-items-center text-white">
          <i className="bi bi-journal me-2"></i> {proyecto.nombre}
        </h6>


        {estaSeleccionadoProyecto && (
          <div style={{
            position: 'absolute',
            top: '-8px',
            right: '8px',
            display: 'flex',
            gap: '5px'
          }}>
            <i className="bi bi-trash text-danger" title="Eliminar proyecto"
              onClick={(e) => {
                e.stopPropagation();
                onEliminarProyecto?.(proyecto);
              }} style={{ cursor: 'pointer' }}></i>
            <i className="bi bi-pencil-square text-info" title="Editar proyecto"
              onClick={(e) => {
                e.stopPropagation();
                onEditarProyecto?.(proyecto, 'proyecto');
              }} style={{ cursor: 'pointer' }}></i>
            <i className="bi bi-plus-circle text-success" title="Agregar etapa"
              onClick={(e) => {
                e.stopPropagation();
                onAgregarTarea?.(proyecto);
              }} style={{ cursor: 'pointer' }}></i>

            <i className={`bi bi-chevron-${mostrarEtapas ? 'up' : 'down'} text-light`} onClick={toggleEtapas} style={{ cursor: 'pointer' }}></i>
          </div>
        )}
      </div>

      {mostrarEtapas && proyecto.etapas?.map((etapaNombre, i) => {
        const etapaNum = i + 1;
        const tareasEtapa = tareasPorEtapa[etapaNum] || [];
        const etapaActiva = etapaSeleccionada?.numero === etapaNum && proyectoSeleccionado?.id === proyecto.id && (!tareaSeleccionada || tareaSeleccionada.etapa !== etapaNum);
        const expandida = etapasExpandidas.includes(etapaNum);
        const key = `${proyecto.id}-${etapaNum}`;
        const linea = lineasInfo[key];

        return (
          <div key={i} className="mt-2 ms-2" style={{ position: 'relative' }}>
            {expandida && linea && (
              <div
                style={{
                  position: 'absolute',
                  left: '4px',
                  top: `${linea.top - 45}px`,
                  height: `${linea.height}px`,
                  width: '2px',
                  backgroundColor: '#4a5568',
                  zIndex: 0
                }}
              ></div>
            )}

            <div
              className="d-flex align-items-center"
              onClick={(e) => {
                e.stopPropagation();
                onSeleccionarEtapa?.(proyecto, etapaNum);
              }}
              ref={(el) => (etapasRefs.current[key] = el)}
              style={{
                position: 'relative',
                border: `2px solid ${etapaActiva ? '#63b3ed' : '#4a5568'}`,
                padding: '8px 12px',
                paddingRight: '64px',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#f7fafc',
                backgroundColor: 'transparent',
                minHeight: '40px'
              }}
            >
              <span>{etapaNombre}</span>
              {etapaActiva && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <i className="bi bi-trash text-danger" title="Eliminar etapa"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEliminarEtapa?.(proyecto, etapaNum);
                    }}></i>
                  <i className="bi bi-pencil-square text-info" title="Editar etapa"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditarEtapa?.(proyecto, etapaNum);
                    }}></i>
                  <i className="bi bi-plus-circle text-light" title="Agregar tarea"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgregarTarea?.(proyecto, etapaNum);
                    }}></i>

                  <i className={`bi bi-chevron-${expandida ? 'up' : 'down'} text-light`} onClick={(e) => toggleTareas(etapaNum, e)} style={{ cursor: 'pointer' }}></i>
                </div>
              )}
            </div>

            {expandida && tareasEtapa.map((tarea, j) => {
              const tareaActiva = tareaSeleccionada?.id === tarea.id;
              return (
                <div
                  key={j}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeleccionarTarea?.(proyecto, etapaNum, tarea);
                  }}
                  style={{
                    border: `2px solid ${tareaActiva ? '#63b3ed' : '#4a5568'}`,
                    backgroundColor: 'transparent',
                    padding: '8px 12px',
                    paddingRight: '64px',
                    borderRadius: '4px',
                    marginTop: '8px',
                    cursor: 'pointer',
                    marginLeft: '24px',
                    position: 'relative',
                    minHeight: '48px'
                  }}
                >
                  <div
                    ref={(el) => (curvasRefs.current[key] = el)}
                    style={{
                      position: 'absolute',
                      left: '-22px',
                      top: '0.65rem',
                      width: '20px',
                      height: '20px',
                      borderLeft: '2px solid #4a5568',
                      borderBottom: '2px solid #4a5568',
                      borderBottomLeftRadius: '8px'
                    }}
                  ></div>

                  {tareaActiva && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <i className="bi bi-trash text-danger" onClick={(e) => {
                        e.stopPropagation();
                        onEliminarTarea?.(tarea);
                      }}></i>
                      <i className="bi bi-pencil-square text-info" onClick={(e) => {
                        e.stopPropagation();
                        onEditarTarea?.(tarea);
                      }}></i>

                    </div>
                  )}
                  <div>{tarea.descripcion}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default TarjetaProyecto;
