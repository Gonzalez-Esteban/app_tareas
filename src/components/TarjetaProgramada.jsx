import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase/supabaseClient';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/es';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.locale('es');

const TarjetaProgramada = ({
  tarea,
  selected = false,
  onSelect = () => {},
  onComplete = (id, estado) => {},
}) => {
  const [creador, setCreador] = useState('');
  const [asignados, setAsignados] = useState([]);
  const [tiempoRestante, setTiempoRestante] = useState('');
  const [estado, setEstado] = useState(tarea.estado || 'Pendiente');
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [demora, setDemora] = useState(null);


useEffect(() => {
  setEstado(tarea.estado || 'Pendiente');
}, [tarea.estado]);
  // Obtener información del creador y usuarios asignados
  useEffect(() => {
    const obtenerUsuarios = async () => {
      if (tarea.creado_por) {
        const { data: creadorData } = await supabase
          .from('usuarios')
          .select('Nombre')
          .eq('id_uuid', tarea.creado_por)
          .single();

        if (creadorData) setCreador(creadorData.Nombre);
      }

      if (tarea.usuarios_asignados?.length > 0) {
        const { data: asignadosData } = await supabase
          .from('usuarios')
          .select('Nombre')
          .in('id_uuid', tarea.usuarios_asignados);

        if (asignadosData) {
          setAsignados(asignadosData.map(u => u.Nombre));
        }
      }
    };

    obtenerUsuarios();
  }, [tarea.creado_por, tarea.usuarios_asignados]);

  // Calcular tiempo restante y estado automático
  useEffect(() => {
    if (estado === 'Realizada' || estado === 'Cancelada') return;

    const calcularTiempoYEstado = () => {
      if (!tarea.fecha_vencimiento) return;

      const ahora = dayjs();
      const fechaTarea = dayjs(tarea.fecha_vencimiento);

      const fechaCompleta = tarea.fecha_vencimiento
        ? fechaTarea.set('hour', tarea.hora_ejecucion?.split(':')[0] || 0)
                   .set('minute', tarea.hora_ejecucion?.split(':')[1] || 0)
        : fechaTarea.startOf('day');

      const diff = fechaCompleta.diff(ahora, 'minute');

      const dias = Math.floor(Math.abs(diff) / 1440);
      const horas = Math.floor((Math.abs(diff) % 1440) / 60);
      const minutos = Math.abs(diff) % 60;

      const tiempoStr = `${dias > 0 ? `${dias}d ` : ''}${horas > 0 ? `${horas}h ` : ''}${minutos}m`;

      if (diff <= 0) {
        setTiempoRestante(`${tiempoStr}`);
        setEstado(tarea.estado === 'Realizada' ? 'Realizada' : 'Vencida');
      } else if (diff <= 30) {
        setTiempoRestante(`${tiempoStr}`);
        setEstado('Por vencer');
      } else {
        setTiempoRestante(`${tiempoStr}`);
        setEstado('Pendiente');
      }
    };

    calcularTiempoYEstado();
    const interval = setInterval(calcularTiempoYEstado, 60000);
    
    return () => clearInterval(interval);
  }, [tarea.fecha_vencimiento, tarea.hora_ejecucion, estado]);

  const calcularDemora = () => {
    const ahora = dayjs();
    const fechaVencimiento = dayjs(tarea.fecha_vencimiento)
      .set('hour', tarea.hora_ejecucion?.split(':')[0] || 0)
      .set('minute', tarea.hora_ejecucion?.split(':')[1] || 0);
    
    const minutosDemora = ahora.diff(fechaVencimiento, 'minute');
    
    return {
      minutos: minutosDemora > 0 ? minutosDemora : 0,
      formateada: minutosDemora > 0 ? 
        `${Math.floor(minutosDemora / 1440)}d ${Math.floor((minutosDemora % 1440) / 60)}h ${minutosDemora % 60}m` : 
        '0m'
    };
  };

  const marcarComoRealizada = async (e) => {
    e.stopPropagation();
    setLoading(true);

    try {
      // 1. Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('No se pudo obtener el usuario');

      // 2. Calcular demora
      const { minutos, formateada } = calcularDemora();

      // 3. Calcular próxima fecha de ejecución si es recurrente
      if (tarea.tipo_recurrencia && tarea.tipo_recurrencia !== 'única' && tarea.activa) {
        const proximaFecha = calcularProximaFecha(tarea);
        
        // Actualizar programadas con la próxima ejecución
        await supabase
          .from('programadas')
          .update({
            proxima_ejecucion: proximaFecha
          })
          .eq('id', tarea.id_prog);
      }

      // 4. Actualizar registro en registro_programadas
      const { error: updateError } = await supabase
        .from('registro_programadas')
        .update({
          estado: 'Realizada',
          fecha_finalizado: new Date().toISOString(),
          finalizo: user.id,
          demora: minutos.toString()
        })
        .eq('id_prog', tarea.id);

      if (updateError) throw updateError;

      // 5. Actualización optimista mínima (opcional)
      onComplete(tarea.id, 'Realizada'); // Solo para notificar al componente padre

    } catch (error) {
      console.error('Error al completar tarea:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calcularProximaFecha = (tarea) => {
    const fechaActual = dayjs(tarea.fecha_vencimiento);
    
    switch(tarea.tipo_recurrencia) {
      case 'diaria':
        return fechaActual.add(1, 'day').toISOString();
      case 'semanal':
        return fechaActual.add(1, 'week').toISOString();
      case 'mensual':
        return fechaActual.add(1, 'month').toISOString();
      default:
        return null;
    }
  };

const cancelarTarea = async (e) => {
  e.stopPropagation();
  setCancelLoading(true);

  try {
    // 1. Actualización optimista (cambia el estado inmediatamente)
    onComplete(tarea.registro_id, 'Cancelada'); // Notifica al componente padre

    // 2. Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('No se pudo obtener el usuario');

    // 3. Calcular demora
    const { minutos } = calcularDemora();

    // 4. Actualizar registro principal
    const updatePromise = supabase
      .from('registro_programadas')
      .update({
        estado: 'Cancelada',
        fecha_finalizado: new Date().toISOString(),
        finalizo: user.id,
        demora: minutos.toString()
      })
      .eq('id', tarea.registro_id); // Cambiado a registro_id que es el ID directo

    // 5. Ejecutar operación y refrescar en segundo plano
    await updatePromise;
  } catch (error) {
    console.error('Error al cancelar tarea:', error);
    // Revertir la actualización optimista en caso de error
    onComplete(tarea.registro_id, tarea.estado);
    toast.error(`Error al cancelar tarea: ${error.message}`);
  } finally {
    setCancelLoading(false);
  }
};
  const getEstadoStyles = () => {
    switch (estado) {
      case 'Realizada': return 'bg-success';
      case 'Vencida': return 'bg-danger';
      case 'Por vencer': return 'bg-warning text-dark';
      case 'Cancelada': return 'bg-secondary';
      default: return 'bg-primary';
    }
  };

  const getFechaProgramada = () => {
    if (!tarea.fecha_vencimiento) return '';
    
    // Crear objeto dayjs a partir del timestamp completo
    const fechaHora = dayjs(tarea.fecha_vencimiento);
    
    // Extraer y formatear componentes
    const fecha = fechaHora.format('DD/MM/YYYY');

    
    return `${fecha}`;
  };

  const getHoraProgramada = () => {
    if (!tarea.fecha_vencimiento) return '';
    
    // Crear objeto dayjs a partir del timestamp completo
    const fechaHora = dayjs(tarea.fecha_vencimiento);

    const hora = fechaHora.format('HH:mm');
    
    return `${hora}`;
  };

return (
    <div
      className={`card mb-2 border-${selected ? 'light' : 'secondary'}`}
      onClick={(e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
          onSelect(tarea.registro_id);
        }
      }}
      style={{
        cursor: 'pointer',
        backgroundColor: estado === 'Realizada' ? '#1a1e21' : estado === 'Cancelada' ? '#2a2e32' : '#212529',
        opacity: estado === 'Realizada' || estado === 'Cancelada' ? 0.7 : 1,
        borderWidth: selected ? '2px' : '1px'
      }}
    >
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">        
          <div className="d-flex align-items-center">
            <i className="bi bi-calendar-event me-2 text-white"></i>
            <small className="text-white" style={{ fontSize: '0.8rem' }}>
              {getHoraProgramada()}
            </small>
          </div>
          <h6 className="card-title mb-0 text-white" style={{ fontSize: '1rem', flex: 1, margin: '0 8px' }}>
            {tarea.descripcion}
          </h6>
          <div className="d-flex flex-column align-items-center" style={{ minWidth: '80px' }}>
            <span className={`badge ${getEstadoStyles()} mb-1`}>
              {estado} 
            </span>
            <small className={
              estado === 'Vencida' ? 'text-danger' :
              estado === 'Por vencer' ? 'text-warning' : 
              estado === 'Realizada' ? 'text-success' :
              estado === 'Cancelada' ? 'text-secondary' : 'text-white'
            } style={{ 
              fontWeight: '650', 
              fontSize: '0.7rem',
              textAlign: 'center',
              width: '100%'
            }}>
              {estado === 'Realizada' || estado === 'Cancelada' ? (demora || '0m') : tiempoRestante}
            </small>
          </div>       
        </div>

        {asignados.length > 0 && (
          <div className="mb-2 d-flex align-items-center">
            <i className="bi bi-people-fill me-2 text-white"></i>
            <div className="d-flex flex-wrap gap-1 align-items-center">
              {asignados.map((nombre, index) => (
                <span key={index} className="badge bg-secondary">
                  {nombre}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="d-flex align-items-center mt-2 pt-2 border-top border-secondary">
          <div className="d-flex justify-content-between align-items-center w-100 text-white">
            <div className="d-flex flex-column">
              <small className="text-white">
                Generó: {creador || 'usuario'}
              </small>
            </div>
            <div className="d-flex">
              {estado !== 'Realizada' && estado !== 'Cancelada' && (
                <>
                  <button 
                    className="btn btn-sm btn-outline-danger me-2"
                    onClick={cancelarTarea}
                    disabled={cancelLoading}
                    style={{ width: '32px' }}
                  >
                    {cancelLoading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-x"></i>
                    )}
                  </button>
                  <button 
                    className="btn btn-sm btn-outline-success"
                    onClick={marcarComoRealizada}
                    disabled={loading}
                    style={{ width: '32px' }}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    ) : (
                      <i className="bi bi-check"></i>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarjetaProgramada;