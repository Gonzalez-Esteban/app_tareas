import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';

const ModalTareas = ({ 
  pedido, 
  onClose,
  usuario
}) => {
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState({
    descripcion: '',
    completada: false
  });

  // Cargar tareas existentes
  useEffect(() => {
    const cargarTareas = async () => {
      if (!pedido?.id) return;
      
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .eq('id', pedido.id);
      
      if (error) {
        console.error('Error cargando tareas:', error);
      } else {
        setTareas(data || []);
      }
    };
    
    cargarTareas();
  }, [pedido]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaTarea(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const agregarTarea = async () => {
    if (!nuevaTarea.descripcion.trim()) return;
    
    const { data, error } = await supabase
      .from('tareas')
      .insert([{
        descripcion: nuevaTarea.descripcion,
        id_pedido: pedido.id,
        id_uuid: usuario.id,
        completada: false
      }]);
    
    if (error) {
      console.error('Error agregando tarea:', error);
    } else {
      setTareas(prev => [...prev, ...data]);
      setNuevaTarea({ descripcion: '', completada: false });
    }
  };

  const toggleCompletada = async (tareaId, estadoActual) => {
    const { error } = await supabase
      .from('tareas')
      .update({ completada: !estadoActual })
      .eq('id', tareaId);
    
    if (error) {
      console.error('Error actualizando tarea:', error);
    } else {
      setTareas(prev => prev.map(t => 
        t.id === tareaId ? { ...t, completada: !estadoActual } : t
      ));
    }
  };

  return (
    <div className="modal fade" id="modalTareas" tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title">
              Tareas realizada: {pedido?.problema || ''}
            </h5>
            <button 
              className="btn-close btn-close-white" 
              data-bs-dismiss="modal"
              onClick={onClose}
            ></button>
          </div>
          
          <div className="modal-body">
            <div className="mb-4">
              <h6>Agregar nueva tarea:</h6>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control bg-secondary text-white border-dark"
                  placeholder="Descripción de la tarea"
                  name="descripcion"
                  value={nuevaTarea.descripcion}
                  onChange={handleInputChange}
                />
                <button 
                  className="btn btn-primary"
                  onClick={agregarTarea}
                >
                  <i className="bi bi-plus-lg"></i> Agregar
                </button>
              </div>
            </div>
            
            <hr className="border-secondary" />
            
            <h6>Tareas existentes:</h6>
            {tareas.length === 0 ? (
              <div className="alert alert-secondary">
                No hay tareas registradas para este pedido
              </div>
            ) : (
              <ul className="list-group">
                {tareas.map(tarea => (
                  <li 
                    key={tarea.id} 
                    className="list-group-item bg-secondary text-white d-flex justify-content-between align-items-center"
                  >
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={tarea.completada}
                        onChange={() => toggleCompletada(tarea.id, tarea.completada)}
                        id={`tarea-${tarea.id}`}
                      />
                      <label 
                        className={`form-check-label ${tarea.completada ? 'text-decoration-line-through' : ''}`}
                        htmlFor={`tarea-${tarea.id}`}
                      >
                        {tarea.descripcion}
                      </label>
                    </div>
                    <small className="text-muted">
                      {new Date(tarea.created_at).toLocaleString()}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              data-bs-dismiss="modal"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalTareas;