 import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import NuevoPedido from "../components/NuevoPedido";
import dayjs, { locale } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration'; // Plugin oficial
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es'; // idioma español
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Argentina/Buenos_Aires');
dayjs.extend(relativeTime);
dayjs.locale('es');

export default function Home({ usuario }) {
  const [sectores, setSectores] = useState([]);
  const [horaActual, setHoraActual] = useState("");
  const [saludo, setSaludo] = useState("");
  const [pedido, setPedido] = useState({
    fecha: "",
    hora: "",
    sector: "",
  });
  const [pedidos, setPedidos] = useState([]);
      //*** NUEVO
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    inicializar();
  }, []);

  const inicializar = async () => {
    actualizarHoraYSaludo();
    await cargarSectores();
    await cargarPedidos();

    const intervalo = setInterval(cargarPedidos, 5000);
    return () => clearInterval(intervalo);
  };

  const actualizarHoraYSaludo = () => {
    const ahora = new Date();
    const hora = ahora.getHours();

    setSaludo(
      hora < 12 ? "Buen día" : hora < 19 ? "Buenas tardes" : "Buenas noches"
    );

    const fechaActual = ahora.toISOString().slice(0, 10);
    const horaStr = ahora.toTimeString().slice(0, 5);

    setHoraActual(`${fechaActual}T${horaStr}`);
    setPedido((prev) => ({ ...prev, fecha: fechaActual, hora: horaStr }));
  };

  const cargarSectores = async () => {
    const { data, error } = await supabase.from("sectores").select("*");
    if (error) {
      console.error("Error cargando sectores:", error.message);
    } else {
      setSectores(data);
    }
  };

  const cargarPedidos = async () => {
    const { data, error } = await supabase.from("pedidos").select("*");
    if (error) {
      console.error("Error cargando pedidos:", error.message);
    } else {
      setPedidos(data);
    }
  };


//dayjs.extend(duration);


// Función para abrir modal de edición
const abrirModalEdicion = (pedido) => {
  setPedidoEditando(pedido);
  setModalAbierto(true);
  // Abrir modal manualmente
  const modalElement = document.getElementById("nuevoPedidoModal");
  const modal = new bootstrap.Modal(modalElement);
  modal.show();
};

// Función para guardar cambios (edición o creación)
const guardarPedido = async () => {
  const sector_id = document.getElementById("sector")?.value;
  const problema = document.getElementById("problema")?.value;
  const hora = document.getElementById("hora")?.value;

  if (!sector_id || !problema) {
    alert("Completa todos los campos antes de guardar.");
    return;
  }

  if (pedidoEditando) {
    // Actualizar pedido existente
    const { error } = await supabase
      .from("pedidos")
      .update({
        sector_id,
        problema,
        hora
      })
      .eq("id", pedidoEditando.id);

    if (error) {
      console.error("Error al actualizar pedido:", error.message);
      alert("Error al actualizar el pedido.");
    } else {
      alert("Pedido actualizado con éxito.");
      cerrarModal();
      await cargarPedidos();
    }
  } else {
    // Crear nuevo pedido
    const { error } = await supabase.from("pedidos").insert([
      {
        sector_id,
        problema,
        hora,
        id_uuid: usuario.id,
      },
    ]);

    if (error) {
      console.error("Error al guardar pedido:", error.message);
      alert("Error al guardar el pedido.");
    } else {
      alert("Pedido guardado con éxito.");
      cerrarModal();
      await cargarPedidos();
    }
  }
};

