import React from 'react';
import dayjs from 'dayjs';


const TarjetaProyecto = ({ proyecto, tareas }) => {
  const tareasPorEtapa = tareas?.reduce((acc, tarea) => {
    const etapaIndex = tarea.etapa || 1;
    if (!acc[etapaIndex]) acc[etapaIndex] = [];
    acc[etapaIndex].push(tarea);
    return acc;
  }, {}) || {};

  const obtenerIconoEstado = (estado) => {
    switch (estado) {
      case 'Realizada': return '✅';
      case 'Cancelada': return '❌';
      case 'Pendiente':
      default: return '⏳';
    }
  };

  return (
    <div className="bg-dark text-white p-3 mb-3 rounded border shadow-sm">
      <h6 className="mb-1">
        <i className="bi bi-journal me-2"></i>{proyecto.nombre}
      </h6>
      <p className="text-white mb-1">🎯 {proyecto.objetivos}</p>
      <h7 className="text-white">📅 {dayjs(proyecto.vencimiento).format('DD/MM/YYYY')}</h7>

      <div className="mt-3">
        {proyecto.etapas?.map((etapaNombre, i) => {
          const etapaNum = i + 1;
          const tareasEtapa = tareasPorEtapa[etapaNum] || [];

          return (
            <div key={i} className="etapa-nodo">
              <div className="linea-arbol"></div>
              <div className="contenido-nodo">
                <h6 className="text-info mb-2">🧩 {etapaNombre}</h6>

                {tareasEtapa.length === 0 && (
                  <div className="text-muted ms-3">Sin tareas en esta etapa</div>
                )}

                {tareasEtapa.map((tarea, j) => (
                  <div key={j} className="tarea-nodo">
                    <div className="linea-arbol-sub"></div>
                    <div className="contenido-nodo">
                      <div><strong>{obtenerIconoEstado(tarea.estado)} {tarea.descripcion}</strong></div>
                      <div className="text-secondary small">
                        🕒 {dayjs(tarea.fecha_vencimiento).format('DD/MM/YYYY HH:mm')} | Estado:
                        <span className={`badge bg-${tarea.estado === 'Pendiente' ? 'warning' : tarea.estado === 'Realizada' ? 'success' : 'secondary'} ms-2`}>
                          {tarea.estado}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TarjetaProyecto;
