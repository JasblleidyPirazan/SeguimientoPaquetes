/**
 * Generador de Reportes Detallados por Usuario
 * Crea reportes en Excel con análisis de inconsistencias por usuario
 */

import * as XLSX from 'xlsx';
import { CODIGO_ERROR } from './validador';

/**
 * Genera un reporte detallado de inconsistencias para un usuario específico
 * @param {string} documentoId - ID del documento del usuario
 * @param {string} nombreUsuario - Nombre completo del usuario
 * @param {Array} reservasEasyCancha - Todas las reservas de EasyCancha
 * @param {Array} registrosControl - Todos los registros del control manual
 * @param {Object} resultadoValidacion - Resultado completo de la validación
 * @returns {Workbook} - Objeto de libro de Excel
 */
export function generarReporteUsuario(documentoId, nombreUsuario, reservasEasyCancha, registrosControl, resultadoValidacion) {

  // Filtrar datos del usuario
  const reservasUsuario = reservasEasyCancha.filter(r => r.documentoId === documentoId);
  const registrosUsuario = registrosControl.filter(r => r.documentoId === documentoId);

  // Filtrar errores del usuario
  const erroresUsuario = filtrarErroresUsuario(documentoId, resultadoValidacion.errores);

  // Crear libro de Excel
  const workbook = XLSX.utils.book_new();

  // HOJA 1: Resumen Ejecutivo
  const hojaResumen = crearHojaResumen(documentoId, nombreUsuario, reservasUsuario, registrosUsuario, erroresUsuario);
  XLSX.utils.book_append_sheet(workbook, hojaResumen, 'Resumen');

  // HOJA 2: Inconsistencias Detalladas
  const hojaInconsistencias = crearHojaInconsistencias(erroresUsuario, reservasUsuario, registrosUsuario);
  XLSX.utils.book_append_sheet(workbook, hojaInconsistencias, 'Inconsistencias');

  // HOJA 3: Paquetes del Usuario
  const hojaPaquetes = crearHojaPaquetes(registrosUsuario);
  XLSX.utils.book_append_sheet(workbook, hojaPaquetes, 'Paquetes');

  // HOJA 4: Historial Completo
  const hojaHistorial = crearHojaHistorial(reservasUsuario, registrosUsuario);
  XLSX.utils.book_append_sheet(workbook, hojaHistorial, 'Historial');

  return workbook;
}

/**
 * Filtra errores que pertenecen a un usuario específico
 */
function filtrarErroresUsuario(documentoId, errores) {
  const filtrados = {
    criticos: [],
    advertencias: [],
    info: []
  };

  // Función helper para verificar si un error pertenece al usuario
  const perteneceAUsuario = (error) => {
    // Estructura 1: objetos directos
    if (error.reserva?.documento === documentoId) return true;
    if (error.control?.documentoId === documentoId) return true;
    // Estructura 2: objetos anidados en datos
    if (error.datos?.reserva?.documento === documentoId) return true;
    if (error.datos?.control?.documentoId === documentoId) return true;
    // Estructura 3: errores de paquete
    if (error.paquete?.documento === documentoId) return true;
    return false;
  };

  // Filtrar cada categoría
  filtrados.criticos = errores.criticos.filter(perteneceAUsuario);
  filtrados.advertencias = errores.advertencias.filter(perteneceAUsuario);
  filtrados.info = errores.info.filter(perteneceAUsuario);

  return filtrados;
}

/**
 * Crea la hoja de resumen ejecutivo
 */
