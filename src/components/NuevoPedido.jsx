import { useEffect, useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate } from 'react-router-dom';

function NuevoPedido() {
  const [pedido, setPedido] = useState({
    fecha: '',
    hora: '',
    problema: '',
    solicito: '',
    sector_id: '',
  });
  const [sectores, setSectores] = useState([]); // ← ESTO ES LO QUE FALTABA
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Traer sectores
        const { data: sectoresData, error: errorSectores } = await supabase.from('sectores').select('*');
        //console.log('Sectores recibidos:', sectoresData); // ← AQUI EL LOG
        if (errorSectores) {
          console.error('Error al traer sectores:', errorSectores.message);
        } else {
          setSectores(sectoresData || []);
        }

        // Inicializar fecha y hora actuales
        const now = new Date();
        const fecha = now.toISOString().slice(0, 10);
        const hora = now.toTimeString().slice(0, 5);
        setPedido((prev) => ({ ...prev, fecha, hora }));

      } catch (error) {
        console.error('Error general en fetchData:', error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPedido((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert('Usuario no autenticado');
      return;
    }

    const { fecha, hora, problema, solicito, sector_id } = pedido;

    const { error } = await supabase.from('pedidos').insert([
      {
        created_at: `${fecha}T${hora}`,
        problema,
        solicito,
        sector_id: parseInt(sector_id), // ← Importante parsear sector_id
        estado: 'En proceso',
        id_uuid: user.id,
      },
    ]);

    if (error) {
      alert('Error al guardar pedido: ' + error.message);
    } else {
      alert('Pedido guardado correctamente');
      navigate('/home');
    }
  };

  return (
    <div className="container mt-4">
      <h2>Nuevo Pedido</h2>
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
            {sectores.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.nombre}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary">Guardar</button>
      </form>
    </div>
  );
}

export default NuevoPedido;
