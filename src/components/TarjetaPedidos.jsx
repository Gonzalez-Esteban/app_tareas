import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import dayjs from 'dayjs';

const TarjetaPedidos = ({ 
  pedido = {},
  usuario = {},
  sectores = [],
  obtenerNombreSector = () => "Sin sector",
  calcularTiempoTranscurrido = () => "No disponible",
  onSelectPedido = () => {},
  onSelectTarea = () => {},
  selectedPedidoId = null,
  selectedTareaId = null
}) => {
  const [showTareas, setShowTareas] = useState(false);
  const [creadoresTareas, setCreadoresTareas] = useState({});
  const [localRefresh, setLocalRefresh] = useState(0); // Nuevo estado local

  useEffect(() => {
    const obtenerNombresCreadores = async () => {
      if (!pedido.tareas?.length) return;
      
      const idsUnicos = [...new Set(pedido.tareas.map(t => t.id_uuid))];
      
      const { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('id_uuid, Nombre')
        .in('id_uuid', idsUnicos);
      
      if (!error && usuarios) {
        const creadoresMap = usuarios.reduce((acc, user) => {
          acc[user.id_uuid] = user.Nombre;
          return acc;
        }, {});
        setCreadoresTareas(creadoresMap);
      }
    };
  
    obtenerNombresCreadores();
  }, [pedido.tareas]);


  // Configuración de estilos según estado
  const estado = pedido.estado?.toLowerCase() || "en espera";
  const colores = {
    "en proceso": { borde: "border-primary", texto: "text-primary" },
    "en espera": { borde: "border-warning", texto: "text-warning" },
    "resuelto": { borde: "border-success", texto: "text-success" },
  };
  const { borde, texto } = colores[estado] || { borde: "border-secondary", texto: "text-secondary" };


  // Estilo para tarjeta seleccionada
  const isPedidoSelected = selectedPedidoId === pedido.id;
  const cardStyle = {
    borderWidth: "2px",
    cursor: "pointer",
    backgroundColor: isPedidoSelected ? "rgba(13, 110, 253, 0.2)" : "transparent"
  };

  // Manejadores de eventos
  const handlePedidoClick = () => {
    if (!selectedTareaId) {
      onSelectPedido(pedido.id);
    }
  };

  const handleTareaClick = (tareaId, e) => {
    e.stopPropagation();
    onSelectTarea(pedido.id, tareaId);
  };

  const toggleTareas = (e) => {
    e.stopPropagation();
    setShowTareas(!showTareas);
  };

 
  return (
    <div className="col-md-4 mb-3" key={`pedido-${pedido.id}-${localRefresh}`}>
      <div 
        className={`card text-white ${borde}`} 
        style={cardStyle}
        onClick={handlePedidoClick}
      >
        <div className="card-body d-flex flex-column">
          <h5 className="card-title text-center fw-bold">{pedido.problema}</h5>
          
          <hr style={{ borderTop: "1.5px solid white", opacity: 1 }} />
          <h6 className="card-title mb-0 me-2 fw-bold">Puesto: {pedido.puesto}</h6>
  
          {/* Lista de tareas con accordion */}
          {pedido.tareas?.length > 0 && (
            <div className="mb-3">
              <div 
                className="d-flex align-items-center mb-2 cursor-pointer"
                onClick={toggleTareas}
              >
                <h6 className="fw-bold mb-0 me-2">Tareas</h6>
                <span className="badge rounded-pill top-0 start-100 translate-center bg-secondary">{pedido.tareas.length}</span>
                <div className="ms-auto">
                <i className={`bi bi-chevron-${showTareas ? 'up' : 'down'}`}></i>
              </div>
              </div>
              {showTareas && (
                <ul className="list-unstyled">
                  {[...pedido.tareas]
                    .sort((a, b) => new Date(b.transcurrido) - new Date(a.transcurrido))
                    .map(tarea => {
                      const isTareaSelected = selectedTareaId === tarea.id;
                      
                      return (
                        <li 
                          key={tarea.id} 
                          className={`mb-2 p-2 rounded ${isTareaSelected ? 'bg-primary' : ''}`}
                          onClick={(e) => handleTareaClick(tarea.id, e)}
                        >
                        {/* Línea superior - Hora, Badge y Creador */}
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center">
                            <span className="fw-bold me-2">
                              {tarea.transcurrido?.slice(11, 16) || '--:--'}
                            </span>
                            <span 
                              className={`badge ${
                                tarea.completada ? 'bg-success' : 
                                tarea.estado === 'En proceso' ? 'bg-primary' : 'bg-warning' 
                                
                              }`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {tarea.tiempo_desde_ultimo}
                            </span>
                          </div>
                          <small className="fw-semibold">
                            {creadoresTareas[tarea.id_uuid] || 'Cargando...'}
                          </small>
                        </div>
                        
                        {/* Línea inferior - Descripción */}
                        <div 
                          style={{ 
                            opacity: tarea.completada ? 0.7 : 1,
                            wordBreak: 'break-word'
                          }}
                        >
                          {tarea.descripcion}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
  
          {/* Información del pedido */}
          <div className="card-text small d-flex justify-content-between">
            <div style={{ minWidth: "50%" }}>
              <strong>Fecha:</strong> {pedido.created_at?.slice(0, 10) || "----/--/--"}<br />
              <strong>Hora:</strong> {pedido.created_at?.slice(11, 16) || "--:--"}<br />
              <strong>Generó:</strong> {usuario?.nombre || "N/A"}<br />
            </div>
            <div style={{ minWidth: "45%" }}>
              <strong>Sector:</strong> {obtenerNombreSector(pedido.sector_id)} <br />
              <strong>Solicitó:</strong> {pedido.solicito || "N/A"} <br />
              <div>
                <span className="small">
                  <strong>
                    {pedido.created_at 
                      ? calcularTiempoTranscurrido(pedido.created_at)
                      : "No disponible"}
                  </strong><br />
                </span>
              </div>
            </div>
          </div>
          
          {/* Estado del pedido */}
          <div className="mt-auto">
            <span className={`fw-bold ${texto}`}>{pedido.estado || "En espera"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default TarjetaPedidos;