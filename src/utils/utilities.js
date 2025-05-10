// En un archivo utilities.js
export const calcularTiempoTranscurrido = (inicio, fin) => {
    const diff = dayjs(fin).diff(dayjs(inicio));
    const duracion = dayjs.duration(diff);
    return `${duracion.days()}d${duracion.hours()- 3}h${duracion.minutes()}m`;
  };