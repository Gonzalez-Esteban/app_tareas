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
import { toast } from 'react-toastify';
import Sidebar from '../components/sidebar';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPedidos } from '../features/pedidos/pedidosThunks';
import { fetchSectores } from '../features/sectores/sectoresThunks';
import { deletePedido, updateEstadoPedido } from '../features/pedidos/pedidosThunks';
import { fetchTareasProgramadas } from '../features/programadas/programadasThunks';
import ModalProyectos from '../components/ModalProyectos';



dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('America/Argentina/Buenos_Aires');
dayjs.extend(relativeTime);
dayjs.locale('es');

export default function Home({ usuario }) {
  const dispatch = useDispatch();
  //const [sectores, setSectores] = useState([]);
  const [horaActual, setHoraActual] = useState("");
  const [saludo, setSaludo] = useState("");
  //const [pedidos, setPedidos] = useState([]);
  // const [tareasProgramadas, setTareasProgramadas] = useState([]);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [showTareasModal, setShowTareasModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [tareaEditando, setTareaEditando] = useState(null);
  const containerRef = useRef(null);
  const [modoTarea, setModoTarea] = useState('crear');
  const [timeRefresh, setTimeRefresh] = useState(Date.now());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [showProgramadasModal, setShowProgramadasModal] = useState(false);
  //const [mostrarSoloPendientes, setMostrarSoloPendientes] = useState(true);
  const [localRefresh, setLocalRefresh] = useState(0);
  const tareasRef = useRef(null);
  const accionesRef = useRef(null);
  const tareasContainerRef = useRef(null);
  const modalTareasProgramadasRef = useRef();
  const [progSeleccionada, setProgSeleccionada] = useState(null);
  const [showModalProyectos, setShowModalProyectos] = useState(false);


  //REDUX 
  const { pedidos, loading: loadingPedidos, error: errorPedidos } = useSelector((state) => state.pedidos);
  const { sectores, loading: loadingSectores, error: errorSectores } = useSelector((state) => state.sectores);
  const { programadas, loading: loadingProgramadas, error: errorProgramadas } = useSelector(state => state.programadas);



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

  //REDUX
  useEffect(() => {
    dispatch(fetchPedidos());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchSectores());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchTareasProgramadas());
  }, [dispatch]);

  const inicializar = async () => {
    actualizarHoraYSaludo();
    //REDUX
    dispatch(fetchPedidos());
    dispatch(fetchSectores());
    dispatch(fetchTareasProgramadas());
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

  const borrarPedido = (id) => {
    dispatch(deletePedido(id));
  };

  const cambiarEstadoPedido = (pedidoId, nuevoEstado) => {
    dispatch(updateEstadoPedido({ id: pedidoId, nuevoEstado }));
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

  const handleTareaGuardada = () => {
    dispatch(fetchTareasProgramadas());
  };

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

  const abrirModalEditarTarea = (tarea) => {
    setModoTarea('editar');
    setTareaEditando(tarea);
    setShowTareasModal(true);
  };

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
      {/* Navbar */}
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

          <div className="d-flex align-items-center gap-2">
            {!pedidoSeleccionado ? (
              <>
                <button
                  className="btn btn-outline-secondary me-1"
                  onClick={abrirNuevoPedido}
                  style={{ borderWidth: 'px', fontWeight: '600', fontSize: '1rem', color: '#a0aec0' }}
                >
                  <i className="bi bi-clipboard-plus me-2"></i> Pedido
                </button>
                <button
                  className="btn btn-outline-secondary me-1"
                  onClick={() => abrirModalProgramadas()}
                  style={{ borderWidth: 'px', fontWeight: '600', fontSize: '1rem', color: '#a0aec0' }}
                >
                  <i className="bi bi-calendar2-plus"></i> Programada
                </button>
                <button
                  className="btn btn-outline-secondary me-1"
                  onClick={() => setShowModalProyectos(true)}
                  style={{ borderWidth: 'px', fontWeight: '600', fontSize: '1rem', color: '#a0aec0' }}
                >
                  <i className="bi bi-journal-plus"></i> Proyecto
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

      {/* Sidebar y contenido principal */}
      <div className="d-flex" style={{ paddingTop: "56px" }}>
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          progSeleccionada={progSeleccionada}
          setProgSeleccionada={setProgSeleccionada}
          abrirModalProgramadas={abrirModalProgramadas}
          supabase={supabase}
          loading={loadingProgramadas}
        />

        {/* Contenido principal */}
        <div style={{
          flexGrow: 1,
          overflowY: 'auto',
          padding: '20px',
          marginLeft: isSidebarCollapsed ? '50px' : '390px',
          transition: 'margin-left 0.3s ease'
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
              dispatch(fetchPedidos());
              cerrarModalPedidos();
            }}
          />

          <ModalTareasProgramadas
            ref={modalTareasProgramadasRef}
            showModal={showProgramadasModal}
            onClose={() => setShowProgramadasModal(false)}
            onTareaGuardada={handleTareaGuardada}
            tarea={null}
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
              dispatch(fetchPedidos());
              setTareaEditando(null);
              setTareaSeleccionada(null);
            }}
            cambiarEstadoPedido={cambiarEstadoPedido}
          />

          <ModalProyectos
            show={showModalProyectos}
            onClose={() => setShowModalProyectos(false)}
            usuario={usuario}
            sectores={sectores}
          />

          {/* Estados de carga y error */}
          {loadingPedidos && (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-secondary mt-2">Cargando pedidos...</p>
            </div>
          )}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {/* Tarjetas de pedidos agrupadas por fecha */}
          {!loadingPedidos && !errorPedidos && (
            <div className="row mt-3">
              {(() => {
                const hoy = dayjs().startOf('day');
                const ayer = hoy.subtract(1, 'day');
                const limiteAntiguedad = dayjs().subtract(4, 'day').startOf('day');

                const pedidosHoy = pedidos.filter(p => dayjs(p.created_at).isAfter(hoy));
                const pedidosAyer = pedidos.filter(p => dayjs(p.created_at).isAfter(ayer) && dayjs(p.created_at).isBefore(hoy));
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
                            justifyContent: "flex-start",
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
                            justifyContent: "flex-start",
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
                            justifyContent: "flex-start",
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
};
