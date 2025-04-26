import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import NuevoPedido from "../components/NuevoPedido";


export default function Home({ usuario }) {
  const [sectores, setSectores] = useState([]);
  const [horaActual, setHoraActual] = useState("");
  const [saludo, setSaludo] = useState('');
  const [pedido, setPedido] = useState({
    fecha: '',
    hora: '',
    sector: '',
  });

  useEffect(() => {
    const ahora = new Date();
    const hora = ahora.getHours();

    // Saludo
    if (hora < 12) {
      setSaludo('Buen día');
    } else if (hora < 19) {
      setSaludo('Buenas tardes');
    } else {
      setSaludo('Buenas noches');
    }

    // Hora actual formateada
    const fechaActual = ahora.toISOString().slice(0, 10);
    const horaStr = ahora.toTimeString().slice(0, 5);
    setHoraActual(`${fechaActual}T${horaStr}`);

    // Setear datos del pedido
    setPedido((prev) => ({ ...prev, fecha: fechaActual, hora: horaStr }));

    // Traer sectores
    const cargarSectores = async () => {
      const { data, error } = await supabase.from("sectores").select("*");
      if (!error) setSectores(data);
      else console.error(error);
    };
    cargarSectores();

  }, []);

  const guardarPedido = async () => {
    const sector_id = document.getElementById("sector").value;
    const problema = document.getElementById("problema").value;
    const hora = document.getElementById("hora").value;
  
    const { data, error } = await supabase.from("pedidos").insert([
      {
        sector_id,
        problema,
        hora,
        id_uuid: usuario.id, // ← UUID del usuario logueado
      },
    ]);
  
    if (error) {
      console.log("Error al guardar pedido:", error);
      alert("Error al guardar el pedido");
    } else {
      alert("Pedido guardado con éxito");
      const modalElement = document.getElementById("nuevoPedidoModal");
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal.hide();
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#2d3748", color: "white" }}>
      {/* Navbar */}
      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <span className="navbar-brand mb-0 h1">
            {saludo}, {usuario?.nombre || "Usuario"}!
          </span>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-light ms-2"
              data-bs-toggle="modal"
              data-bs-target="#nuevoPedidoModal"
            >
              <i className="bi bi-plus-circle me-1"></i> Nuevo Pedido
            </button>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#offcanvasNavbar"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>

          {/* Offcanvas */}
          <div className="offcanvas offcanvas-end text-bg-dark" id="offcanvasNavbar">
            <div className="offcanvas-header">
              <h5 className="offcanvas-title">Menú</h5>
              <button className="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div className="offcanvas-body d-flex flex-column justify-content-between">
              <ul className="navbar-nav flex-grow-1">
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/pedidos">
                    <i className="bi bi-card-checklist me-2"></i>Pedidos
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/proyectos">
                    <i className="bi bi-kanban me-2"></i>Proyectos
                  </Link>
                </li>
              </ul>
              <button className="btn btn-link text-danger mt-auto" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div style={{ paddingTop: "80px" }} className="container">
        {/* Modal */}
        <div className="modal fade" id="nuevoPedidoModal" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content bg-dark text-white">
              <div className="modal-header">
                <h5 className="modal-title">Nuevo Pedido</h5>
                <button className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <NuevoPedido
                sectores={sectores}
                horaActual={horaActual}
                guardarPedido={guardarPedido}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}
