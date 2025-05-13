import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import 'bootstrap/dist/css/bootstrap.min.css';
import { calcularTiempoTranscurrido } from '../utils/utilities';

dayjs.extend(duration);

const ModalTareas = ({ 
  showModal,
  pedido, 
  tarea: tareaExistente, 
  onClose, 
  onTareaGuardada,
  cambiarEstadoPedido 
}) => {
  const [descripcion, setDescripcion] = useState('');
  const [numeroPuesto, setNumeroPuesto] = useState('');
  const [abreviaturaSector, setAbreviaturaSector] = useState('');
  const [tiempoTranscurrido, setTiempoTranscurrido] = useState('');
  const [sectores, setSectores] = useState([]);
  const [cargandoSectores, setCargandoSectores] = useState(true);
  const modalRef = useRef(null);
  const modalInstance = useRef(null);

  // Obtener sectores con sus abreviaturas al cargar el componente
  useEffect(() => {
    const obtenerSectores = async () => {
      try {
        const { data, error } = await supabase
          .from('sectores')
          .select('id, nombre, abrev');
        
        if (error) throw error;
        
        setSectores(data || []);
      } catch (error) {
        console.error("Error obteniendo sectores:", error);
        toast.error("Error al cargar sectores");
      } finally {
        setCargandoSectores(false);
      }
    };
    
    obtenerSectores();
  }, []);

  // Función para obtener abreviatura del sector desde el pedido
  const obtenerAbreviaturaSector = () => {
    if (!pedido?.sector_id || cargandoSectores) return 'GEN';
    
    const sectorEncontrado = sectores.find(s => s.id === pedido.sector_id);
    return sectorEncontrado?.abrev || 'GEN';
  };

  // Inicialización del modal y datos del puesto
  useEffect(() => {
    if (!modalRef.current) return;

    if (!modalInstance.current) {
      modalInstance.current = new bootstrap.Modal(modalRef.current, {
        backdrop: 'static'
      });
    }

    if (showModal) {
      modalInstance.current.show();
      // Inicializar datos cuando se muestra el modal
      inicializarDatos();
    } else {
      modalInstance.current.hide();
      cleanUpModal();
    }
  }, [showModal]);

  const inicializarDatos = async () => {
    try {
      // Inicializar descripción
      if (tareaExistente) {
        setDescripcion(tareaExistente.descripcion);
      } else {
        setDescripcion('');
        const tiempoCalculado = await calcularTiempoDesdeUltimaTarea();
        setTiempoTranscurrido(tiempoCalculado);
      }

      // Inicializar datos del puesto
      const abreviatura = obtenerAbreviaturaSector();
      setAbreviaturaSector(abreviatura);

      // Si el pedido ya tiene puesto, extraer el número
      if (pedido?.puesto) {
        const partes = pedido.puesto.split('-');
        if (partes.length > 1) {
          setNumeroPuesto(partes[1]);
        } else {
          setNumeroPuesto('');
        }
      } else {
        setNumeroPuesto('');
      }
    } catch (error) {
      console.error("Error inicializando datos:", error);
      setTiempoTranscurrido('0m');
    }
  };

  const cleanUpModal = () => {
    const backdrops = document.getElementsByClassName('modal-backdrop');
    Array.from(backdrops).forEach(backdrop => backdrop.remove());
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0';
    document.body.classList.remove('modal-open');
  };

  const calcularTiempoDesdeUltimaTarea = async () => {
    if (!pedido?.id) return "0m";
    
    try {
      const { data: tareas } = await supabase
        .from('tareas')
        .select('transcurrido')
        .eq('id_pedido', pedido.id)
        .order('transcurrido', { ascending: false });
  
      let referencia;
      
      if (tareas && tareas.length > 0) {
        referencia = tareas[0].transcurrido;
      } else {
        referencia = pedido.created_at;
      }
  
      const ahora = dayjs();
      const creacion = dayjs(referencia);
      if (!creacion.isValid()) return "0m";
      
      const diff = dayjs.duration(ahora.diff(creacion));
      
      if (diff.asDays() >= 1) return `${Math.floor(diff.asDays())}d`;
      if (diff.asHours() >= 1) return `${Math.floor(diff.asHours())}h`;
      return `${Math.floor(diff.asMinutes())}m`;
    } catch (error) {
      console.error('Error calculando tiempo:', error);
      return '0m';
    }
  };
  
  const handleClose = () => {
    if (document.activeElement) {
      document.activeElement.blur();
    }
  
    if (modalInstance.current) {
      modalInstance.current.hide();
    }
    cleanUpModal();
    onClose();
  };

 const guardarTarea = async (estado) => {
  if (!descripcion.trim()) {
    toast.error('La descripción no puede estar vacía');
    return;
  }

  if (numeroPuesto && !/^\d{1,2}$/.test(numeroPuesto)) {
    toast.error('El número de puesto debe tener máximo 2 cifras');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    // Crear valor de puesto completo (ej: "SOP-12")
    const puestoCompleto = `${abreviaturaSector}${numeroPuesto ? `-${numeroPuesto}` : ''}`;
    const ahora = new Date();
    const timestamp = ahora.toISOString();

    // 1. Actualizar el pedido con el puesto y estado
    if (pedido?.id) {
      const updateData = { 
        puesto: puestoCompleto,
        estado
      };

      // Si se está marcando como resuelto, actualizar campos adicionales
      if (estado === 'Resuelto') {
        // Calcular el tiempo transcurrido sin "Hace"
        const tiempoTotal = calcularTiempoTranscurrido(pedido.created_at) 
        const tiempoTranscurridoFormateado = tiempoTotal.replace('Hace ', '');
        
        updateData.finalizacion = timestamp;
        updateData.transcurrido = tiempoTranscurridoFormateado;
        updateData.solucion = descripcion;
        updateData.resolvio = user.id || user.email; // Ajusta según cómo tengas el nombre del usuario
      }

      const { error: errorPedido } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedido.id);
      
      if (errorPedido) throw errorPedido;
    }

    // 2. Guardar/actualizar la tarea
    const tareaData = {
      descripcion,
      completada: estado === 'Resuelto'
    };

    if (tareaExistente) {
      const { error } = await supabase
        .from('tareas')
        .update(tareaData)
        .eq('id', tareaExistente.id);

      if (error) throw error;
      toast.success('Tarea actualizada');
    } else {
      tareaData.id_pedido = pedido.id;
      tareaData.id_uuid = user.id;
      tareaData.transcurrido = timestamp;
      tareaData.tiempo_desde_ultimo = tiempoTranscurrido || '0m';
      tareaData.puesto = puestoCompleto;
      tareaData.es_prog = false
      
      const { error } = await supabase
        .from('tareas')
        .insert(tareaData);

      if (error) throw error;
      toast.success('Tarea agregada');
    }

    onTareaGuardada();
    handleClose();
  } catch (error) {
    console.error('Error al guardar tarea:', error);
    toast.error(error.message || 'Error al guardar tarea');
  }
};

  const eliminarTarea = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', tareaExistente.id);

      if (error) throw error;

      toast.success('Tarea eliminada');
      onTareaGuardada();
      handleClose();
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      toast.error('Error al eliminar tarea');
    }
  };

  return (
    <div 
      ref={modalRef}
      className="modal fade" 
      id="modalTareas"
      tabIndex="-1"
      aria-labelledby="modalTareasTitle"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title" id="modalTareasTitle">
              {tareaExistente ? "Editar Tarea" : "Agregar Tarea"} - {pedido?.problema || ''}
            </h5>
            <button 
              type="button"
              className="btn-close btn-close-white" 
              onClick={handleClose}
              aria-label="Cerrar"
            ></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              {/* Sección de Puesto */}
              <div className="d-flex align-items-center mb-3">
                <label className="me-2">Puesto:</label>
                {cargandoSectores ? (
                  <div className="spinner-border spinner-border-sm text-secondary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                ) : (
                  <>
                    <span 
                      className="badge bg-secondary d-flex align-items-center justify-content-center" 
                      style={{
                        width: '45px',
                        height: '38px',
                        fontSize: '1rem'
                      }}
                    >
                      {abreviaturaSector}
                    </span>
                    <input
                      type="text"
                      className="form-control bg-secondary text-white border-dark ms-2"
                      style={{
                        width: '45px',
                        height: '38px',
                        textAlign: 'center',
                        fontSize: '1rem'
                      }}
                      placeholder="N°"
                      value={numeroPuesto}
                      onChange={(e) => {
                        if (e.target.value === '' || /^\d{0,2}$/.test(e.target.value)) {
                          setNumeroPuesto(e.target.value);
                        }
                      }}
                      maxLength={2}
                    />
                  </>
                )}
              </div>

              {/* Textarea de descripción */}
              <textarea
                className="form-control bg-secondary text-white border-dark mb-2"
                placeholder="Descripción de la tarea"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
              
              {/* Demora */}
              {!tareaExistente && tiempoTranscurrido && (
                <div className="text-muted small mb-3">Demora: {tiempoTranscurrido}</div>
              )}
              
              {/* Botones de estado */}
              <div className="d-flex gap-2 mb-3">
                <button
                  className="btn btn-primary flex-grow-1"
                  onClick={() => guardarTarea('En proceso')}
                  disabled={!descripcion.trim()}
                >
                  <i className="bi bi-arrow-repeat me-2"></i> En proceso
                </button>
                
                <button
                  className="btn btn-warning flex-grow-1"
                  onClick={() => guardarTarea('En espera')}
                  disabled={!descripcion.trim()}
                >
                  <i className="bi bi-pause me-2"></i> En pausa
                </button>
                
                <button
                  className="btn btn-success flex-grow-1"
                  onClick={() => guardarTarea('Resuelto')}
                  disabled={!descripcion.trim()}
                >
                  <i className="bi bi-check-circle me-2"></i> Resuelto
                </button>
              </div>
              
              {/* Botón de eliminar (solo para edición) */}
              {tareaExistente && (
                <button 
                  className="btn btn-danger w-100"
                  onClick={eliminarTarea}
                >
                  <i className="bi bi-trash me-2"></i> Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTareas;