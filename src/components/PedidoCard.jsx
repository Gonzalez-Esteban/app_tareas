import React from "react";

function PedidoCard({ pedido, obtenerNombreSector, borrarPedido, modificarPedido, finalizarPedido }) {
  const estado = pedido.estado?.toLowerCase() || "en espera";
  const colores = {
    "en proceso": { borde: "border-primary", texto: "text-primary" },
    "en espera": { borde: "border-warning", texto: "text-warning" },
    "resuelto": { borde: "border-success", texto: "text-success" },
  };
  const { borde, texto } = colores[estado] || { borde: "border-secondary", texto: "text-secondary" };

  function calcularDemora(createdAt) {
    const ahora = new Date();
    const creado = new Date(createdAt);
    const diffMs = ahora - creado;

    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHoras = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDias > 0) return `${diffDias} día${diffDias > 1 ? 's' : ''}`;
    if (diffHoras > 0) return `${diffHoras} hora${diffHoras > 1 ? 's' : ''}`;
    return `${diffMinutos} min`;
  }

  return (
    <div className="col-md-4 mb-3" key={pedido.id}>
      <div className={`card bg-transparent text-white ${borde}`} style={{ borderWidth: "2px" }}>
        <div className="card-body d-flex flex-column">
          <h5 className="card-title text-center fw-bold">{pedido.problema}</h5>

          <hr style={{ borderTop: "3px solid white", opacity: 1 }} />

          <p className="card-text small">
            <strong>Sector:</strong> {obtenerNombreSector(pedido.sector_id)} <br />
            <strong>Solicitó:</strong> {pedido.solicito || "N/A"} <br />
            <strong>Hora:</strong> {pedido.created_at?.slice(11, 16) || "--:--"} <br />
            <strong>Demora:</strong> {pedido.created_at ? calcularDemora(pedido.created_at) : "N/A"}
          </p>

          <div className="mt-auto d-flex justify-content-between align-items-center">
            <span className={`fw-bold ${texto}`}>{pedido.estado || "En espera"}</span>

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
                onClick={() => modificarPedido(pedido)}
              >
                <i className="bi bi-pencil-fill"></i>
              </button>

              <button
                className="btn btn-sm"
                style={{ backgroundColor: "transparent", border: "2px solid white", color: "white" }}
                onClick={() => finalizarPedido(pedido.id)}
              >
                <i className="bi bi-check-lg"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PedidoCard;
