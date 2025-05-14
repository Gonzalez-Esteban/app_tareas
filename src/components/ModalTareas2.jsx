import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [horaVencimiento, setHoraVencimiento] = useState('');
  const [esRecurrente, setEsRecurrente] = useState(false);
  const [diasRecurrencia, setDiasRecurrencia] = useState(1);
  
  const modalRef = useRef(null);
  const modalInstance = useRef(null);

 
// Obtener sectores y usuarios al cargar el componente
useEffect(() => {
  const obtenerDatosIniciales = async () => {
    try {
      // Obtener sectores
      const { data: sectoresData, error: errorSectores } = await supabase
        .from('sectores')
        .select('id, nombre, abrev');
      
      if (errorSectores) throw errorSectores;
      setSectores(sectoresData || []);

      // Obtener usuarios
      const { data: usuariosData, error: errorUsuarios } = await supabase
        .from('usuarios')
        .select('id_uuid, Nombre, email');

      if (errorUsuarios) throw errorUsuarios;

      // Normalizamos los campos para consistencia interna
      const usuariosNormalizados = usuariosData.map(usuario => ({
        id: usuario.id_uuid,
        nombre: usuario.Nombre,
        email: usuario.email
      }));

      setUsuarios(usuariosNormalizados);
    } catch (error) {
      console.error("Error obteniendo datos:", error);
      toast.error("Error al cargar datos iniciales");
    } finally {
      setCargandoSectores(false);
    }
  };

  obtenerDatosIniciales();
}, []);

// Filtrado optimizado con useMemo
const usuariosFiltrados = useMemo(() => {
  const busqueda = busquedaUsuario.toLowerCase();
  return usuarios.filter(
    usuario =>
      usuario.nombre.toLowerCase().includes(busqueda) ||
      usuario.email.toLowerCase().includes(busqueda)
  );
}, [busquedaUsuario, usuarios]);

// Manejar selección de usuarios
const seleccionarUsuario = (usuario) => {
  if (!usuariosSeleccionados.some(u => u.id === usuario.id)) {
    setUsuariosSeleccionados([...usuariosSeleccionados, usuario]);
    setBusquedaUsuario('');
  }
};

// Eliminar usuario seleccionado
const eliminarUsuario = (id) => {
  setUsuariosSeleccionados(usuariosSeleccionados.filter(u => u.id !== id));
};

// Validar fecha de vencimiento
const validarFechaVencimiento = (fecha) => {
  const fechaSeleccionada = dayjs(fecha);
  const ahora = dayjs();
  return fechaSeleccionada.isAfter(ahora);
};

// Función para guardar la tarea
const guardarTarea = async (estado) => {
  if (!descripcion.trim()) {
    toast.error('La descripción no puede estar vacía');
    return;
  }

  if (numeroPuesto && !/^\d{1,2}$/.test(numeroPuesto)) {
    toast.error('El número de puesto debe tener máximo 2 cifras');
    return;
  }

  if (!esRecurrente && fechaVencimiento && !validarFechaVencimiento(fechaVencimiento)) {
    toast.error('La fecha de vencimiento debe ser futura');
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No autenticado');

    const puestoCompleto = `${abreviaturaSector}${numeroPuesto ? `-${numeroPuesto}` : ''}`;
    const ahora = new Date().toISOString();

    if (pedido?.id) {
      const updateData = {
        puesto: puestoCompleto,
        estado
      };

      if (estado === 'Resuelto') {
        const tiempoTotal = calcularTiempoTranscurrido(pedido.created_at);
        updateData.finalizacion = ahora;
        updateData.transcurrido = tiempoTotal.replace('Hace ', '');
        updateData.solucion = descripcion;
        updateData.resolvio = user.id || user.email;
      }

      const { error: errorPedido } = await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', pedido.id);

      if (errorPedido) throw errorPedido;
    }

    const tareaData = {
      descripcion,
      completada: estado === 'Resuelto',
      es_prog: esRecurrente || !!fechaVencimiento,
      dias_recurrencia: esRecurrente ? diasRecurrencia : null,
      usuarios_asignados: usuariosSeleccionados.map(u => u.id)
    };

    

    if (esRecurrente) {
      tareaData.vencimiento = horaVencimiento
        ? dayjs().format('YYYY-MM-DD') + 'T' + horaVencimiento
        : null;
    } else if (fechaVencimiento) {
      const fechaCompleta = horaVencimiento
        ? `${fechaVencimiento}T${horaVencimiento}`
        : `${fechaVencimiento}T23:59:59`;
      tareaData.vencimiento = fechaCompleta;
    }

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
      tareaData.transcurrido = ahora;
      tareaData.tiempo_desde_ultimo = tiempoTranscurrido || '0m';
      tareaData.puesto = puestoCompleto;

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
      <div className="modal-dialog modal-lg">
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
            {/* Sección de Puesto */}
            <div className="d-flex align-items-center mb-3">
              <label className="me-2">Puesto:</label>
              {cargandoSectores ? (
                <div className="spinner-border spinner-border-sm text-secondary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
              ) : (
                <>
                  <span className="badge bg-secondary d-flex align-items-center justify-content-center"
                    style={{ width: '45px', height: '38px', fontSize: '1rem' }}>
                    {abreviaturaSector}
                  </span>
                  <input
                    type="text"
                    className="form-control bg-secondary text-white border-dark ms-2"
                    style={{ width: '45px', height: '38px', textAlign: 'center', fontSize: '1rem' }}
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
              className="form-control bg-secondary text-white border-dark mb-3"
              placeholder="Descripción de la tarea"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
            />
            
            {/* Buscador de usuarios */}
            <div className="mb-3">
              <label className="form-label">Asignar a:</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control bg-secondary text-white border-dark"
                  placeholder="Buscar usuarios..."
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                />
              </div>
              
              {/* Lista de usuarios filtrados */}
              {busquedaUsuario && (
                <div className="list-group mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {usuariosFiltrados.map(usuario => (
                    <button
                      key={usuario.id}
                      type="button"
                      className="list-group-item list-group-item-action bg-secondary text-white"
                      onClick={() => seleccionarUsuario(usuario)}
                    >
                      {usuario.nombre} ({usuario.email})
                    </button>
                  ))}
                </div>
              )}
              
              {/* Usuarios seleccionados */}
              <div className="d-flex flex-wrap gap-2 mt-2">
                {usuariosSeleccionados.map(usuario => (
                  <span key={usuario.id} className="badge bg-primary d-flex align-items-center">
                    {usuario.nombre}
                    <button 
                      type="button"
                      className="btn-close btn-close-white ms-2"
                      onClick={() => eliminarUsuario(usuario.id)}
                      style={{ fontSize: '0.5rem' }}
                      aria-label="Eliminar"
                    />
                  </span>
                ))}
              </div>
            </div>
            
            {/* Configuración de vencimiento */}
            <div className="mb-3">
  <div className="form-check form-switch">
    <input
      className="form-check-input"
      type="checkbox"
      id="toggleRecurrente"
      checked={esRecurrente}
      onChange={(e) => setEsRecurrente(e.target.checked)}
    />
    <label className="form-check-label" htmlFor="toggleRecurrente">
      Tarea recurrente
    </label>
  </div>

        {esRecurrente ? (
          <div className="mt-2">
            <label>Días entre repeticiones:</label>
            <input
              type="number"
              min="1"
              max="30"
              className="form-control bg-secondary text-white border-dark"
              value={diasRecurrencia}
              onChange={(e) => setDiasRecurrencia(Number(e.target.value))}
            />
            <label className="mt-2">Hora diaria:</label>
            <input
              type="time"
              className="form-control bg-secondary text-white border-dark"
              value={horaVencimiento}
              onChange={(e) => setHoraVencimiento(e.target.value)}
            />
          </div>
        ) : (
          <>
            <label>Fecha de vencimiento:</label>
            <input
              type="date"
              className="form-control bg-secondary text-white border-dark mb-2"
              value={fechaVencimiento}
              onChange={(e) => setFechaVencimiento(e.target.value)}
            />
            <label>Hora:</label>
            <input
              type="time"
              className="form-control bg-secondary text-white border-dark"
              value={horaVencimiento}
              onChange={(e) => setHoraVencimiento(e.target.value)}
                  />
                </>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">Vencimiento:</label>
              
              {!esRecurrente && (
                <div className="row g-2 mb-2">
                  <div className="col-md-6">
                    <input
                      type="date"
                      className="form-control bg-secondary text-white border-dark"
                      value={fechaVencimiento}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      min={dayjs().format('YYYY-MM-DD')}
                    />
                  </div>
                  <div className="col-md-6">
                    <input
                      type="time"
                      className="form-control bg-secondary text-white border-dark"
                      value={horaVencimiento}
                      onChange={(e) => setHoraVencimiento(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {/* Opción recurrente */}
              <div className="form-check form-switch mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="esRecurrente"
                  checked={esRecurrente}
                  onChange={(e) => setEsRecurrente(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="esRecurrente">
                  Repetir tarea periódicamente
                </label>
              </div>
              
              {esRecurrente && (
                <div className="row g-2 align-items-center">
                  <div className="col-auto">
                    <label className="col-form-label">Cada:</label>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="number"
                      className="form-control bg-secondary text-white border-dark"
                      min="1"
                      max="30"
                      value={diasRecurrencia}
                      onChange={(e) => setDiasRecurrencia(parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="col-auto">
                    <label className="col-form-label">días a las</label>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="time"
                      className="form-control bg-secondary text-white border-dark"
                      value={horaVencimiento}
                      onChange={(e) => setHoraVencimiento(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
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
  );
};

export default ModalTareas;