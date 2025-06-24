import React from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

const TarjetaProyecto = ({ proyecto }) => {
  if (!proyecto) return null;

  return (
    <div className="card bg-dark text-white mb-3 border border-secondary rounded">
      <div className="card-header d-flex align-items-center">
        <i className="bi bi-kanban me-2 text-info"></i>
        <h5 className="mb-0 text-info">{proyecto.nombre}</h5>
        <span className="ms-auto text-white-50">
          Vence: {dayjs(proyecto.vencimiento).format('DD/MM/YYYY')}
        </span>
      </div>
      <div className="card-body">
        {proyecto.etapas.map((etapa, i) => (
          <div key={i} className="mb-4">
            <div className="d-flex align-items-center">
              <div className="vr me-3 bg-secondary" style={{ height: '100%', width: '2px' }}></div>
              <h6 className="mb-2 text-warning">Etapa {i + 1}: {etapa.nombre}</h6>
            </div>

            {etapa.tareas.map((tarea, j) => (
              <div key={j} className="ms-4 mb-3">
                <div className="d-flex align-items-start">
                  <div className="d-flex flex-column align-items-center me-3">
                    <div className="bg-secondary" style={{ width: '2px', height: '100%' }}></div>
                    <div className="bg-secondary rounded-circle" style={{ width: '8px', height: '8px', marginTop: '-4px' }}></div>
                  </div>
                  <div className="bg-secondary bg-opacity-10 p-2 rounded w-100">
                    <div className="d-flex justify-content-between">
                      <strong>{tarea.descripcion}</strong>
                      <span className="text-white-50">
                        {dayjs(tarea.fecha).format('DD/MM/YYYY')} {tarea.hora}
                      </span>
                    </div>
                    <div className="mt-1">
                      {tarea.usuarios && tarea.usuarios.length > 0 && (
                        <>
                          <small className="text-muted">Asignado a:</small>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {tarea.usuarios.map(u => (
                              <span key={u.id} className="badge bg-primary">
                                {u.nombre}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TarjetaProyecto;