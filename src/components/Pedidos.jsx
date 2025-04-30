import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { toast } from 'react-toastify';

const Pedidos = ({ 
  pedidoEditando, 
  onClose,
  sectores,
  usuario,
  onGuardarSuccess,
  showModal
}) => {
  const [pedido, setPedido] = useState({
    fecha: '',
    hora: '',
    problema: '',
    solicito: '',
    sector_id: '',
  });

  const modalRef = useRef(null);
  const modalInstance = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPedido(prev => ({ ...prev, [name]: value }));
  };

  // Inicialización del modal
  useEffect(() => {
    if (!modalRef.current) return;

    if (!modalInstance.current) {
      modalInstance.current = new bootstrap.Modal(modalRef.current, {
        backdrop: 'static'
      });
    }

    if (showModal) {
      modalInstance.current.show();
    } else {
      modalInstance.current.hide();
      cleanUpModal();
    }
  }, [showModal]);

  useEffect(() => {
    const now = new Date();
    if (showModal) {
      if (pedidoEditando) {
        setPedido({
          fecha: pedidoEditando.created_at?.slice(0, 10) || now.toISOString().slice(0, 10),
          hora: pedidoEditando.created_at?.slice(11, 16) || now.toTimeString().slice(0, 5),
          problema: pedidoEditando.problema || '',
          solicito: pedidoEditando.solicito || '',
          sector_id: pedidoEditando.sector_id || '',
        });
      } else {
        setPedido({
          fecha: now.toISOString().slice(0, 10),
          hora: now.toTimeString().slice(0, 5),
          problema: '',
          solicito: '',
          sector_id: '',
        });
      }
    }
  }, [showModal, pedidoEditando]);
  const cleanUpModal = () => {
    const backdrops = document.getElementsByClassName('modal-backdrop');
    Array.from(backdrops).forEach(backdrop => backdrop.remove());
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0';
    document.body.classList.remove('modal-open');
  };

  const handleClose = (shouldReset = true) => {
    if (document.activeElement) {
      document.activeElement.blur();
    }

    if (modalInstance.current) {
      modalInstance.current.hide();
      cleanUpModal();
    }

    if (shouldReset && !pedidoEditando) {
      const now = new Date();
      setPedido({
        fecha: now.toISOString().slice(0, 10),
        hora: now.toTimeString().slice(0, 5),
        problema: '',
        solicito: '',
        sector_id: ''
      });
    }

    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación simple por si se salta el required
    if (!pedido.problema || !pedido.solicito || !pedido.sector_id) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuario no autenticado');
        return;
      }

      const pedidoData = {
        problema: pedido.problema,
        solicito: pedido.solicito,
        sector_id: parseInt(pedido.sector_id),
        id_uuid: user.id,
        created_at: `${pedido.fecha}T${pedido.hora}`,
      };

      if (pedidoEditando) {
        await supabase
          .from('pedidos')
          .update(pedidoData)
          .eq('id', pedidoEditando.id);
        toast.success('Pedido actualizado correctamente');
      } else {
        await supabase.from('pedidos').insert([{
          ...pedidoData,
          estado: 'En proceso'
        }]);
        toast.success('Pedido creado correctamente');
      }

      onGuardarSuccess();
      handleClose(false);
    } catch (error) {
      console.error('Error al guardar pedido:', error);
      toast.error(`Error al ${pedidoEditando ? 'actualizar' : 'crear'} pedido`);
    }
  };

  return (
    <div 
      ref={modalRef}
      className="modal fade" 
      id="nuevoPedidoModal" 
      tabIndex="-1"
      aria-labelledby="modalTitle"
      aria-hidden="true"
    >
      <div className="modal-dialog">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title" id="modalTitle">
              {pedidoEditando ? "Editar Pedido" : "Nuevo Pedido"}
            </h5>
            <button 
              type="button"
              className="btn-close btn-close-white" 
              data-bs-dismiss="modal"
              aria-label="Cerrar"
              onClick={() => handleClose(true)}
            ></button>
          </div>
          
          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control bg-secondary text-white border-dark"
                  name="fecha"
                  value={pedido.fecha}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Hora</label>
                <input
                  type="time"
                  className="form-control bg-secondary text-white border-dark"
                  name="hora"
                  value={pedido.hora}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Problema</label>
                <textarea
                  className="form-control bg-secondary text-white border-dark"
                  name="problema"
                  value={pedido.problema}
                  onChange={handleChange}
                  rows={4}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Solicitó</label>
                <input
                  type="text"
                  className="form-control bg-secondary text-white border-dark"
                  name="solicito"
                  value={pedido.solicito}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Sector</label>
                <select
                  className="form-select bg-secondary text-white border-dark"
                  name="sector_id"
                  value={pedido.sector_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un sector</option>
                  {sectores.map(sector => (
                    <option key={sector.id} value={sector.id}>
                      {sector.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="d-flex justify-content-between">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => handleClose(true)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {pedidoEditando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pedidos;