function crearHojaResumen(documentoId, nombreUsuario, reservas, registros, errores) {
  // Agrupar errores por tipo para el resumen
  const errorPorTipo = agruparErroresPorTipo(errores);

  const data = [
    ['🎾 REPORTE DE INCONSISTENCIAS'],
    [`${nombreUsuario} (Documento: ${documentoId})`],
    [],
    ['⚠️ DASHBOARD DE INCONSISTENCIAS'],
    []
  ];

  // Contar errores por tipo
  const contadores = {
    reservasSinControl: errorPorTipo[CODIGO_ERROR.RESERVA_SIN_CONTROL]?.length || 0,
    controlSinReserva: errorPorTipo[CODIGO_ERROR.CONTROL_SIN_RESERVA]?.length || 0,
    paqueteIncorrecto: errorPorTipo[CODIGO_ERROR.PAQUETE_INCORRECTO]?.length || 0,
    conteoDiferente: errorPorTipo[CODIGO_ERROR.CONTEO_DIFERENTE]?.length || 0,
    conteoExcedido: errorPorTipo[CODIGO_ERROR.CONTEO_EXCEDIDO]?.length || 0,
    canceladoConDescuento: errorPorTipo[CODIGO_ERROR.CANCELADO_CON_DESCUENTO]?.length || 0,
    dobleDescuento: errorPorTipo[CODIGO_ERROR.DOBLE_DESCUENTO]?.length || 0
  };

  // Mostrar solo los tipos de error que existen
  data.push(['Tipo de Inconsistencia', 'Cantidad', 'Severidad']);

  if (contadores.reservasSinControl > 0) {
    data.push(['Reservas USED sin registro en Control', contadores.reservasSinControl, '🔴 CRÍTICO']);
  }
  if (contadores.controlSinReserva > 0) {
    data.push(['Registros en Control sin reserva USED', contadores.controlSinReserva, '🟡 ADVERTENCIA']);
  }
  if (contadores.paqueteIncorrecto > 0) {
    data.push(['Paquete ≠ Tipo de Actividad', contadores.paqueteIncorrecto, '🔴 CRÍTICO']);
  }
  if (contadores.conteoDiferente > 0) {
    data.push(['Error en secuencia de paquete (X de Y)', contadores.conteoDiferente, '🟡 ADVERTENCIA']);
  }
  if (contadores.conteoExcedido > 0) {
    data.push(['Paquete excede límite permitido', contadores.conteoExcedido, '🔴 CRÍTICO']);
  }
  if (contadores.canceladoConDescuento > 0) {
    data.push(['Reserva CANCELLED con descuento', contadores.canceladoConDescuento, '🟡 ADVERTENCIA']);
  }
  if (contadores.dobleDescuento > 0) {
    data.push(['Doble descuento aplicado', contadores.dobleDescuento, '🔴 CRÍTICO']);
  }

  data.push([]);
  data.push(['TOTAL INCONSISTENCIAS', errores.criticos.length + errores.advertencias.length + errores.info.length]);
  data.push(['├─ Críticas (requieren acción inmediata)', errores.criticos.length]);
  data.push(['├─ Advertencias (revisar y corregir)', errores.advertencias.length]);
  data.push(['└─ Información (solo referencia)', errores.info.length]);

  data.push([]);
  data.push(['📊 TOTALES GENERALES']);
  data.push(['Reservas USED en API EasyCancha', reservas.filter(r => r.esUsado).length]);
  data.push(['Registros "Usada" en Control Manual', registros.filter(r => r.estadoFinal === 'Usada').length]);
  data.push(['Total de paquetes registrados', new Set(registros.filter(r => r.idPaquete).map(r => `${r.codigoProducto}-${r.idPaquete}`)).size]);

  return XLSX.utils.aoa_to_sheet(data);
}

/**
 * Crea la hoja de inconsistencias detalladas
 */
function crearHojaInconsistencias(errores, reservas, registros) {
  const data = [
    ['🔴 INCONSISTENCIAS DETALLADAS'],
    []
  ];

  // Agrupar errores por tipo
  const errorPorTipo = agruparErroresPorTipo(errores);

  let inconsistenciaNumero = 1;

  // INCONSISTENCIA 1: Reservas sin registro en control
  if (errorPorTipo[CODIGO_ERROR.RESERVA_SIN_CONTROL]?.length > 0) {
    data.push([`🔴 INCONSISTENCIA ${inconsistenciaNumero}: Reservas sin registro en Control`]);
    data.push(['Fecha', 'Hora', 'Tipo Actividad', 'Cancha', 'Estado API', 'Observación']);

    errorPorTipo[CODIGO_ERROR.RESERVA_SIN_CONTROL].forEach(error => {
      const reserva = error.datos?.reserva || error.reserva;
      data.push([
        reserva.fecha,
        reserva.hora || reserva.horaInicio,
        reserva.tipoActividad || reserva.sportName,
        reserva.cancha,
        'USED ✓',
        error.mensaje
      ]);
    });

    data.push([]);
    inconsistenciaNumero++;
  }

  // INCONSISTENCIA 2: Control sin reserva USED
  if (errorPorTipo[CODIGO_ERROR.CONTROL_SIN_RESERVA]?.length > 0) {
    data.push([`🟡 INCONSISTENCIA ${inconsistenciaNumero}: Registro en Control sin reserva USED`]);
    data.push(['Fecha', 'Hora', 'Paquete', 'Avance', 'Observación']);

    errorPorTipo[CODIGO_ERROR.CONTROL_SIN_RESERVA].forEach(error => {
      const control = error.datos?.control || error.control;
      data.push([
        control.fecha,
        control.horaInicio,
        control.nombreProducto,
        control.usoDePaquete,
        control.observaciones || error.mensaje
      ]);
    });

    data.push([]);
    inconsistenciaNumero++;
  }

  // INCONSISTENCIA 3: Tipo de paquete incorrecto
  if (errorPorTipo[CODIGO_ERROR.PAQUETE_INCORRECTO]?.length > 0) {
    data.push([`🔶 INCONSISTENCIA ${inconsistenciaNumero}: Tipo de Paquete ≠ Tipo de Actividad`]);
    data.push(['Fecha', 'Hora', 'API dice', 'Control usa', 'Observación']);

    errorPorTipo[CODIGO_ERROR.PAQUETE_INCORRECTO].forEach(error => {
      const reserva = error.datos?.reserva || error.reserva;
      const control = error.datos?.control || error.control;
      data.push([
        reserva.fecha,
        reserva.hora || reserva.horaInicio,
        reserva.tipoActividad || reserva.sportName,
        control?.nombreProducto || 'N/A',
        error.mensaje
      ]);
    });

    data.push([]);
    inconsistenciaNumero++;
  }

  // INCONSISTENCIA 4: Conteo diferente
  if (errorPorTipo[CODIGO_ERROR.CONTEO_DIFERENTE]?.length > 0) {
    data.push([`🔵 INCONSISTENCIA ${inconsistenciaNumero}: Error en Denominador de Paquete`]);
    data.push(['Fecha', 'Avance Registrado', 'Observación']);

    errorPorTipo[CODIGO_ERROR.CONTEO_DIFERENTE].forEach(error => {
      const control = error.datos?.control || error.control;
      data.push([
        control.fecha,
        control.usoDePaquete,
        error.mensaje
      ]);
    });

    data.push([]);
    inconsistenciaNumero++;
  }

  // INCONSISTENCIA 5: Cancelado con descuento
  if (errorPorTipo[CODIGO_ERROR.CANCELADO_CON_DESCUENTO]?.length > 0) {
    data.push([`⚠️ INCONSISTENCIA ${inconsistenciaNumero}: Reserva Cancelada con Descuento de Paquete`]);
    data.push(['Fecha', 'Hora', 'Paquete', 'Estado API', 'Observación']);

    errorPorTipo[CODIGO_ERROR.CANCELADO_CON_DESCUENTO].forEach(error => {
      const reserva = error.datos?.reserva || error.reserva;
      const control = error.datos?.control || error.control;
      data.push([
        reserva.fecha,
        reserva.hora || reserva.horaInicio,
        control?.nombreProducto || 'N/A',
        'CANCELLED',
        error.mensaje
      ]);
    });

    data.push([]);
  }

  return XLSX.utils.aoa_to_sheet(data);
}

/**
 * Crea la hoja de resumen de paquetes
 */
function crearHojaPaquetes(registros) {
  const data = [
    ['📦 RESUMEN DE PAQUETES'],
    []
  ];

  // Agrupar registros por código de producto
  const paquetesPorCodigo = {};
  registros.forEach(reg => {
    if (reg.codigoProducto && reg.idPaquete) {
      const key = `${reg.codigoProducto}-${reg.idPaquete}`;
      if (!paquetesPorCodigo[key]) {
        paquetesPorCodigo[key] = {
          codigo: reg.codigoProducto,
          nombre: reg.nombreProducto,
          idPaquete: reg.idPaquete,
          estado: reg.estado,
          usos: [],
          total: reg.totalPaquete
        };
      }
      paquetesPorCodigo[key].usos.push(reg);
    }
  });

  // Crear tabla de paquetes
  data.push(['Código', 'Nombre', 'ID Paquete', 'Cantidad', 'Usos', 'Estado']);

  Object.values(paquetesPorCodigo)
    .sort((a, b) => a.codigo - b.codigo)
    .forEach(paquete => {
      data.push([
        paquete.codigo,
        paquete.nombre,
        paquete.idPaquete,
        paquete.total || paquete.usos.length,
        paquete.usos.length,
        paquete.estado
      ]);
    });

  return XLSX.utils.aoa_to_sheet(data);
}

/**
 * Crea la hoja de historial completo
 */
function crearHojaHistorial(reservas, registros) {
  const data = [
    ['📋 HISTORIAL COMPLETO DE ACTIVIDADES'],
    [],
    ['RESERVAS EN API (EasyCancha)'],
    ['Fecha', 'Hora Inicio', 'Hora Fin', 'Actividad', 'Cancha', 'Estado', 'Booking ID']
  ];

  // Agregar reservas ordenadas por fecha
  reservas
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .forEach(r => {
      data.push([
        r.fecha,
        r.horaInicio,
        r.horaFin,
        r.sportName,
        r.cancha,
        r.estado,
        r.bookingId
      ]);
    });

  data.push([]);
  data.push(['REGISTROS EN CONTROL MANUAL']);
  data.push(['Fecha', 'Hora Inicio', 'Hora Fin', 'Producto', 'Cancha', 'Paquete', 'Avance', 'Estado']);

  // Agregar registros ordenados por fecha
  registros
    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
    .forEach(r => {
      data.push([
        r.fecha,
        r.horaInicio,
        r.horaFin,
        r.nombreProducto,
        r.cancha,
        r.idPaquete,
        r.usoDePaquete,
        r.estadoFinal
      ]);
    });

  return XLSX.utils.aoa_to_sheet(data);
}

/**
 * Agrupa errores por código de error
 */
function agruparErroresPorTipo(errores) {
  const agrupado = {};

  const todosErrores = [
    ...errores.criticos,
    ...errores.advertencias,
    ...errores.info
  ];

  todosErrores.forEach(error => {
    if (!agrupado[error.codigo]) {
      agrupado[error.codigo] = [];
    }
    agrupado[error.codigo].push(error);
  });

  return agrupado;
}

/**
 * Descarga el reporte como archivo Excel
 */
export function descargarReporte(workbook, nombreUsuario, documentoId) {
  const nombreArchivo = `Reporte_${nombreUsuario.replace(/\s+/g, '_')}_${documentoId}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, nombreArchivo);
}

/**
 * Obtiene lista de usuarios únicos de las reservas
 */
export function obtenerListaUsuarios(reservasEasyCancha, registrosControl) {
  const usuariosMap = new Map();

  // Agregar de reservas
  reservasEasyCancha.forEach(r => {
    if (r.documentoId && r.nombreCompleto) {
      usuariosMap.set(r.documentoId, r.nombreCompleto);
    }
  });

  // Agregar de control (por si hay usuarios solo en control)
  registrosControl.forEach(r => {
    if (r.documentoId && r.nombreCompleto && !usuariosMap.has(r.documentoId)) {
      usuariosMap.set(r.documentoId, r.nombreCompleto);
    }
  });

  // Convertir a array y ordenar
  return Array.from(usuariosMap.entries())
    .map(([documento, nombre]) => ({ documento, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}