// Función para cerrar modal y limpiar estado
const cerrarModal = () => {
  const modalElement = document.getElementById("nuevoPedidoModal");
  const modal = bootstrap.Modal.getInstance(modalElement);
  modal?.hide();
  setPedidoEditando(null);
  setModalAbierto(false);
};



  const guardarPedido2 = async () => {
    const sector_id = document.getElementById("sector")?.value;
    const problema = document.getElementById("problema")?.value;
    const hora = document.getElementById("hora")?.value;

    if (!sector_id || !problema) {
      alert("Completa todos los campos antes de guardar.");
      return;
    }

    const { error } = await supabase.from("pedidos").insert([
      {
        sector_id,
        problema,
        hora,
        id_uuid: usuario.id,
      },
    ]);

    if (error) {
      console.error("Error al guardar pedido:", error.message);
      alert("Error al guardar el pedido.");
    } else {
      alert("Pedido guardado con éxito.");
      cerrarModal();
      await cargarPedidos();
    }
  };

  const borrarPedido = async (id) => {
    if (!window.confirm("¿Estás seguro de borrar este pedido?")) return;

    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) {
      console.error("Error al borrar:", error.message);
      alert("Error al borrar el pedido.");
    } else {
      setPedidos((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const finalizarPedido = async (id) => {
    const { error } = await supabase
      .from("pedidos")
      .update({ finalizado: true, estado: "resuelto" })
      .eq("id", id);

    if (error) {
      console.error("Error al finalizar:", error.message);
      alert("Error al finalizar el pedido.");
    } else {
      setPedidos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, finalizado: true, estado: "resuelto" } : p))
      );
    }
  };

  const modificarPedido2 = (pedido) => {
    alert("Función de modificar aún no implementada.");
    // Aquí podrías abrir un modal para modificar el pedido si quieres
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

  const obtenerNombreSector = (sector_id) => {
    const sector = sectores.find((s) => s.id === sector_id);
    return sector?.nombre || "Sin sector";
  };

  const cerrarModal2 = () => {
    const modalElement = document.getElementById("nuevoPedidoModal");
    if (modalElement) {
      const modal = bootstrap.Modal.getInstance(modalElement);
      modal?.hide();
    }
  };

  
  
  // Solo usar plugin UTC (sin timezone para evitar conflictos)
  dayjs.extend(utc);



  
  dayjs.extend(duration);
  dayjs.extend(utc);
  dayjs.locale('es');

  
  const calcularTiempoTranscurrido = (fechaCreacion) => {
    if (!fechaCreacion) return "No disponible";
  
    try {
      //console.log("Fecha recibida:", fechaCreacion);
  
      // Simplemente parsearla como UTC
      const creacion = dayjs(fechaCreacion);
  
      if (!creacion.isValid()) {
        console.error("Fecha inválida:", fechaCreacion);
        return "Fecha inválida";
      }
  
      const ahora = dayjs();
      //const diffEnMinutos = ahora.diff(creacion, 'minute');
      const diffEnMinutos = Math.abs(ahora.diff(creacion, 'minute'));
      const diffEnHoras = Math.abs(ahora.diff(creacion, 'hour'));
      const diffEnDias = Math.abs(ahora.diff(creacion, 'day'));

      if (diffEnMinutos < 1) {
        return "Hace unos segundos";
      }
      //console.log(diffEnMinutos);
   //   const dias = Math.floor(diffEnMinutos / (60 * 24));
   //   const horas = Math.floor((diffEnMinutos % (60 * 24)) / 60);
   //   const minutos = diffEnMinutos % 60;
      
      
      
      const dias = diffEnDias;
      const horas = diffEnHoras - 3 - (24 * dias);
      const minutos = diffEnMinutos - (horas * 60) - (24 * dias * 60) - 180;
      //console.log(diffEnDias,diffEnHoras,diffEnMinutos)
      let resultado = "Hace ";
      if (dias > 0) {
        resultado += `${dias} día${dias !== 1 ? 's' : ''}`;
        if (horas > 0 || minutos > 0) resultado += ", ";
      }
      if (horas > 0) {
        resultado += `${horas} hora${horas !== 1 ? 's' : ''}`;
        if (minutos > 0) resultado += " y ";
      }
      if (minutos > 0) {
        resultado += `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
      }
  
      return resultado;
  
    } catch (error) {
      console.error("Error calculando tiempo:", error, "Fecha recibida:", fechaCreacion);
      return "Recién creado";
    }
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
      {/* Modal para nuevo/editar pedido */}
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
            
            {/* Aquí va el componente NuevoPedido con las props */}
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

        {/* Tarjetas de pedidos */}
        <div className="row mt-4">
          {pedidos.map((pedido) => {          
            const estado = pedido.estado?.toLowerCase() || "en espera";
            const colores = {
              "en proceso": { borde: "border-primary", texto: "text-primary" },
              "en espera": { borde: "border-warning", texto: "text-warning" },
              "resuelto": { borde: "border-success", texto: "text-success" },
            };
            const { borde, texto } = colores[estado] || { borde: "border-secondary", texto: "text-secondary" };

            return (
              <div className="col-md-4 mb-3" key={pedido.id}>
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
                        onClick={() => abrirModalEdicion(pedido)}
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
          })}
        </div>

      </div>
    </div>
  );
}