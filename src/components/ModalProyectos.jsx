import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { crearProyectoYRegistro } from '../features/proyectos/proyectosThunks';
import { resetEstadoProyecto } from '../features/proyectos/proyectosSlice';

const ModalProyectos = ({ show, onClose, usuario, sectores, proyectoEditando = null }) => {
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
  const { loading, success } = useSelector(state => state.proyectos);

  const esReducido = proyectoEditando?.tipo === 'proyecto' || proyectoEditando?.tipo === 'etapa';

  useEffect(() => {
    modalInstance.current = new bootstrap.Modal(modalRef.current, { backdrop: 'static' });
  }, []);

  useEffect(() => {
    if (success) handleClose();
  }, [success]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      const { data } = await supabase.from('usuarios').select('id_uuid, Nombre, email');
      if (data) setUsuarios(data.map(u => ({ id: u.id_uuid, nombre: u.Nombre, email: u.email })));
    };
    cargarUsuarios();
  }, []);

  useEffect(() => {
    show ? modalInstance.current.show() : modalInstance.current.hide();
  }, [show]);

  const handleClose = () => {
    modalInstance.current?.hide();
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
      <div className="modal-dialog modal-lg">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title">
              {esReducido ? 'Editar ' + proyectoEditando?.tipo : 'Nuevo Proyecto'}
            </h5>
            <button className="btn-close btn-close-white" onClick={handleClose}></button>
          </div>

          <div className="modal-body">
            <label>Nombre</label>
            <input
              className={`form-control mb-2 bg-secondary text-white border-dark ${errores.nombre ? 'is-invalid' : ''}`}
              value={nombre}
              onChange={e => setNombre(e.target.value)}
            />

            {!esReducido && (
              <>
                <label>Objetivos</label>
                <textarea
                  className={`form-control mb-2 bg-secondary text-white border-dark ${errores.objetivos ? 'is-invalid' : ''}`}
                  rows={2}
                  value={objetivos}
                  onChange={e => setObjetivos(e.target.value)}
                />

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label>Vencimiento</label>
                    <input
                      type="date"
                      className="form-control bg-secondary text-white border-dark"
                      value={fechaVencimiento}
                      onChange={e => setFechaVencimiento(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label>Sector</label>
                    <select
                      className={`form-select bg-secondary text-white border-dark ${errores.sectorId ? 'is-invalid' : ''}`}
                      value={sectorId}
                      onChange={e => setSectorId(e.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {sectores.map(s => (
                        <option key={s.id} value={s.id}>{s.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {!esReducido && (
              <button className="btn btn-outline-light w-100" onClick={() => {
                setEtapas(prev => [...prev, { nombre: '', tareas: [] }]);
              }}>Agregar etapa</button>
            )}

            {etapas.map((etapa, i) => (
              <div key={i} className="border border-light rounded p-2 mb-2">
                <input
                  className={`form-control bg-secondary text-white border-dark mb-2 ${errores[`etapa-${i}`] ? 'is-invalid' : ''}`}
                  value={etapa.nombre}
                  onChange={e => {
                    const nuevas = [...etapas];
                    nuevas[i].nombre = e.target.value;
                    setEtapas(nuevas);
                  }}
                />
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={handleClose}>Cancelar</button>
            <button className="btn btn-primary">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProyectos;