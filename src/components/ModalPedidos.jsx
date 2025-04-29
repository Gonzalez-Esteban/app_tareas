import React from 'react';
import NuevoPedido from "./NuevoPedido";

const ModalPedidos = ({ 
  pedidoEditando, 
  cerrarModal, 
  sectores, 
  horaActual, 
  guardarPedido 
}) => {
  return (
    <div className="modal fade" id="nuevoPedidoModal" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content bg-dark text-white">
          <div className="modal-header">
            <h5 className="modal-title">
              {pedidoEditando ? "Editar Pedido" : "Nuevo Pedido"}
            </h5>
            <button 
              className="btn-close btn-close-white" 
              data-bs-dismiss="modal"
              onClick={cerrarModal}
            ></button>
          </div>
          
          <NuevoPedido
            sectores={sectores}
            horaActual={horaActual}
            guardarPedido={guardarPedido}
            pedidoEditando={pedidoEditando}
            onCancelar={cerrarModal}
          />
        </div>
      </div>
    </div>
  );
};

export default ModalPedidos;