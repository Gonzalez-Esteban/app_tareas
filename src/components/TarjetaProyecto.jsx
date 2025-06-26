import React, { useState, useRef, useEffect } from 'react';
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
  onAgregarEtapa
}) => {
  const [mostrarEtapas, setMostrarEtapas] = useState(false);
  const [etapasExpandidas, setEtapasExpandidas] = useState([]);
  const [alturasLineas, setAlturasLineas] = useState({});

  const curvasRefs = useRef({});
  const etapasRefs = useRef({});

  const tareasPorEtapa = tareas?.reduce((acc, tarea) => {
    const etapaIndex = tarea.etapa || 1;
    if (!acc[etapaIndex]) acc[etapaIndex] = [];
    acc[etapaIndex].push(tarea);
    return acc;
  }, {}) || {};

  const toggleEtapa = (index) => {
    setEtapasExpandidas(prev => {
      const nueva = prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index];
      return nueva;
    });
  };

  const calcularAlturas = () => {
    const nuevasAlturas = {};
    etapasExpandidas.forEach((etapaIdx) => {
      const key = `${proyecto.id}-${etapaIdx + 1}`;
      const curva = curvasRefs.current[key];
      const contenedor = etapasRefs.current[key];
      if (curva && contenedor) {
        const curvaTop = curva.getBoundingClientRect().top;
        const contenedorTop = contenedor.getBoundingClientRect().top;
        nuevasAlturas[key] = curvaTop - contenedorTop + 8;
      }
    });
    setAlturasLineas(nuevasAlturas);
  };

  useEffect(() => {
    if (mostrarEtapas && etapasExpandidas.length > 0) {
      setTimeout(calcularAlturas, 0);
    }
  }, [mostrarEtapas, etapasExpandidas, tareas]);

  const estaSeleccionado = proyectoSeleccionado?.id === proyecto.id;

  return (
    <div
      style={{
        backgroundColor: estaSeleccionado ? '#4a5568' : 'transparent',
        color: '#e2e8f0',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px',
        border: '1px solid #4a5568',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
      <div className="d-flex justify-content-between align-items-center">
        <h6
          className="fw-bold mb-2 d-flex align-items-center"
          style={{ cursor: 'pointer', color: '#ffffff' }}
          onClick={() => {
            const mostrar = !mostrarEtapas;
            setMostrarEtapas(mostrar);
            onSeleccionarProyecto?.(proyecto);
            if (mostrar) {
              const todas = proyecto.etapas?.map((_, i) => i) || [];
              setEtapasExpandidas(todas);
              setTimeout(calcularAlturas, 0);
            } else {
              setEtapasExpandidas([]);
              setAlturasLineas({});
            }
          }}
        >
          <i className="bi bi-journal me-2"></i> {proyecto.nombre}
        </h6>
          
      <div style={{ fontSize: '0.8rem', color: '#cbd5e0', marginLeft:'4px' }}>
        Entrega: {dayjs(proyecto.vencimiento).format('DD/MM/YYYY')}
      </div>

        <div className="d-flex gap-2">
          <i className="bi bi-pencil-square text-info" title="Editar proyecto"
             style={{ cursor: 'pointer' }}
             onClick={() => onEditarProyecto?.(proyecto)}></i>
          <i className="bi bi-plus-circle text-success" title="Agregar etapa"
             style={{ cursor: 'pointer' }}
             onClick={() => onAgregarEtapa?.(proyecto)}></i>
        </div>
      </div>

      <p style={{ fontSize: '0.9rem', marginBottom: '4px' }}>{proyecto.objetivos}</p>

      {mostrarEtapas && proyecto.etapas?.map((etapaNombre, i) => {
        const etapaNum = i + 1;
        const tareasEtapa = tareasPorEtapa[etapaNum] || [];
        const expandida = etapasExpandidas.includes(i);
        const key = `${proyecto.id}-${etapaNum}`;
        const alturaLinea = alturasLineas[key] ?? 0;
        const etapaActiva = etapaSeleccionada?.numero === etapaNum && proyectoSeleccionado?.id === proyecto.id;

        return (
          <div
            key={i}
            style={{ position: 'relative', paddingLeft: '25px', marginBottom: '24px' }}
            ref={(el) => etapasRefs.current[key] = el}
          >
            {expandida && tareasEtapa.length > 0 && (
              <div style={{
                position: 'absolute',
                left: '31px',
                top: '0',
                height: `${alturaLinea}px`,
                width: '2px',
                backgroundColor: '#4a5568',
                borderRadius: '1px',
                zIndex: 0
              }} />
            )}

            <div
              onClick={() => {
                toggleEtapa(i);
                onSeleccionarEtapa?.(proyecto, etapaNum);
              }}
              style={{
                backgroundColor: etapaActiva ? '#2b6cb0' : '#4a5568',
                color: '#f7fafc',
                padding: '4px 12px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              {etapaNombre}
              <i className="bi bi-plus-circle ms-2 text-light" title="Agregar tarea"
                 onClick={(e) => {
                   e.stopPropagation();
                   onAgregarTarea?.(proyecto, etapaNum);
                 }}></i>
            </div>

            {expandida && (
              <div className="mt-2">
                {tareasEtapa.length === 0 ? (
                  <div className="text-primary ms-2">Sin tareas</div>
                ) : (
                  tareasEtapa.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    .map((tarea, j) => {
                      const esUltima = j === tareasEtapa.length - 1;
                      const tareaActiva = tareaSeleccionada?.id === tarea.id;
                      return (
                        <div
                          key={j}
                          style={{
                            position: 'relative',
                            paddingLeft: '25px',
                            marginTop: '10px'
                          }}
                        >
                          <div
                            ref={esUltima ? (el) => curvasRefs.current[key] = el : null}
                            style={{
                              position: 'absolute',
                              left: '6px',
                              top: '0.65rem',
                              width: '20px',
                              height: '20px',
                              borderLeft: '2px solid #4a5568',
                              borderBottom: '2px solid #4a5568',
                              borderBottomLeftRadius: '10px'
                            }}
                          />

                          <div
                            style={{
                              backgroundColor: tareaActiva ? '#2b6cb0' : '#2d3748',
                              border: '1px solid #4a5568',
                              borderRadius: '6px',
                              padding: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              cursor: 'pointer'
                            }}
                            onClick={() => onSeleccionarTarea?.(proyecto, etapaNum, tarea)}
                          >
                            <div>
                              <div style={{ fontWeight: '500', color: '#e2e8f0' }}>
                                {tarea.descripcion}
                              </div>
                              <div className="text-secondary small">
                                🕒 {dayjs(tarea.fecha_vencimiento).format('DD/MM/YYYY HH:mm')} | Estado:
                                <span className={`badge bg-${
                                  tarea.estado === 'Pendiente' ? 'warning' :
                                  tarea.estado === 'Realizada' ? 'success' : 'secondary'
                                } ms-2`}>
                                  {tarea.estado}
                                </span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                              <i
                                className="bi bi-pencil-square text-info"
                                title="Editar"
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditarTarea?.(proyecto, etapaNum, tarea);
                                }}
                              ></i>
                              <i
                                className="bi bi-trash text-danger"
                                title="Eliminar"
                                style={{ cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEliminarTarea?.(proyecto, etapaNum, tarea);
                                }}
                              ></i>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TarjetaProyecto;