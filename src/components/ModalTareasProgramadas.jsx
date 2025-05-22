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
  const [horaEjecucion, setHoraEjecucion] = useState(new Date().toTimeString().slice(0, 5));
  const [fechaVencimiento, setFechaVencimiento] = useState(dayjs().format('YYYY-MM-DD'));
  const [tipoRecurrencia, setTipoRecurrencia] = useState('unica');
  const modalRef = useRef(null);
  const modalInstance = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    abrirProgramada: (tarea = null) => {
      if (tarea) {
        // Cargar datos de la tarea existente
        setDescripcion(tarea.descripcion);
        setUsuariosSeleccionados(tarea.usuarios_asignados || []);
        setTipoRecurrencia(tarea.tipo_recurrencia || 'unica');
      
        
        // Parsear fecha y hora
        const fechaHora = dayjs(tarea.fecha_vencimiento);
        setFechaVencimiento(fechaHora.format('YYYY-MM-DD'));
        setHoraEjecucion(tarea.hora_ejecucion || new Date().toTimeString().slice(0, 5));
      } else {
        // Resetear para nueva tarea usando valores actuales
        setDescripcion('');
        setUsuariosSeleccionados([]);
        setTipoRecurrencia('unica');
        // Mantener los valores iniciales que ya tienen la hora y fecha actual
        setHoraEjecucion(new Date().toTimeString().slice(0, 5));
        setFechaVencimiento(dayjs().format('YYYY-MM-DD'));
      }
      
      setModalVisible(true);
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
    setModalVisible(false);
    if (document.activeElement) {
      document.activeElement.blur();
    }
    if (modalInstance.current) {
      modalInstance.current.hide();
    }
    onClose();
  };

  const calcularProximaFecha = (fechaBase) => {
    const fecha = dayjs(fechaBase);
    
    switch(tipoRecurrencia) {
      case 'diaria':
        return fecha.add(1, 'day').toISOString();
      case 'semanal':
        return fecha.add(1, 'week').toISOString();
      case 'mensual':
        return fecha.add(1, 'month').toISOString();
      default:
        return fecha.toISOString();
    }
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
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('No autenticado');

      const fechaHoraCompleta = `${fechaVencimiento}T${horaEjecucion}:00`;
      const proximaEjecucion = tipoRecurrencia === 'unica'
        ? fechaHoraCompleta
        : calcularProximaFecha(fechaHoraCompleta);

      const tareaData = {
        descripcion,
        usuarios_asignados: usuariosSeleccionados.map(u => u.id),
        fecha_vencimiento: fechaHoraCompleta,
        hora_ejecucion: horaEjecucion,
        tipo_recurrencia: tipoRecurrencia === 'unica' ? 'unica' : tipoRecurrencia,
        proxima_ejecucion: proximaEjecucion,
        //dias_recurrencia: tipoRecurrencia === 'diaria' ? diasRecurrencia : null,
        //estado: 'Pendiente',
        activa: true
      };

      let error;
      if (tareaExistente) {
        const { error: updateError } = await supabase
          .from('programadas')
          .update(tareaData)
          .eq('id', tareaExistente.id);
        error = updateError;
        toast.success('Tarea programada actualizada');
      } else {
        tareaData.creado_por = user.id;

        const { error: insertError } = await supabase
          .from('programadas')
          .insert(tareaData); // No hace falta select() si no usas el ID
        error = insertError;
        toast.success('Tarea programada creada');
      }

      if (error) throw error;

      onTareaGuardada();
      handleClose();
    } catch (error) {
      console.error('Error al guardar tarea:', error);
      toast.error(error.message || 'Error al guardar tarea programada');
    }
  };

  const eliminarTarea = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta tarea programada?')) return;

    try {
      // Desactivar en lugar de eliminar
      await supabase
        .from('programadas')
        .update({ activa: false })
        .eq('id', tareaExistente.id);
      
      toast.success('Tarea programada desactivada');
      onTareaGuardada();
      handleClose();
    } catch (error) {
      toast.error('Error al desactivar tarea programada');
    }
  };

  return (
    <div 
      ref={modalRef}
      className="modal fade" 
      id="modalTareasProgramadas"
      tabIndex="-1"
      aria-labelledby="modalTareasProgramadasTitle"
      aria-hidden={!showModal}
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
                  aria-label="Buscar usuarios"
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
                        key={`usuario-${usuario.id}`}
                        type="button"
                        className="list-group-item list-group-item-action bg-secondary text-white"
                        onClick={() => seleccionarUsuario(usuario)}
                        aria-label={`Asignar a ${usuario.nombre}`}
                      >
                        {usuario.nombre} ({usuario.email})
                      </button>
                    ))}
                </div>
              )}
              
              <div className="d-flex flex-wrap gap-2">
                {usuariosSeleccionados.map(usuario => (
                  <span key={`selected-${usuario.id}`} className="badge bg-primary d-flex align-items-center">
                    {usuario.nombre}
                    <button 
                      type="button"
                      className="btn-close btn-close-white ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarUsuario(usuario.id);
                      }}
                      style={{ fontSize: '0.5rem' }}
                      aria-label={`Eliminar ${usuario.nombre}`}
                    />
                  </span>
                ))}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="form-label">Fecha de inicio:</label>
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
                <label className="form-label">Hora de ejecución:</label>
                <input
                  type="time"
                  className="form-control bg-secondary text-white border-dark"
                  value={horaEjecucion}
                  onChange={(e) => setHoraEjecucion(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label">Recurrencia:</label>
              <select
                className="form-select bg-secondary text-white border-dark"
                value={tipoRecurrencia}
                onChange={(e) => setTipoRecurrencia(e.target.value)}
              >
                <option value="unica">Única (no se repite)</option>
                <option value="diaria">Diaria</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

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
                <i className="bi bi-trash me-2"></i> {tareaExistente.activa ? 'Desactivar' : 'Eliminar'} Tarea
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ModalTareasProgramadas;