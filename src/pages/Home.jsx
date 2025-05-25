import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "../supabase/supabaseClient";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';
import { toast } from 'react-toastify';
import NavBar from "../components/NavBar";
import Body from "../components/Body";

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
  const [mostrarSoloPendientes, setMostrarSoloPendientes] = useState(true);
  const [localRefresh, setLocalRefresh] = useState(0);
  const tareasRef = useRef(null);
  const accionesRef = useRef(null);
  const tareasContainerRef = useRef(null);
  const modalTareasProgramadasRef = useRef();

  // Efectos y funciones del componente...
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

  const tareasFiltradas = useMemo(() => {
    return tareasProgramadas
      .filter(t => !mostrarSoloPendientes || t.estado.toLowerCase() === 'pendiente')
      .sort((a, b) => {
        const fechaA = dayjs(a.fecha_vencimiento || a.fecha + (a.hora ? `T${a.hora}` : ''));
        const fechaB = dayjs(b.fecha_vencimiento || b.fecha + (b.hora ? `T${b.hora}` : ''));
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target) &&
        pedidoSeleccionado
      ) {
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
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const cargarProgramadas = async () => {
    try {
      const hoyInicio = dayjs().startOf('day').toISOString();
      const hoyFin = dayjs().endOf('day').toISOString();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('registro_programadas')
        .select(`
          id,                   
          estado,
          fecha_vencimiento,
          demora,
          id_prog,              
          programadas (
            id,
            descripcion,
            creado_por,
            usuarios_asignados,
            tipo_recurrencia,
            activa
          )
        `)
        .eq('programadas.activa', true)
        .gte('fecha_vencimiento', hoyInicio)
        .lte('fecha_vencimiento', hoyFin)
        .order('fecha_vencimiento', { ascending: true });

      if (error) throw error;

      const tareasFiltradas = data
        .filter(item => item.programadas !== null)
        .map(r => ({
          ...r,
          ...r.programadas,
          registro_id: r.id,
        }));

      setTareasProgramadas(tareasFiltradas);

    } catch (error) {
      console.error('Error al cargar tareas programadas:', error);
      toast.error('Error al cargar tareas programadas');
    }
  };

  const calcularProximaFecha = (tarea) => {
    if (!tarea?.fecha_vencimiento) return null;

    const fechaActual = dayjs(tarea.fecha_vencimiento);
    
    switch(tarea.tipo_recurrencia) {
      case 'diaria':
        return fechaActual.add(tarea.intervalo_recurrencia || 1, 'day').toISOString();
      case 'semanal':
        return fechaActual.add(tarea.intervalo_recurrencia || 1, 'week').toISOString();
      case 'mensual':
        return fechaActual.add(tarea.intervalo_recurrencia || 1, 'month').toISOString();
      default:
        return null;
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

    handleResize();
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

  const cargarTareasPendientes = async () => {
    setLoading(true);
    try {
      const hoyInicio = dayjs().startOf('day').toISOString();
      const hoyFin = dayjs().endOf('day').toISOString();

      const { data, error } = await supabase
        .from('registro_programadas')
        .select(`
          *,
          programada: id_programada (
            *,
            historial: registro_programadas (
              *,
              usuario: create_for (*)
            )
          )
        `)
        .eq('estado', 'pendiente')
        .gte('fecha_vencimiento', hoyInicio)
        .lte('fecha_vencimiento', hoyFin)
        .order('fecha_ejecucion', { ascending: true });

      if (error) throw error;
      setTareasProgramadas(data || []);
    } catch (err) {
      console.error("Error cargando tareas:", err);
      setError("Error al cargar tareas");
    } finally {
      setLoading(false);
    }
  };

  const completarTarea = async (idRegistro, estado) => {
    try {
      await supabase
        .from('registro_programadas')
        .update({ estado })
        .eq('id', idRegistro);
      
      await cargarTareasPendientes();
    } catch (error) {
      console.error("Error completando tarea:", error);
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
      <NavBar
        usuario={usuario}
        saludo={saludo}
        abrirNuevoPedido={abrirNuevoPedido}
        abrirModalProgramadas={abrirModalProgramadas}
        pedidoSeleccionado={pedidoSeleccionado}
        tareaSeleccionada={tareaSeleccionada}
        borrarPedido={borrarPedido}
        abrirModalEdicion={abrirModalEdicion}
        abrirModalNuevaTarea={abrirModalNuevaTarea}
        abrirModalEditarTarea={abrirModalEditarTarea}
        sectores={sectores}
        setFiltroSector={setFiltroSector}
        cargarPedidos={cargarPedidos}
        setFiltroEstado={setFiltroEstado}
        handleLogout={handleLogout}
      />

      <Body
        usuario={usuario}
        sectores={sectores}
        pedidos={pedidos}
        loading={loading}
        error={error}
        pedidoSeleccionado={pedidoSeleccionado}
        tareaSeleccionada={tareaSeleccionada}
        showPedidosModal={showPedidosModal}
        showTareasModal={showTareasModal}
        showProgramadasModal={showProgramadasModal}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        tareasProgramadas={tareasProgramadas}
        mostrarSoloPendientes={mostrarSoloPendientes}
        setMostrarSoloPendientes={setMostrarSoloPendientes}
        timeRefresh={timeRefresh}
        localRefresh={localRefresh}
        obtenerNombreSector={obtenerNombreSector}
        borrarPedido={borrarPedido}
        abrirModalEdicion={abrirModalEdicion}
        cambiarEstadoPedido={cambiarEstadoPedido}
        calcularTiempoTranscurrido={calcularTiempoTranscurrido}
        cerrarModalPedidos={cerrarModalPedidos}
        cargarPedidos={cargarPedidos}
        cargarProgramadas={cargarProgramadas}
        abrirModalProgramadas={abrirModalProgramadas}
        abrirModalNuevaTarea={abrirModalNuevaTarea}
        abrirModalEditarTarea={abrirModalEditarTarea}
        setPedidoSeleccionado={setPedidoSeleccionado}
        setTareaSeleccionada={setTareaSeleccionada}
        setShowProgramadasModal={setShowProgramadasModal}
        modalTareasProgramadasRef={modalTareasProgramadasRef}
        pedidoEditando={pedidoEditando}
        tareaEditando={tareaEditando}
        modoTarea={modoTarea}
      />
    </div>
  );
}