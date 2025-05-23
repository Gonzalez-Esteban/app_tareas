import React from 'react';
import TarjetaPedido from '../components/TarjetaPedidos'; // Asegúrate de tener este componente

const PedidosBody = ({
  pedidos,
  usuario,
  sectores,
  pedidoSeleccionado,
  tareaSeleccionada,
  setPedidoSeleccionado,
  setTareaSeleccionada,
  obtenerNombreSector,
  borrarPedido,
  abrirModalEdicion,
  cambiarEstadoPedido,
  calcularTiempoTranscurrido,
  timeRefresh,
  loading,
  error,
}) => {
  const fechasUnicas = [...new Set(pedidos.map(p => p.fecha.split('T')[0]))].sort((a, b) => new Date(b) - new Date(a));

  if (loading) return <div className="container mt-5"><h5>Cargando pedidos...</h5></div>;
  if (error) return <div className="container mt-5"><h5 className="text-danger">Error al cargar pedidos.</h5></div>;

  return (
    <div className="container mt-5 pt-5">
      {fechasUnicas.map(fecha => (
        <div key={fecha} className="mb-4">
          <h5 className="text-muted">{new Date(fecha).toLocaleDateString()}</h5>
          {pedidos
            .filter(p => p.fecha.startsWith(fecha))
            .map(pedido => (
              <TarjetaPedido
                key={pedido.id}
                pedido={pedido}
                usuario={usuario}
                sectores={sectores}
                seleccionado={pedidoSeleccionado?.id === pedido.id}
                tareaSeleccionada={tareaSeleccionada}
                setPedidoSeleccionado={setPedidoSeleccionado}
                setTareaSeleccionada={setTareaSeleccionada}
                obtenerNombreSector={obtenerNombreSector}
                borrarPedido={borrarPedido}
                abrirModalEdicion={abrirModalEdicion}
                cambiarEstadoPedido={cambiarEstadoPedido}
                calcularTiempoTranscurrido={calcularTiempoTranscurrido}
                timeRefresh={timeRefresh}
              />
            ))}
        </div>
      ))}
    </div>
  );
};

export default PedidosBody;
