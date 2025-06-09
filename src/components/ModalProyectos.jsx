import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { crearProyectoYRegistro } from '../features/proyectos/proyectosThunks';
import { resetEstadoProyecto } from '../features/proyectos/proyectosSlice';

const ModalProyectos = ({ show, onClose, usuario, sectores }) => {
  const [nombre, setNombre] = useState('');
  const [objetivos, setObjetivos] = useState('');
  const [sectorId, setSectorId] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState(dayjs().format('YYYY-MM-DD'));
  const [etapas, setEtapas] = useState([]);
  const [errores, setErrores] = useState({});
  const [usuarios, setUsuarios] = useState([]);
  const modalRef = useRef(null);
  const modalInstance = useRef(null);
  const dispatch = useDispatch();
  const { loading, success, error } = useSelector(state => state.proyectos);

  useEffect(() => {
    modalInstance.current = new bootstrap.Modal(modalRef.current, { backdrop: 'static' });
  }, []);

  useEffect(() => {
    if (success) {
      handleClose();
    }
  }, [success]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const { data } = await supabase.from('usuarios').select('id_uuid, Nombre, email');
      if (data) {
        setUsuarios(data.map(u => ({ id: u.id_uuid, nombre: u.Nombre, email: u.email })));
      }
    };
    cargarUsuarios();
  }, []);

  useEffect(() => {
    show ? modalInstance.current.show() : modalInstance.current.hide();
  }, [show]);

  const agregarEtapa = () => {
    setEtapas(prev => [...prev, { nombre: '', tareas: [] }]);
  };

  const eliminarEtapa = (i) => {
    const nuevas = [...etapas];
    nuevas.splice(i, 1);
    setEtapas(nuevas);
  };

  const agregarTareaAEtapa = (i) => {
    const nuevas = [...etapas];
    nuevas[i].tareas.push({
      descripcion: '',
      usuarios: [],
      fecha: dayjs().format('YYYY-MM-DD'),
      hora: '12:00',
      busqueda: ''
    });
    setEtapas(nuevas);
  };

  const eliminarTarea = (i, j) => {
    const nuevas = [...etapas];
    nuevas[i].tareas.splice(j, 1);
    setEtapas(nuevas);
  };

  const actualizarEtapa = (i, key, value) => {
    const nuevas = [...etapas];
    nuevas[i][key] = value;
    setEtapas(nuevas);

    if (errores[`etapa-${i}`]) {
      const nuevosErrores = { ...errores };
      delete nuevosErrores[`etapa-${i}`];
      setErrores(nuevosErrores);
    }
  };

  const actualizarTarea = (i, j, key, value) => {
    const nuevas = [...etapas];
    nuevas[i].tareas[j][key] = value;
    setEtapas(nuevas);

    const claves = [
      `tarea-${i}-${j}`,
      `usuarios-${i}-${j}`
    ];
    if (claves.includes(`tarea-${i}-${j}`) && key === 'descripcion' && value.trim()) {
      const nuevosErrores = { ...errores };
      delete nuevosErrores[`tarea-${i}-${j}`];
      setErrores(nuevosErrores);
    }
    if (claves.includes(`usuarios-${i}-${j}`) && key === 'usuarios' && value.length > 0) {
      const nuevosErrores = { ...errores };
      delete nuevosErrores[`usuarios-${i}-${j}`];
      setErrores(nuevosErrores);
    }
  };

  const validarCampos = () => {
    const nuevosErrores = {};
    if (!nombre.trim()) nuevosErrores.nombre = true;
    if (!objetivos.trim()) nuevosErrores.objetivos = true;
    if (!sectorId) nuevosErrores.sectorId = true;

    etapas.forEach((etapa, i) => {
      if (!etapa.nombre.trim()) nuevosErrores[`etapa-${i}`] = true;
      etapa.tareas.forEach((tarea, j) => {
        if (!tarea.descripcion.trim()) nuevosErrores[`tarea-${i}-${j}`] = true;
        if (!tarea.usuarios || tarea.usuarios.length === 0) nuevosErrores[`usuarios-${i}-${j}`] = true;
      });
    });

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardarProyecto = () => {
    if (!validarCampos()) return;

    const payload = {
      nombre,
      objetivos,
      vencimiento: fechaVencimiento,
      sector_id: sectorId,
      id_uuid: usuario?.id,
      etapas
    };
    dispatch(crearProyectoYRegistro(payload));
  };

  const handleClose = () => {
    if (document.activeElement) document.activeElement.blur();
    if (modalInstance.current) modalInstance.current.hide();

    const backdrops = document.getElementsByClassName('modal-backdrop');
    Array.from(backdrops).forEach(b => b.remove());
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0';
    document.body.classList.remove('modal-open');

    setNombre('');
    setObjetivos('');
    setSectorId('');
    setFechaVencimiento(dayjs().format('YYYY-MM-DD'));
    setEtapas([]);
    setErrores({});
    dispatch(resetEstadoProyecto());
    onClose();
  };

  return (
    <div ref={modalRef} className="modal fade" tabIndex="-1">
      <div className="modal-dialog modal-xl">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title">Nuevo Proyecto</h5>
            <button className="btn-close btn-close-white" onClick={handleClose}></button>
          </div>
          <div className="modal-body">
            <label>Nombre</label>
            <input className={`form-control mb-2 bg-secondary text-white border-dark ${errores.nombre ? 'is-invalid' : ''}`} value={nombre} onChange={e => { setNombre(e.target.value); if (errores.nombre && e.target.value.trim()) setErrores(prev => { const e = { ...prev }; delete e.nombre; return e; }); }} />

            <label>Objetivos</label>
            <textarea className={`form-control mb-2 bg-secondary text-white border-dark ${errores.objetivos ? 'is-invalid' : ''}`} rows={2} value={objetivos} onChange={e => { setObjetivos(e.target.value); if (errores.objetivos && e.target.value.trim()) setErrores(prev => { const e = { ...prev }; delete e.objetivos; return e; }); }} />

            <div className="row mb-3">
              <div className="col-md-6">
                <label>Vencimiento</label>
                <input type="date" className="form-control bg-secondary text-white border-dark" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} />
              </div>
              <div className="col-md-6">
                <label>Sector</label>
                <select className={`form-select bg-secondary text-white border-dark ${errores.sectorId ? 'is-invalid' : ''}`} value={sectorId} onChange={e => { setSectorId(e.target.value); if (errores.sectorId && e.target.value) setErrores(prev => { const e = { ...prev }; delete e.sectorId; return e; }); }}>
                  <option value="">Seleccionar</option>
                  {sectores.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
            </div>

            {etapas.map((etapa, i) => (
              <div key={i} className="border p-3 mb-3">
                <div className="d-flex justify-content-between mt-2">
                <h6>Etapa {i + 1}</h6>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                <input className={`form-control bg-secondary text-white border-dark mb-2 ${errores[`etapa-${i}`] ? 'is-invalid' : ''}`} value={etapa.nombre} onChange={e => actualizarEtapa(i, 'nombre', e.target.value)} />
                <button className="btn btn-outline-light mb-2 ms-2" onClick={() => eliminarEtapa(i)}>
                    <i className="bi bi-trash"></i> 
                  </button>
                </div>
                {etapa.tareas.map((tarea, j) => (
                  <div key={j} className="border p-2 mb-2">
                    <input
                      className={`form-control mb-2 bg-secondary text-white border-dark ${errores[`tarea-${i}-${j}`] ? 'is-invalid' : ''}`}
                      placeholder="Descripción"
                      value={tarea.descripcion}
                      onChange={e => actualizarTarea(i, j, 'descripcion', e.target.value)}
                    />

                    <div className="row mb-2">
                      <div className="col-md-4">
                        <label>Fecha</label>
                        <input type="date" className="form-control" value={tarea.fecha} onChange={e => actualizarTarea(i, j, 'fecha', e.target.value)} />
                      </div>
                      <div className="col-md-4">
                        <label>Hora</label>
                        <input type="time" className="form-control" value={tarea.hora} onChange={e => actualizarTarea(i, j, 'hora', e.target.value)} />
                      </div>
                      <div className="col-md-4">
                        <label>Asignar a</label>
                        <input
                          type="text"
                          className={`form-control bg-secondary text-white border-dark ${errores[`usuarios-${i}-${j}`] ? 'is-invalid' : ''}`}
                          placeholder="Buscar usuarios..."
                          value={tarea.busqueda}
                          onChange={e => actualizarTarea(i, j, 'busqueda', e.target.value)}
                        />
                        {tarea.busqueda && (
                          <div className="list-group mb-2">
                            {usuarios
                              .filter(u => u.nombre.toLowerCase().includes(tarea.busqueda.toLowerCase()) || u.email.toLowerCase().includes(tarea.busqueda.toLowerCase()))
                              .map(usuario => (
                                <button key={usuario.id} type="button" className="list-group-item list-group-item-action bg-secondary text-white"
                                  onClick={() => {
                                    const yaAsignado = tarea.usuarios?.some(u => u.id === usuario.id);
                                    if (!yaAsignado) {
                                      actualizarTarea(i, j, 'usuarios', [...(tarea.usuarios || []), usuario]);
                                    }
                                    actualizarTarea(i, j, 'busqueda', '');
                                  }}>
                                  {usuario.nombre} ({usuario.email})
                                </button>
                              ))}
                          </div>
                        )}

                        <div className="d-flex flex-wrap gap-2">
                          {(tarea.usuarios || []).map(usuario => (
                            <span key={usuario.id} className="badge bg-primary d-flex align-items-center">
                              {usuario.nombre}
                              <button
                                type="button"
                                className="btn-close btn-close-white ms-2"
                                style={{ fontSize: '0.5rem' }}
                                onClick={() => {
                                  const nuevos = tarea.usuarios.filter(u => u.id !== usuario.id);
                                  actualizarTarea(i, j, 'usuarios', nuevos);
                                }}
                              />
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-danger" onClick={() => eliminarTarea(i, j)}>
                      <i className="bi bi-x-circle"></i> Eliminar tarea
                    </button>
                  </div>
                ))}

                <div className="d-flex justify-content-between mt-2">
                  <button className="btn btn-outline-light" onClick={() => agregarTareaAEtapa(i)}>
                    <i className="bi bi-plus-circle"></i> Tarea
                  </button>

                </div>
              </div>
            ))}

            <button className="btn btn-outline-light" onClick={agregarEtapa}>
              <i className="bi bi-plus-circle"></i> Etapa
            </button>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={guardarProyecto}>Guardar</button>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}
          {loading && <div className="text-secondary mb-2">Guardando...</div>}
        </div>
      </div>
    </div>
  );
};

export default ModalProyectos;
