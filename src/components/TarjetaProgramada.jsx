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
  onSelect = () => { },
  onComplete = () => { },
}) => {
  const [creador, setCreador] = useState('');
  const [asignados, setAsignados] = useState([]);
  const [tiempoRestante, setTiempoRestante] = useState('');
  const [estado, setEstado] = useState(tarea.estado || 'Pendiente');
  const [loading, setLoading] = useState(false);
  const [demora, setDemora] = useState(null);

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
    // Si la tarea ya está realizada, no calculamos tiempo
    if (estado === 'Realizada') return;

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
    const interval = setInterval(calcularTiempoYEstado, 60000); // Actualizar cada minuto
    
    return () => clearInterval(interval);
  }, [tarea.fecha_vencimiento, tarea.hora_ejecucion, estado]);

  const marcarComoRealizada = async (e) => {
    e.stopPropagation();
    setLoading(true);

    try {
      // Calcular la demora (diferencia entre ahora y la fecha de vencimiento)
      const ahora = dayjs();
      const fechaVencimiento = dayjs(tarea.fecha_vencimiento)
        .set('hour', tarea.hora_ejecucion?.split(':')[0] || 0)
        .set('minute', tarea.hora_ejecucion?.split(':')[1] || 0);
      
      const minutosDemora = ahora.diff(fechaVencimiento, 'minute');
      const demoraFormateada = minutosDemora > 0 ? 
        `${Math.floor(minutosDemora / 1440)}d ${Math.floor((minutosDemora % 1440) / 60)}h ${minutosDemora % 60}m` : 
        'A tiempo';

      const { data, error } = await supabase
        .from('programadas')
        .update({
          estado: 'Realizada',
          //fecha_completado: new Date().toISOString(),
          demora: minutosDemora > 0 ? minutosDemora : 0
        })
        .eq('id', tarea.id);

      if (error) throw error;

      setEstado('Realizada');
      setTiempoRestante('Completada');
      setDemora(demoraFormateada);
      onComplete(tarea.id);
    } catch (error) {
      console.error('Error al marcar como realizada:', error);
      alert('Error al marcar como realizada');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoStyles = () => {
    switch (estado) {
      case 'Realizada': return 'bg-success';
      case 'Vencida': return 'bg-danger';
      case 'Por vencer': return 'bg-warning text-dark';
      default: return 'bg-primary';
    }
  };

  const getFechaFormateada = () => {
    if (!tarea.created_at) return '';
    return dayjs(tarea.created_at).format('DD/MM/YYYY') + (tarea.hora_ejecucion ? ` a las ${tarea.hora_ejecucion}` : '');
  };

  return (
    <div
      className={`card mb-2 border-${selected ? 'light' : 'secondary'}`}
      onClick={(e) => {
        if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) {
          onSelect(tarea.id);
        }
      }}
      style={{
        cursor: 'pointer',
        backgroundColor: estado === 'Realizada' ? '#1a1e21' : '#212529',
        opacity: estado === 'Realizada' ? 0.7 : 1,
        borderWidth: selected ? '2px' : '1px'
      }}
    >
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <i className="bi bi-calendar-event me-1 text-white"></i>   
          <h6 className="card-title mb-0 text-white" style={{ fontSize: '1rem'}}>
            {tarea.descripcion}
          </h6>
          <div className="d-flex flex-column align-items-end">
            <span className={`badge ${getEstadoStyles()} mb-1`}>
              {estado} 
            </span>
            <small className={
              estado === 'Vencida' ? 'text-danger' :
              estado === 'Por vencer' ? 'text-warning' : 
              estado === 'Realizada' ? 'text-success' : 'text-white'
            } style={{ fontWeight: '650', fontSize: '0.7rem'}}>
              {estado === 'Realizada' ? (demora || '0m') : `${tiempoRestante}`}
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
              <small className="text-white" style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                {getFechaFormateada()}
              </small>
            </div>
            {estado !== 'Realizada' && (
              <button 
                className="btn btn-sm btn-outline-success me-2"
                onClick={marcarComoRealizada}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true"></span>
                ) : (
                  <i className="bi bi-check"></i>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TarjetaProgramada;