import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import dayjs from 'dayjs';
import { toast } from 'react-toastify';
import { useDispatch, useSelector } from 'react-redux';
import { crearProyectoYRegistro } from '../features/proyectos/proyectosThunks';
import { resetEstadoProyecto } from '../features/proyectos/proyectosSlice';


const ModalProyectos = ({ show, onClose, usuario, sectores }) => {
    const [nombre, setNombre] = useState('');
    const [objetivos, setObjetivos] = useState('');
    const [sectorId, setSectorId] = useState('');
    const [fechaVencimiento, setFechaVencimiento] = useState(dayjs().format('YYYY-MM-DD'));
    const [fases, setFases] = useState([]);
    const modalRef = useRef(null);
    const modalInstance = useRef(null);
    const dispatch = useDispatch();
    const { loading, success, error } = useSelector(state => state.proyectos);
    const [usuarios, setUsuarios] = useState([]);
    const [busquedaUsuario, setBusquedaUsuario] = useState('');

    useEffect(() => {
        modalInstance.current = new bootstrap.Modal(modalRef.current, { backdrop: 'static' });
    }, []);


    useEffect(() => {
        if (success) {
            toast.success("Proyecto creado correctamente");
            dispatch(resetEstadoProyecto());
            //onClose();
            handleClose();
        }
    }, [success]);

    useEffect(() => {
  const cargarUsuarios = async () => {
    const { data, error } = await supabase
      .from('usuarios')
      .select('id_uuid, Nombre, email');
    if (!error && data) {
      setUsuarios(data.map(u => ({
        id: u.id_uuid,
        nombre: u.Nombre,
        email: u.email
      })));
    }
  };
  cargarUsuarios();
}, []);

    useEffect(() => {
        if (show) modalInstance.current.show();
        else modalInstance.current.hide();
    }, [show]);

    const agregarFase = () => {
        setFases(prev => [...prev, { nombre: '', tareas: [] }]);
    };

    const agregarTareaAFase = (faseIndex) => {
        const nuevasFases = [...fases];
        nuevasFases[faseIndex].tareas.push({
        descripcion: '',
        usuarios: [],
        fecha: dayjs().format('YYYY-MM-DD'),
        hora: '12:00'
        });
        setFases(nuevasFases);
    };

    const actualizarFase = (i, key, value) => {
        const nuevasFases = [...fases];
        nuevasFases[i][key] = value;
        setFases(nuevasFases);
    };

    const actualizarTarea = (faseIndex, tareaIndex, key, value) => {
        const nuevasFases = [...fases];
        nuevasFases[faseIndex].tareas[tareaIndex][key] = value;
        setFases(nuevasFases);
    };

    const guardarProyecto = () => {
        const payload = {
            nombre,
            objetivos,
            vencimiento: fechaVencimiento,
            sector_id: sectorId,
            id_uuid: usuario?.id,
            fases
        };
        dispatch(crearProyectoYRegistro(payload));
    };

const handleClose = () => {
  if (document.activeElement) document.activeElement.blur(); // Evita foco dentro de modal oculto

  if (modalInstance.current) modalInstance.current.hide();

  // Limpiar backdrop y clases
  const backdrops = document.getElementsByClassName('modal-backdrop');
  Array.from(backdrops).forEach(b => b.remove());
  document.body.style.overflow = 'auto';
  document.body.style.paddingRight = '0';
  document.body.classList.remove('modal-open');

  dispatch(resetEstadoProyecto()); // Limpia Redux
  onClose(); // Cierra visualmente
};

    return (
        <div ref={modalRef} className="modal fade" tabIndex="-1" >
            <div className="modal-dialog modal-xl">
                <div className="modal-content bg-dark text-white">
                    <div className="modal-header">
                        <h5 className="modal-title">Nuevo Proyecto</h5>
                        <button className="btn-close btn-close-white" onClick={handleClose}></button>
                    </div>
                    <div className="modal-body">
                        {error && <div className="alert alert-danger">{error}</div>}
                        {loading && <div className="text-secondary mb-2">Guardando...</div>}
                        <input className="form-control mb-2" placeholder="Nombre del proyecto" value={nombre} onChange={e => setNombre(e.target.value)} />
                        <textarea className="form-control mb-2" placeholder="Objetivos" rows={2} value={objetivos} onChange={e => setObjetivos(e.target.value)} />
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label>Vencimiento</label>
                                <input type="date" className="form-control" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} />
                            </div>
                            <div className="col-md-6">
                                <label>Sector</label>
                                <select className="form-select" value={sectorId} onChange={e => setSectorId(e.target.value)}>
                                    <option value="">Seleccionar</option>
                                    {sectores.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {fases.map((fase, i) => (
                            <div key={i} className="border p-3 mb-3">
                                <h6>Fase {i + 1}</h6>
                                <input
                                    className="form-control mb-2"
                                    placeholder="Nombre de la fase"
                                    value={fase.nombre}
                                    onChange={e => actualizarFase(i, 'nombre', e.target.value)}
                                />
                                {fase.tareas.map((tarea, j) => (
                                    <div key={j} className="border p-2 mb-2">
                                        <input
                                            className="form-control mb-1"
                                            placeholder="Descripción"
                                            value={tarea.descripcion}
                                            onChange={e => actualizarTarea(i, j, 'descripcion', e.target.value)}
                                        />
                                        <div className="d-flex gap-2">
                                            <input type="date" className="form-control" value={tarea.fecha} onChange={e => actualizarTarea(i, j, 'fecha', e.target.value)} />
                                            <input type="time" className="form-control" value={tarea.hora} onChange={e => actualizarTarea(i, j, 'hora', e.target.value)} />
                                            <div className="mt-2">
                                                <label className="form-label">Asignar a:</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-secondary text-white border-dark mb-2"
                                                    placeholder="Buscar usuarios..."
                                                    value={busquedaUsuario}
                                                    onChange={(e) => setBusquedaUsuario(e.target.value)}
                                                />

                                                {busquedaUsuario && (
                                                    <div className="list-group mb-2">
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
                                                                    onClick={() => {
                                                                        const yaAsignado = tarea.usuarios?.some(u => u.id === usuario.id);
                                                                        if (!yaAsignado) {
                                                                            actualizarTarea(i, j, 'usuarios', [...(tarea.usuarios || []), usuario]);
                                                                        }
                                                                        setBusquedaUsuario('');
                                                                    }}
                                                                >
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
                                        {/* Aquí podrías agregar búsqueda de usuarios si lo deseas */}
                                    </div>
                                ))}
                                <button className="btn btn-outline-light mt-2" onClick={() => agregarTareaAFase(i)}>
                                    <i className="bi bi-plus-circle"></i> Agregar tarea
                                </button>
                            </div>
                        ))}
                        <button className="btn btn-outline-light" onClick={agregarFase}>
                            <i className="bi bi-plus-circle"></i> Agregar fase
                        </button>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={guardarProyecto}>Guardar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalProyectos;
