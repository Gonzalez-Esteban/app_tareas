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
    const calcularTiempoYEstado = () => {
      if (!tarea.fecha) return;

      const ahora = dayjs();
      const fechaTarea = dayjs(tarea.fecha);

      const fechaCompleta = tarea.hora
        ? fechaTarea.set('hour', tarea.hora.split(':')[0]).set('minute', tarea.hora.split(':')[1])
        : fechaTarea.startOf('day');

      const diff = fechaCompleta.diff(ahora, 'minute');

      const dias = Math.floor(Math.abs(diff) / 1440);
      const horas = Math.floor((Math.abs(diff) % 1440) / 60);
      const minutos = Math.abs(diff) % 60;

      const tiempoStr = `${dias > 0 ? `${dias}d ` : ''}${horas > 0 ? `${horas}h ` : ''}${minutos}m`;

      if (diff <= 0) {
        setTiempoRestante(`Vencida hace ${tiempoStr}`);
        setEstado(tarea.estado === 'Realizada' ? 'Realizada' : 'Vencida');
      } else if (diff <= 30) {
        setTiempoRestante(`Por vencer en ${tiempoStr}`);
        setEstado('Por vencer');
      } else {
        setTiempoRestante(`Vence en ${tiempoStr}`);
        setEstado('Pendiente');
      }
    };

    calcularTiempoYEstado();
    const interval = setInterval(calcularTiempoYEstado, 60000);
    //console.log(clearInterval(interval))
    return () => clearInterval(interval);
  }, [tarea.fecha, tarea.hora, tarea.estado]);

  const marcarComoRealizada = async (e) => {
    e.stopPropagation();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('programadas')
        .update({
          estado: 'Realizada',
          //fecha_completado: new Date().toISOString()
        })
        .eq('id', tarea.id)
        .select(); // Agrega esto para obtener más detalles del error

      if (error) {
        console.error('Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      setEstado('Realizada');
      setTiempoRestante('Completada');
      onComplete(tarea.id);
    } catch (error) {
      console.error('Error completo:', {
        error: error,
        tareaId: tarea.id,
        datosEnviados: {
          estado: 'Realizada'
          // fecha_completado: new Date().toISOString()
        }
      });
      alert('Error al marcar como realizada. Verifica la consola para más detalles.');
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
    if (!tarea.fecha) return '';
    return dayjs(tarea.fecha).format('DD/MM/YYYY') + (tarea.hora ? ` a las ${tarea.hora}` : '');
  };

  return (
    <div
      className={`card mb-2 border-${selected ? 'primary' : 'secondary'}`}
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
          <h6 className="card-title mb-0 text-white" style={{ fontSize: '1rem' }}>
            {tarea.descripcion}
          </h6>
          <span className={`badge ${getEstadoStyles()}`}>
            {estado}
          </span>
        </div>


        <div className="d-flex justify-content-between align-items-center">
          <small className="text-white">

            {getFechaFormateada()}
          </small>
          <small className={
            estado === 'Vencida' ? 'text-danger' :
              estado === 'Por vencer' ? 'text-warning' : 'text-success'
          }>
            {tiempoRestante}
          </small>
        </div>

        {asignados.length > 0 && (
          <div className="mb-2">
            <small className="text-white d-block mb-1">Asignado:</small>
            <div className="d-flex flex-wrap gap-1">
              {asignados.map((nombre, index) => (
                <span key={index} className="badge bg-secondary">
                  {nombre}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="d-flex align-items-center mt-2 pt-2 border-top border-secondary text-white">
  <div className="d-flex justify-content-between align-items-center w-100">
    <small className="text-white">
      Generó: {creador || 'usuario'}
    </small>
    
    {estado !== 'Realizada' && (
      <button 
        className="btn btn-sm btn-outline-success bg-transparent"
        onClick={marcarComoRealizada}
        disabled={loading}
        style={{
          borderWidth: '2px',
          transition: 'all 0.3s ease',
          // Estilos normales
          ':hover': {
            backgroundColor: 'rgba(40, 167, 69, 0.1)', // Verde muy transparente
            borderColor: '#28a745',
            color: '#28a745'
          },
          ':active': {
            backgroundColor: 'rgba(40, 167, 69, 0.2)' // Verde un poco más opaco al hacer clic
          }
        }}
      >
        {loading ? (
          <span className="spinner-border spinner-border-sm text-success" role="status" aria-hidden="true"></span>
        ) : (
          <i className="bi bi-check text-success"></i>
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