import React from 'react';


const TarjetaPedidos = ({ 
  pedido = {},
  usuario = {},
  sectores = [],
  obtenerNombreSector = () => "Sin sector",
  borrarPedido = () => {},
  abrirModalEdicion = () => {},
  agregarTarea = () => {},
  calcularTiempoTranscurrido = () => "No disponible"
}) => {
  const estado = pedido.estado?.toLowerCase() || "en espera";
  const colores = {
    "en proceso": { borde: "border-primary", texto: "text-primary" },
    "en espera": { borde: "border-warning", texto: "text-warning" },
    "resuelto": { borde: "border-success", texto: "text-success" },
  };
  const { borde, texto } = colores[estado] || { borde: "border-secondary", texto: "text-secondary" };

  return (
    <div className="col-md-4 mb-3">
      <div className={`card bg-transparent text-white ${borde}`} style={{ borderWidth: "2px" }}>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title text-center fw-bold">{pedido.problema}</h5>
          
          <hr style={{ borderTop: "2px solid white", opacity: 1 }} />

          <div className="card-text small d-flex justify-content-between">
            <div style={{ minWidth: "45%" }}>
              <strong>Fecha:</strong> {pedido.created_at?.slice(0, 10) || "----/--/--"}<br />
              <strong>Hora:</strong> {pedido.created_at?.slice(11, 16) || "--:--"}<br />
            </div>
            <div style={{ minWidth: "45%" }}>
              <strong>Sector:</strong> {obtenerNombreSector(pedido.sector_id)} <br />
              <strong>Solicitó:</strong> {pedido.solicito || "N/A"} <br />
            </div>
          </div>
          <hr style={{ borderTop: "2px solid white", opacity: 1 }} />
    
          <div className="mt-auto d-flex justify-content-between align-items-center">
            <div>
              <span className="small">
                <strong>Creado por:</strong> {usuario?.nombre || "N/A"}<br />
              </span>
              <span className="small">
                {pedido.created_at 
                  ? calcularTiempoTranscurrido(pedido.created_at)
                  : "No disponible"}
              </span><br />
              <span className={`fw-bold ${texto}`}>{pedido.estado || "En espera"}</span>
            </div>
    
            <div>
            <button
              className="btn btn-sm me-2"
              style={{ backgroundColor: "transparent", border: "2px solid white", color: "white" }}
              onClick={() => borrarPedido(pedido.id)}
            >
              <i className="bi bi-x-lg"></i>
            </button>

            <button
              className="btn btn-sm me-2"
              style={{ backgroundColor: "transparent", border: "2px solid white", color: "white" }}
              onClick={() => {
                abrirModalEdicion(pedido); // Esta función debe venir de Home.jsx
                const modalElement = document.getElementById("nuevoPedidoModal");
                if (modalElement) {
                  const modal = new bootstrap.Modal(modalElement);
                  modal.show();
                }
              }}
            >
              <i className="bi bi-pencil-fill"></i>
            </button>

            <button
              className="btn btn-sm"
              style={{ backgroundColor: "transparent", border: "2px solid white", color: "white" }}
              onClick={() => agregarTarea(pedido.id)} // Esta función debe venir de Home.jsx
            >
              <i className="bi bi-check-lg"></i>
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarjetaPedidos;