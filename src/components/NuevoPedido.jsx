import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

function NuevoPedido({ pedidoEditando, onGuardar, onCancelar }) {
  const [pedido, setPedido] = useState({
    fecha: '',
    hora: '',
    problema: '',
    solicito: '',
    sector_id: '',
  });
  const [sectores, setSectores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Traer sectores
        const { data: sectoresData, error: errorSectores } = await supabase.from('sectores').select('*');
        if (errorSectores) {
          console.error('Error al traer sectores:', errorSectores.message);
        } else {
          setSectores(sectoresData || []);
        }

        // Inicializar con datos de edición o valores por defecto
        if (pedidoEditando) {
          // Parsear fecha y hora del pedido existente
          const fecha = pedidoEditando.created_at?.slice(0, 10) || new Date().toISOString().slice(0, 10);
          const hora = pedidoEditando.created_at?.slice(11, 16) || new Date().toTimeString().slice(0, 5);
          
          setPedido({
            fecha,
            hora,
            problema: pedidoEditando.problema || '',
            solicito: pedidoEditando.solicito || '',
            sector_id: pedidoEditando.sector_id || '',
          });
        } else {
          // Valores por defecto para nuevo pedido
          const now = new Date();
          const fecha = now.toISOString().slice(0, 10);
          const hora = now.toTimeString().slice(0, 5);
          setPedido(prev => ({ ...prev, fecha, hora }));
        }

      } catch (error) {
        console.error('Error general en fetchData:', error);
      }
    };

    fetchData();
  }, [pedidoEditando]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPedido(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        //alert('Usuario no autenticado');
        toast.error('Usuario no autenticado');
        return;
      }

      const { fecha, hora, problema, solicito, sector_id } = pedido;
      const pedidoData = {
        created_at: `${fecha}T${hora}`,
        problema,
        solicito,
        sector_id: parseInt(sector_id),
        id_uuid: user.id,
      };

      if (pedidoEditando) {
        // Actualizar pedido existente
        const { error } = await supabase
          .from('pedidos')
          .update(pedidoData)
          .eq('id', pedidoEditando.id);

        if (error) throw error;
        //alert('Pedido actualizado correctamente');
        toast.error("Error al guardar el pedido");
      } else {
        // Crear nuevo pedido
        pedidoData.estado = 'En proceso';
        const { error } = await supabase.from('pedidos').insert([pedidoData]);
        if (error) throw error;
        toast.success('Pedido guardado correctamente');
      }

      if (onGuardar) {
        onGuardar();
      } else {
        navigate('/home');
      }

    } catch (error) {
      console.error('Error al guardar pedido:', error);
      alert(`Error al ${pedidoEditando ? 'actualizar' : 'guardar'} pedido: ${error.message}`);
    }
  };

  return (
    <div className="container mt-4">
      <h2>{pedidoEditando ? 'Editar Pedido' : 'Nuevo Pedido'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-control"
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
            className="form-control"
            name="hora"
            value={pedido.hora}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Problema</label>
          <textarea
            className="form-control"
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
            className="form-control"
            name="solicito"
            value={pedido.solicito}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Sector</label>
          <select
            className="form-select"
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
            onClick={onCancelar || (() => navigate('/home'))}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary">
            {pedidoEditando ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NuevoPedido;