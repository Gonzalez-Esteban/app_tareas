import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import 'bootstrap/dist/css/bootstrap.min.css';

const ModalTareasProgramadas = forwardRef(({
  showModal,
  onClose,
  onTareaGuardada,
  tarea: tareaExistente
}, ref) => {
  const [descripcion, setDescripcion] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [horaVencimiento, setHoraVencimiento] = useState('09:00');
  const [diasRecurrencia, setDiasRecurrencia] = useState(1);
  const [fechaVencimiento, setFechaVencimiento] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [esRecurrente, setEsRecurrente] = useState(true);
  const modalRef = useRef(null);
  const modalInstance = useRef(null);

  useImperativeHandle(ref, () => ({
    abrirProgramada: (tarea = null) => {
      if (tarea) {
        // Cargar datos de la tarea existente
        setDescripcion(tarea.descripcion);
        setUsuariosSeleccionados(tarea.usuarios_asignados || []);
        setEsRecurrente(tarea.dias_recurrencia ? true : false);
        
        if (tarea.dias_recurrencia) {
          setDiasRecurrencia(tarea.dias_recurrencia);
          setHoraVencimiento(dayjs(tarea.vencimiento).format('HH:mm'));
        } else {
          setFechaVencimiento(dayjs(tarea.vencimiento).format('YYYY-MM-DD'));
          setHoraVencimiento(dayjs(tarea.vencimiento).format('HH:mm'));
        }
      } else {
        // Resetear para nueva tarea
        setDescripcion('');
        setUsuariosSeleccionados([]);
        setHoraVencimiento(dayjs().add(1, 'hour').format('HH:mm'));
        setDiasRecurrencia(1);
        setFechaVencimiento(dayjs().add(1, 'day').format('YYYY-MM-DD'));
        setEsRecurrente(true);
      }
      
      if (modalInstance.current) {
        modalInstance.current.show();
      }
    }
  }));

  // Cargar usuarios
  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        const { data: usuariosData } = await supabase
          .from('usuarios')
          .select('id_uuid, Nombre, email');
        
        setUsuarios(usuariosData?.map(u => ({
          id: u.id_uuid,
          nombre: u.Nombre,
          email: u.email
        })) || []);
      } catch (error) {
        toast.error("Error al cargar usuarios");
      } finally {
        setCargando(false);
      }
    };

    cargarUsuarios();
  }, []);

  // Inicializar modal
  useEffect(() => {
    if (!modalRef.current) return;

    modalInstance.current = new bootstrap.Modal(modalRef.current, {
      backdrop: 'static'
    });

    return () => {
      if (modalInstance.current) {
        modalInstance.current.dispose();
      }
    };
  }, []);

  // Controlar visibilidad
  useEffect(() => {
    if (!modalInstance.current) return;
    showModal ? modalInstance.current.show() : modalInstance.current.hide();
  }, [showModal]);

  const seleccionarUsuario = (usuario) => {
    if (!usuariosSeleccionados.some(u => u.id === usuario.id)) {
      setUsuariosSeleccionados([...usuariosSeleccionados, usuario]);
      setBusquedaUsuario('');
    }
  };

  const eliminarUsuario = (id) => {
    setUsuariosSeleccionados(usuariosSeleccionados.filter(u => u.id !== id));
  };

  const handleClose = () => {
    modalInstance.current?.hide();
    onClose();
  };

  const guardarTareaProgramada = async () => {
    if (!descripcion.trim()) {
      toast.error('La descripción no puede estar vacía');
      return;
    }

    if (usuariosSeleccionados.length === 0) {
      toast.error('Debes asignar al menos un usuario');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const tareaData = {
        descripcion,
        usuarios_asignados: usuariosSeleccionados.map(u => u.id),
        estado: 'pendiente', // Estado por defecto
      };

      if (esRecurrente) {
        tareaData.dias_recurrencia = diasRecurrencia;
        tareaData.hora_ejecucion = horaVencimiento;
        tareaData.proxima_ejecucion = dayjs().format('YYYY-MM-DD') + 'T' + horaVencimiento;
      } else {
        tareaData.fecha_vencimiento = fechaVencimiento;
        tareaData.hora_vencimiento = horaVencimiento;
        tareaData.vencimiento = `${fechaVencimiento}T${horaVencimiento}:00`;
      }

      if (tareaExistente) {
        // Actualizar tarea existente
        await supabase
          .from('programadas')
          .update(tareaData)
          .eq('id', tareaExistente.id);
        toast.success('Tarea programada actualizada');
      } else {
        // Crear nueva tarea
        tareaData.creado_por = user.id;
        tareaData.fecha_creacion = new Date().toISOString();
        
        await supabase
          .from('programadas')
          .insert(tareaData);
        toast.success('Tarea programada creada');
      }

      onTareaGuardada();
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Error al guardar tarea programada');
    }
  };

  const eliminarTarea = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea programada?')) return;

    try {
      await supabase
        .from('programadas')
        .delete()
        .eq('id', tareaExistente.id);
      
      toast.success('Tarea programada eliminada');
      onTareaGuardada();
      handleClose();
    } catch (error) {
      toast.error('Error al eliminar tarea programada');
    }
  };

  return (
    <div 
      ref={modalRef}
      className="modal fade" 
      id="modalTareasProgramadas"
      tabIndex="-1"
      aria-labelledby="modalTareasProgramadasTitle"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title" id="modalTareasProgramadasTitle">
              {tareaExistente ? "Editar Tarea Programada" : "Nueva Tarea Programada"}
            </h5>
            <button 
              type="button"
              className="btn-close btn-close-white" 
              onClick={handleClose}
              aria-label="Cerrar"
            />
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Descripción:</label>
              <textarea
                className="form-control bg-secondary text-white border-dark"
                placeholder="Describe la tarea programada..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
                required
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Asignar a:</label>
              <div className="input-group mb-2">
                <input
                  type="text"
                  className="form-control bg-secondary text-white border-dark"
                  placeholder="Buscar usuarios..."
                  value={busquedaUsuario}
                  onChange={(e) => setBusquedaUsuario(e.target.value)}
                />
              </div>
              
              {busquedaUsuario && (
                <div className="list-group mb-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {usuarios
                    .filter(u =>
                      u.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
                      u.email.toLowerCase().includes(busquedaUsuario.toLowerCase())
                    )
                    .map(usuario => (
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
              
              <div className="d-flex flex-wrap gap-2">
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

            <div className="mb-3">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="esRecurrenteSwitch"
                  checked={esRecurrente}
                  onChange={() => setEsRecurrente(!esRecurrente)}
                />
                <label className="form-check-label" htmlFor="esRecurrenteSwitch">
                  Repetir tarea
                </label>
              </div>
            </div>

            {esRecurrente ? (
              <div className="mb-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label>Repetir cada (días):</label>
                    <input
                      type="number"
                      className="form-control bg-secondary text-white border-dark"
                      min="1"
                      max="30"
                      value={diasRecurrencia}
                      onChange={(e) => setDiasRecurrencia(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Hora de ejecución:</label>
                    <input
                      type="time"
                      className="form-control bg-secondary text-white border-dark"
                      value={horaVencimiento}
                      onChange={(e) => setHoraVencimiento(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-3">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label>Fecha de vencimiento:</label>
                    <input
                      type="date"
                      className="form-control bg-secondary text-white border-dark"
                      value={fechaVencimiento}
                      min={dayjs().format('YYYY-MM-DD')}
                      onChange={(e) => setFechaVencimiento(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Hora de vencimiento:</label>
                    <input
                      type="time"
                      className="form-control bg-secondary text-white border-dark"
                      value={horaVencimiento}
                      onChange={(e) => setHoraVencimiento(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="d-grid gap-2 mt-4">
              <button
                className="btn btn-primary"
                onClick={guardarTareaProgramada}
                disabled={!descripcion.trim() || cargando || usuariosSeleccionados.length === 0}
              >
                {tareaExistente ? 'Actualizar' : 'Crear'} Tarea Programada
              </button>
            </div>

            {tareaExistente && (
              <button 
                className="btn btn-danger w-100 mt-2"
                onClick={eliminarTarea}
              >
                <i className="bi bi-trash me-2"></i> Eliminar Tarea
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ModalTareasProgramadas;