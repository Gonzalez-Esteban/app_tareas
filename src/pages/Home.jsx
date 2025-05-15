import React, { useEffect, useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import TarjetaPedidos from "../components/TarjetaPedidos";
import ModalTareas from '../components/ModalTareas';
import Pedidos from '../components/Pedidos';
import ModalTareasProgramadas from '../components/ModalTareasProgramadas';
import TarjetaProgramada from "../components/TarjetaProgramada";

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
  const [tareasProgramadas, setTareasProgramadas] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [showTareasModal, setShowTareasModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroSector, setFiltroSector] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [tareaEditando, setTareaEditando] = useState(null);
  const containerRef = useRef(null);
  const [modoTarea, setModoTarea] = useState('crear');
  const [timeRefresh, setTimeRefresh] = useState(Date.now());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showProgramadasModal, setShowProgramadasModal] = useState(false);
  const [filtroProgEstado, setFiltroProgEstado] = useState(null);
  const [filtroProgUsuario, setFiltroProgUsuario] = useState(null);
  const modalTareasProgramadasRef = useRef();
  const [localRefresh, setLocalRefresh] = useState(0);
  const [mostrarSoloPendientes, setMostrarSoloPendientes] = useState(false);

  const tareasRef = useRef(null);
  // Efecto para manejar clicks fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tareasRef.current && !tareasRef.current.contains(event.target)) {
        setTareaSeleccionada(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 1. Agrega estas referencias al inicio de tu componente
  const accionesRef = useRef(null);
  const tareasContainerRef = useRef(null);

  // 2. Agrega este efecto para manejar la deselección
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tareasContainerRef.current &&
        !tareasContainerRef.current.contains(event.target) &&
        !accionesRef.current?.contains(event.target) &&
        tareaSeleccionada) {
        setTareaSeleccionada(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [tareaSeleccionada]);

  // Filtrar y ordenar tareas
  const tareasFiltradas = useMemo(() => {
    return tareasProgramadas
      .filter(t => !mostrarSoloPendientes || t.estado !== 'Realizada')
      .sort((a, b) => {
        // Ordenar por prioridad (vencidas primero, luego por fecha más cercana)
        const fechaA = dayjs(a.fecha + (a.hora ? `T${a.hora}` : ''));
        const fechaB = dayjs(b.fecha + (b.hora ? `T${b.hora}` : ''));
        return fechaA.diff(fechaB);
      });
  }, [tareasProgramadas, mostrarSoloPendientes]);


  useEffect(() => {
    inicializar();
    const subscriptionPedidos = supabase
      .channel('pedidos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => cargarPedidos())
      .subscribe();

    const subscriptionProgramadas = supabase
      .channel('programadas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'programadas' }, () => cargarProgramadas())
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionPedidos);
      supabase.removeChannel(subscriptionProgramadas);
    };
  }, []);

  const inicializar = async () => {
    actualizarHoraYSaludo();
    await cargarSectores();
    await cargarPedidos();
    await cargarProgramadas();
  };

  useEffect(() => {
    setLocalRefresh(prev => prev + 1);
  }, [timeRefresh]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRefresh(Date.now());
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(interval);
  }, []);

  const cargarProgramadas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('programadas')
        .select('*')
        .order('created_at', { ascending: false });

      if (filtroProgUsuario) {
        query = query.contains('usuarios_asignados', [filtroProgUsuario]);
      }

      if (filtroProgEstado) {
        query = query.eq('estado', filtroProgEstado);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTareasProgramadas(data || []);
      setError(null);
    } catch (err) {
      console.error("Error cargando tareas programadas:", err);
      setError("Error al cargar tareas programadas");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    // Ejecutar al montar
    handleResize();

    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cargarSectores = async () => {
    const { data, error } = await supabase.from("sectores").select("*");
    if (error) {
      console.error("Error cargando sectores:", error.message);
    } else {
      setSectores(data);
    }
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

  const cargarPedidos = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pedidos')
        .select('*, tareas(*)')
        .order('created_at', { ascending: false });

      if (filtroSector) {
        query = query.eq('sector_id', filtroSector);
      }

      if (filtroEstado) {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;

      if (error) throw error;

      setPedidos(data || []);
      setError(null);
    } catch (err) {
      console.error("Error cargando pedidos:", err);
      setError("Error al cargar pedidos");
    } finally {
      setLoading(false);
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
      if (pedidoSeleccionado?.id === id) {
        setPedidoSeleccionado(null);
      }
    }
  };

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ estado: nuevoEstado })
        .eq('id', pedidoId);

      if (error) throw error;

      setPedidos(prev => prev.map(p =>
        p.id === pedidoId ? { ...p, estado: nuevoEstado } : p
      ));
    } catch (error) {
      console.error('Error cambiando estado:', error);
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

      if (diffEnMinutos <= 1) return "Hace unos segundos";

      const dias = diffEnDias;
      const horas = diffEnHoras - (24 * dias);
      const minutos = diffEnMinutos - (horas * 60) - (24 * dias * 60);

      let resultado = "Hace ";
      if (dias > 0) resultado += `${dias}d `;
      if (horas > 0) resultado += `${horas}h `;
      if (minutos > 0) resultado += `${minutos}m `;
      return resultado;
    } catch (error) {
      return "Recién creado";
    }
  };

  // Función para abrir modal en modo creación
  const abrirModalNuevaTarea = () => {
    setModoTarea('crear');
    setTareaEditando(null);
    setShowTareasModal(true);
  };

  const abrirModalProgramadas = (tareaExistente = null) => {
    if (tareaExistente) {
      modalTareasProgramadasRef.current?.abrirProgramada(tareaExistente);
    } else {
      modalTareasProgramadasRef.current?.abrirProgramada();
    }
    setShowProgramadasModal(true);
  };

  // Función para abrir modal en modo edición
  const abrirModalEditarTarea = (tarea) => {
    setModoTarea('editar');
    setTareaEditando(tarea);
    setShowTareasModal(true);
  };

  // Manejador de clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        pedidoSeleccionado
      ) {
        // Verificar si el clic no fue en un modal abierto
        const isModalOpen = showPedidosModal || showTareasModal || showProgramadasModal;
        const isNavbarClick = event.target.closest('.navbar') ||
          event.target.closest('.offcanvas');

        if (!isModalOpen && !isNavbarClick) {
          setPedidoSeleccionado(null);
          setTareaSeleccionada(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pedidoSeleccionado, showPedidosModal, showTareasModal, showProgramadasModal]);

  const abrirModalEdicion = (pedido) => {
    setPedidoEditando(pedido);
    setShowPedidosModal(true);
  };

  const abrirNuevoPedido = () => {
    setPedidoEditando(null);
    setShowPedidosModal(true);
  };

  const cerrarModalPedidos = () => {
    setShowPedidosModal(false);
    setPedidoEditando(null);
  };



  return (
    <div style={{ minHeight: "100vh", width: "100%", backgroundColor: "#2d3748", color: "white" }}>
      {/* Navbar (se mantiene exactamente igual) */}
      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center" ref={containerRef}
          onClick={(e) => {
            if (e.target === e.currentTarget && pedidoSeleccionado) {
              setPedidoSeleccionado(null);
              setTareaSeleccionada(null);
            }
          }}
          style={{ borderWidth: '2px', fontWeight: '700', fontSize: '1rem', color: '#a0aec0' }}
        >

          <span className="navbar-brand mb-0 h2" style={{ color: '#a0aec0' }}>
            {saludo}, {usuario?.nombre || "Usuario"}!
          </span>

          <div className="d-flex align-items-center gap-2" >
            {!pedidoSeleccionado ? (
              <>
                <button
                  className="btn btn-outline-secondary me-1"
                  onClick={abrirNuevoPedido}
                  style={{ borderWidth: 'px', fontWeight: '600', fontSize: '1rem', color: '#a0aec0' }}
                >
                  <i className="bi bi-clipboard-plus me-2" ></i> Pedido
                </button>
                <button
                  className="btn btn-outline-secondary me-1"
                  onClick={() => abrirModalProgramadas()}
                  style={{ borderWidth: 'px', fontWeight: '600', fontSize: '1rem', color: '#a0aec0' }}
                >
                  <i className="bi bi-calendar2-plus" ></i> Programada
                </button>
                <button
                  className="btn btn-outline-secondary me-1"

                  style={{ borderWidth: 'px', fontWeight: '600', fontSize: '1rem', color: '#a0aec0' }}
                >
                  <i className="bi bi-journal-plus" ></i> Proyecto
                </button>
              </>
            ) : (
              <>
                {tareaSeleccionada ? (
                  <>
                    <button
                      className="btn btn-outline-danger me-2"
                      onClick={() => {
                        abrirModalEditarTarea(pedidoSeleccionado.tareas.find(t => t.id === tareaSeleccionada));
                      }}
                    >
                      <i className="bi bi-trash me-1"></i> Eliminar
                    </button>
                    <button
                      className="btn btn-outline-warning me-2"
                      onClick={() => {
                        abrirModalEditarTarea(pedidoSeleccionado.tareas.find(t => t.id === tareaSeleccionada));
                      }}
                    >
                      <i className="bi bi-pencil me-1"></i> Editar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-outline-danger me-2"
                      onClick={() => borrarPedido(pedidoSeleccionado.id)}
                    >
                      <i className="bi bi-trash me-1"></i> Eliminar
                    </button>
                    <button
                      className="btn btn-outline-warning me-2"
                      onClick={() => abrirModalEdicion(pedidoSeleccionado)}
                    >
                      <i className="bi bi-pencil me-1"></i> Editar
                    </button>
                    <button
                      className="btn btn-outline-primary"
                      onClick={abrirModalNuevaTarea}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Agregar Tarea
                    </button>
                  </>
                )}
              </>
            )}
            <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar">
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>

          {/* Offcanvas con filtros */}
          <div className="offcanvas offcanvas-end text-bg-dark" id="offcanvasNavbar">
            <div className="offcanvas-header">
              <h5 className="offcanvas-title">Menú</h5>
              <button className="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div className="offcanvas-body d-flex flex-column justify-content-between">
              <ul className="navbar-nav flex-grow-1">
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    Filtrar por Sector
                  </a>
                  <ul className="dropdown-menu" >
                    <li><button className="dropdown-item" onClick={() => { setFiltroSector(null); cargarPedidos(); }}>Todos</button></li>
                    {sectores.map(sector => (
                      <li key={sector.id}>
                        <button className="dropdown-item" onClick={() => { setFiltroSector(sector.id); cargarPedidos(); }}>
                          {sector.nombre}
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
                <li className="nav-item dropdown mt-2">
                  <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    Filtrar por Estado
                  </a>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={() => { setFiltroEstado(null); cargarPedidos(); }}>Todos</button></li>
                    <li><button className="dropdown-item" onClick={() => { setFiltroEstado('En proceso'); cargarPedidos(); }}>En proceso</button></li>
                    <li><button className="dropdown-item" onClick={() => { setFiltroEstado('Resuelto'); cargarPedidos(); }}>Resuelto</button></li>
                  </ul>
                </li>
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

      {/* Sidebar modificado */}
      <div style={{
        display: 'flex',
        height: 'calc(180vh - 80px)',
        marginTop: '50px',
        position: 'static',
        overflow: 'hidden',
        overflowY: 'auto',
        width: '100%'
      }}>

        {/* Sidebar */}
        <div
          className="sidebar-scroll"
          style={{
            width: isSidebarCollapsed ? '50px' : '390px',
            backgroundColor: '#212529',
            overflowY: 'auto',
            transition: 'width 0.3s ease',
            position: 'sticky',
            flexShrink: 0,
            borderRight: '1px solid #4a5568',
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid #4a5568',
            height: '100%',
            scrollbarWidth: 'thin',
            scrollbarColor: '#444 #212529'
          }}
        >
          {/* Cabecera del sidebar */}
          <div style={{
            padding: '10px',
            position: 'sticky',
            top: 0,
            backgroundColor: '#212529',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            borderTop: '1px solid #4a5568',
            alignItems: 'center',
            borderBottom: '1px solid #2d3748',
            minHeight: '40px'
          }}>
            {!isSidebarCollapsed && (

              <h6 style={{ color: '#a0aec0', whiteSpace: 'normal' }}>
                <i className="bi bi-calendar3 me-1"> </i>
                Programadas
              </h6>
            )}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                cursor: 'pointer',
                padding: '8px',
                flexShrink: 0,
                marginLeft: isSidebarCollapsed ? '0' : 'auto'
              }}
            >
              <i className={`bi bi-chevron-${isSidebarCollapsed ? 'right' : 'left'}`}></i>
            </button>
          </div>

          {/* Botones de acción (solo cuando hay tarea seleccionada) */}
          {!isSidebarCollapsed && (
            <div style={{
              padding: '10px',
              borderBottom: '1px solid #4a5568',
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end'
            }} ref={accionesRef}> {/* Agregada referencia aquí */}
              {tareaSeleccionada ? (
                <>
                  <button
                    className="btn btn-sm btn-outline-warning me-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      abrirModalProgramadas(tareaSeleccionada);
                    }}
                  >
                    <i className="bi bi-pencil"></i>
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (window.confirm('¿Eliminar esta tarea programada?')) {
                        await supabase.from('programadas').delete().eq('id', tareaSeleccionada.id);
                        cargarProgramadas();
                        setTareaSeleccionada(null);
                      }
                    }}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </>
              ) : (
                <>
                  <div className="form-check form-switch" style={{ marginRight: '52%' }}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="filtroPendientes"
                      checked={mostrarSoloPendientes}
                      onChange={() => setMostrarSoloPendientes(!mostrarSoloPendientes)}
                      style={{
                        backgroundColor: mostrarSoloPendientes ? '#4a5568' : '#6c757d',
                        borderColor: mostrarSoloPendientes ? '#4a5568' : '#6c757d',
                      }}
                    />
                    <label
                      className="form-check-label"
                      htmlFor="filtroPendientes"
                      style={{
                        color: '#6c757d',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                      }}
                    >
                      Pendientes
                    </label>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-primary me-2"
                    onClick={() => abrirModalProgramadas()}
                  >
                    <i className="bi bi-calendar2-plus"></i>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Contenido del sidebar */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: isSidebarCollapsed ? '16px 8px' : '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {isSidebarCollapsed ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                color: '#a0aec0',
                height: '100%'
              }}>
                <i className="bi bi-calendar3" style={{ fontSize: '1.2rem', marginBottom: '8px' }}></i>
                {tareasProgramadas.length > 0 && (
                  <span className="badge bg-danger rounded-pill">
                    {tareasProgramadas.filter(t => t.estado !== 'Realizada').length}
                  </span>
                )}
              </div>
            ) : (
              <>
                {loading ? (
                  <div className="text-center my-4">
                    <div className="spinner-border spinner-border-sm text-light" role="status"></div>
                  </div>
                ) : tareasFiltradas.length === 0 ? (
                  <div className="text-center py-4 text-white">
                    <i className="bi bi-calendar-x" style={{ fontSize: '2rem' }}></i>
                    <p>No hay tareas {mostrarSoloPendientes ? 'pendientes' : 'programadas'}</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2" ref={tareasContainerRef}>
                    {tareasFiltradas.map(tarea => (
                      <TarjetaProgramada
                        key={tarea.id}
                        tarea={tarea}
                        selected={tareaSeleccionada?.id === tarea.id}
                        onSelect={(id) => setTareaSeleccionada(tareasProgramadas.find(t => t.id === id))}
                        onComplete={async (id) => {
                          await supabase
                            .from('programadas')
                            .update({ estado: 'Realizada' })
                            .eq('id', id);
                          cargarProgramadas();
                          // Deseleccionar si era la tarea seleccionada
                          if (tareaSeleccionada?.id === id) {
                            setTareaSeleccionada(null);
                          }
                        }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Contenido principal (se mantiene igual) */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '20px'
        }}>
          <h4 style={{ fontSize: '1.2rem', color: '#a0aec0', marginBottom: '20px' }}>Diarios</h4>

          {/* Modal de Pedidos */}
          <Pedidos
            showModal={showPedidosModal}
            pedidoEditando={pedidoEditando}
            onClose={cerrarModalPedidos}
            sectores={sectores}
            usuario={usuario}
            onGuardarSuccess={() => {
              cargarPedidos();
              cerrarModalPedidos();
            }}
          />

          <ModalTareasProgramadas
            ref={modalTareasProgramadasRef}
            showModal={showProgramadasModal}
            onClose={() => setShowProgramadasModal(false)}
            onTareaGuardada={() => {
              cargarProgramadas();
              setShowProgramadasModal(false);
            }}
            tarea={null} // Puedes pasar una tarea existente aquí si estás editando
          />

          {/* Modal de Tareas */}
          <ModalTareas
            showModal={showTareasModal}
            pedido={pedidoSeleccionado}
            tarea={modoTarea === 'editar' ? tareaEditando : null}
            onClose={() => {
              setShowTareasModal(false);
              setTareaEditando(null);
              setTareaSeleccionada(null);
            }}
            onTareaGuardada={() => {
              cargarPedidos();
              setTareaEditando(null);
              setTareaSeleccionada(null);
            }}
            cambiarEstadoPedido={cambiarEstadoPedido}
          />

          {/* Estados de carga y error */}
          {loading && (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-white mt-2">Cargando pedidos...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {/* Tarjetas de pedidos agrupadas por fecha */}
          {!loading && !error && (
            <div className="row mt-3">
              {(() => {
                const hoy = dayjs().startOf('day');
                const ayer = hoy.subtract(1, 'day');

                const pedidosHoy = pedidos.filter(p => dayjs(p.created_at).isAfter(hoy));
                const pedidosAyer = pedidos.filter(p => dayjs(p.created_at).isAfter(ayer) && dayjs(p.created_at).isBefore(hoy));
                //const pedidosAntiguos = pedidos.filter(p => dayjs(p.created_at).isBefore(ayer));
                //const ayer = dayjs().subtract(1, 'day').endOf('day');
                const limiteAntiguedad = dayjs().subtract(4, 'day').startOf('day'); // 3 días antes de ayer

                const pedidosAntiguos = pedidos.filter(p => {
                  const fechaPedido = dayjs(p.created_at);
                  return fechaPedido.isBefore(ayer) && fechaPedido.isAfter(limiteAntiguedad);
                });

                return (
                  <>
                    {/* HOY */}
                    {pedidosHoy.length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <h5 className="text" style={{ color: '#a0aec0' }}>Hoy</h5>
                        <div
                          style={{
                            display: "grid",
                            gap: "16px",
                            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 360px))",
                            justifyContent: "flex-start", // o "center" si querés centrarlas
                          }}
                        >
                          {pedidosHoy.map(pedido => (

                            <TarjetaPedidos
                              key={pedido.id}
                              pedido={pedido}
                              usuario={usuario}
                              sectores={sectores}
                              obtenerNombreSector={obtenerNombreSector}
                              borrarPedido={borrarPedido}
                              abrirModalEdicion={abrirModalEdicion}
                              cambiarEstadoPedido={cambiarEstadoPedido}
                              timeRefresh={timeRefresh}
                              calcularTiempoTranscurrido={() => calcularTiempoTranscurrido(pedido.created_at)}
                              onSelectPedido={(id) => {
                                setPedidoSeleccionado(id === pedidoSeleccionado?.id ? null : pedidos.find(p => p.id === id));
                                setTareaSeleccionada(null);
                              }}
                              onSelectTarea={(pedidoId, tareaId) => {
                                setPedidoSeleccionado(pedidos.find(p => p.id === pedidoId));
                                setTareaSeleccionada(tareaId);
                              }}
                              selectedPedidoId={pedidoSeleccionado?.id}
                              selectedTareaId={tareaSeleccionada}
                            />

                          ))}
                        </div>
                      </div>


                    )}

                    {/* AYER */}
                    {pedidosAyer.length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <h5 className="text" style={{ color: '#a0aec0' }}>Ayer</h5>
                        <div
                          style={{
                            display: "grid",
                            flexWrap: "wrap",
                            gap: "12px",
                            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 360px))",
                            justifyContent: "flex-start", // o "center" si querés centrarlas
                          }}
                        >
                          {pedidosAyer.map(pedido => (

                            <TarjetaPedidos
                              key={pedido.id}
                              pedido={pedido}
                              usuario={usuario}
                              sectores={sectores}
                              obtenerNombreSector={obtenerNombreSector}
                              borrarPedido={borrarPedido}
                              abrirModalEdicion={abrirModalEdicion}
                              cambiarEstadoPedido={cambiarEstadoPedido}
                              timeRefresh={timeRefresh}
                              calcularTiempoTranscurrido={() => calcularTiempoTranscurrido(pedido.created_at)}
                              onSelectPedido={(id) => {
                                setPedidoSeleccionado(id === pedidoSeleccionado?.id ? null : pedidos.find(p => p.id === id));
                                setTareaSeleccionada(null);
                              }}
                              onSelectTarea={(pedidoId, tareaId) => {
                                setPedidoSeleccionado(pedidos.find(p => p.id === pedidoId));
                                setTareaSeleccionada(tareaId);
                              }}
                              selectedPedidoId={pedidoSeleccionado?.id}
                              selectedTareaId={tareaSeleccionada}
                            />

                          ))}
                        </div>
                      </div>


                    )}

                    {/* MÁS ANTIGUOS */}
                    {pedidosAntiguos.length > 0 && (
                      <div style={{ marginBottom: '30px' }}>
                        <h5 className="text" style={{ color: '#a0aec0' }}>Más antiguos</h5>
                        <div
                          style={{
                            display: "grid",
                            flexWrap: "wrap",
                            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 360px))",
                            gap: "16px",
                            justifyContent: "flex-start", // o "center" si querés centrarlas
                          }}
                        >
                          {pedidosAntiguos.map(pedido => (

                            <TarjetaPedidos
                              key={pedido.id}
                              pedido={pedido}
                              usuario={usuario}
                              sectores={sectores}
                              obtenerNombreSector={obtenerNombreSector}
                              borrarPedido={borrarPedido}
                              abrirModalEdicion={abrirModalEdicion}
                              cambiarEstadoPedido={cambiarEstadoPedido}
                              timeRefresh={timeRefresh}
                              calcularTiempoTranscurrido={() => calcularTiempoTranscurrido(pedido.created_at)}
                              onSelectPedido={(id) => {
                                setPedidoSeleccionado(id === pedidoSeleccionado?.id ? null : pedidos.find(p => p.id === id));
                                setTareaSeleccionada(null);
                              }}
                              onSelectTarea={(pedidoId, tareaId) => {
                                setPedidoSeleccionado(pedidos.find(p => p.id === pedidoId));
                                setTareaSeleccionada(tareaId);
                              }}
                              selectedPedidoId={pedidoSeleccionado?.id}
                              selectedTareaId={tareaSeleccionada}
                            />

                          ))}
                        </div>
                      </div>


                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}