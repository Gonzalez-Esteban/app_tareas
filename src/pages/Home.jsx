import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import TarjetaPedidos from "../components/TarjetaPedidos";
import ModalPedidos from "../components/ModalPedidos";
import NuevoPedido from "../components/NuevoPedido";
import ModalTareas from '../components/ModalTareas';

// Configuración de dayjs
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
  const [pedidos, setPedidos] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  // Agrega este estado para controlar el modal de tareas
  const [mostrarModalTareas, setMostrarModalTareas] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
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
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("created_at", { ascending: false }); // Ordenar por fecha
  
    if (error) {
      console.error("Error cargando pedidos:", error);
      setPedidos([]); // Asegurar que nunca sea null
      return;
    }
  
    //console.log("Pedidos cargados:", data); // Debug
    setPedidos(data || []); // Manejar caso undefined
  };

  const abrirModalEdicion = (pedido) => {
    setPedidoEditando(pedido);
    const modalElement = document.getElementById("nuevoPedidoModal");
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const guardarPedido = async () => {
    const sector_id = document.getElementById("sector")?.value;
    const problema = document.getElementById("problema")?.value;
    const hora = document.getElementById("hora")?.value;

    if (!sector_id || !problema) {
      alert("Completa todos los campos antes de guardar.");
      return;
    }

    if (pedidoEditando) {
      const { error } = await supabase
        .from("pedidos")
        .update({ sector_id, problema, hora })
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
      const { error } = await supabase.from("pedidos").insert([
        { sector_id, problema, hora, id_uuid: usuario.id }
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

  const cerrarModal = () => {
    const modalElement = document.getElementById("nuevoPedidoModal");
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
    setPedidoEditando(null);
    setModalAbierto(false);
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

  const agregarTarea = (id) => {
    const pedido = pedidos.find(p => p.id === id);
    setPedidoSeleccionado(pedido);
    setMostrarModalTareas(true);
    
    // Abrir modal manualmente
    const modalElement = document.getElementById("modalTareas");
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  };
  

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    window.location.href = "/";
  };

  const obtenerNombreSector = (sector_id) => {
    const sector = sectores.find((s) => s.id === sector_id);
    return sector?.nombre || "Sin sector";
  };

  const calcularTiempoTranscurrido = (fechaCreacion) => {
    if (!fechaCreacion) return "No disponible";
  
    try {
      const creacion = dayjs(fechaCreacion);
      if (!creacion.isValid()) return "Fecha inválida";
      
      const ahora = dayjs();
      const diffEnMinutos = Math.abs(ahora.diff(creacion, 'minute'));
      const diffEnHoras = Math.abs(ahora.diff(creacion, 'hour'));
      const diffEnDias = Math.abs(ahora.diff(creacion, 'day'));

      if (diffEnMinutos < 1) return "Hace unos segundos";
      
      const dias = diffEnDias;
      const horas = diffEnHoras - 3 - (24 * dias);
      const minutos = diffEnMinutos - (horas * 60) - (24 * dias * 60) - 180;
      
      let resultado = "Hace ";
      if (dias > 0) resultado += `${dias} día${dias !== 1 ? 's' : ''}, `;
      if (horas > 0) resultado += `${horas} hora${horas !== 1 ? 's' : ''} y `;
      if (minutos > 0) resultado += `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  
      return resultado;
    } catch (error) {
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
        <ModalPedidos
          pedidoEditando={pedidoEditando}
          cerrarModal={cerrarModal}
          sectores={sectores}
          horaActual={horaActual}
          guardarPedido={guardarPedido}
        />

        {/* Tarjetas de pedidos */}
        <div className="row mt-4">
          {pedidos.map((pedido) => (
            <TarjetaPedidos
              key={pedido.id}
              pedido={pedido}
              usuario={usuario}
              sectores={sectores}
              obtenerNombreSector={obtenerNombreSector}
              borrarPedido={borrarPedido}
              abrirModalEdicion={abrirModalEdicion}
              agregarTarea={agregarTarea}
              calcularTiempoTranscurrido={calcularTiempoTranscurrido}
            />
          ))}
        </div>
      </div>
        {/* Modal de Tareas */}
        {mostrarModalTareas && (
        <ModalTareas
          pedido={pedidoSeleccionado}
          usuario={usuario}
          onClose={() => setMostrarModalTareas(false)}
        />
      )}
    
    </div>
    
  );
}