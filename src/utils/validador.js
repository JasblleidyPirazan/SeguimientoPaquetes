/**
 * Motor de Validación
 * Cruza datos de EasyCancha con Control Manual y detecta inconsistencias
 */

import { PRODUCTOS, esPaqueteValidoParaReserva, SPORT_NAME_MAP } from '../data/productos';
import { agruparPorDocumento } from './parseEasyCancha';
import { agruparPorPaquete, agruparPorDocumentoControl } from './parseControlManual';

/**
 * Tipos de inconsistencias
 */
export const TIPO_ERROR = {
  CRITICO: 'CRITICO',
  ADVERTENCIA: 'ADVERTENCIA',
  INFO: 'INFO',
};

export const CODIGO_ERROR = {
  // Críticos
  RESERVA_SIN_CONTROL: 'RESERVA_SIN_CONTROL',
  CONTROL_SIN_RESERVA: 'CONTROL_SIN_RESERVA',
  PAQUETE_INCORRECTO: 'PAQUETE_INCORRECTO',
  CONTEO_EXCEDIDO: 'CONTEO_EXCEDIDO',
  DOBLE_DESCUENTO: 'DOBLE_DESCUENTO',
  
  // Advertencias
  CONTEO_DIFERENTE: 'CONTEO_DIFERENTE',
  ESTADO_DIFERENTE: 'ESTADO_DIFERENTE',
  HORARIO_INCORRECTO: 'HORARIO_INCORRECTO',
  CANCELADO_CON_DESCUENTO: 'CANCELADO_CON_DESCUENTO',
  PAQUETE_INACTIVO_CON_USOS: 'PAQUETE_INACTIVO_CON_USOS',
  
  // Info
  INTERCAMBIO_PENDIENTE: 'INTERCAMBIO_PENDIENTE',
  PAGO_PARCIAL: 'PAGO_PARCIAL',
};

/**
 * Crea un registro de error/inconsistencia
 */
function crearError(tipo, codigo, mensaje, datos = {}) {
  return {
    tipo,
    codigo,
    mensaje,
    ...datos,
    timestamp: new Date().toISOString(),
  };
}

/**
 * VALIDACIÓN 1: Cruce por llave (fecha + hora + documento)
 * Detecta reservas sin registro en control y viceversa
 */
export function validarCruceReservas(reservasEasyCancha, registrosControl) {
  const errores = [];
  
  // Crear índices por llave de cruce
  const indiceReservas = new Map();
  reservasEasyCancha.forEach(r => {
    if (r.llaveCruce && r.esUsado) { // Solo las usadas
      indiceReservas.set(r.llaveCruce, r);
    }
  });
  
  const indiceControl = new Map();
  registrosControl.forEach(c => {
    if (c.llaveCruce && !c.esEscuela && !c.esLibre) {
      indiceControl.set(c.llaveCruce, c);
    }
  });
  
  // Buscar reservas USED que no están en control
  indiceReservas.forEach((reserva, llave) => {
    if (!indiceControl.has(llave)) {
      errores.push(crearError(
        TIPO_ERROR.CRITICO,
        CODIGO_ERROR.RESERVA_SIN_CONTROL,
        `Reserva USED no encontrada en control manual`,
        {
          reserva: {
            bookingId: reserva.bookingId,
            fecha: reserva.fecha,
            hora: reserva.horaInicio,
            nombre: reserva.nombreCompleto,
            documento: reserva.documentoId,
            tipoActividad: reserva.sportName,
          }
        }
      ));
    }
  });
  
  // Buscar registros de control sin reserva correspondiente
  indiceControl.forEach((control, llave) => {
    if (!indiceReservas.has(llave)) {
      // Verificar si existe pero con otro estado
      const reservaEncontrada = reservasEasyCancha.find(r => 
        r.llaveCruce === llave && !r.esUsado
      );
      
      if (reservaEncontrada) {
        errores.push(crearError(
          TIPO_ERROR.ADVERTENCIA,
          CODIGO_ERROR.ESTADO_DIFERENTE,
          `Registro en control pero reserva con estado ${reservaEncontrada.estado}`,
          {
            control: {
              fila: control.filaExcel,
              fecha: control.fecha,
              hora: control.horaInicio,
              nombre: control.nombreCompleto,
            },
            reserva: {
              estado: reservaEncontrada.estado,
              bookingId: reservaEncontrada.bookingId,
            }
          }
        ));
      } else {
        errores.push(crearError(
          TIPO_ERROR.ADVERTENCIA,
          CODIGO_ERROR.CONTROL_SIN_RESERVA,
          `Registro en control sin reserva en EasyCancha`,
          {
            control: {
              fila: control.filaExcel,
              fecha: control.fecha,
              hora: control.horaInicio,
              nombre: control.nombreCompleto,
              documento: control.documentoId,
            }
          }
        ));
      }
    }
  });

  return errores;
}

/**
 * VALIDACIÓN 2: Tipo de paquete correcto
 * Verifica que el paquete usado corresponda al tipo de actividad
 */
export function validarTipoPaquete(reservasEasyCancha, registrosControl) {
  const errores = [];
  
  registrosControl.forEach(control => {
    if (!control.codigoProducto || control.esEscuela || control.esLibre) return;
    
    // Buscar la reserva correspondiente
    const reserva = reservasEasyCancha.find(r => r.llaveCruce === control.llaveCruce);
    if (!reserva) return;
    
    const producto = PRODUCTOS[control.codigoProducto];
    if (!producto) {
      errores.push(crearError(
        TIPO_ERROR.ADVERTENCIA,
        CODIGO_ERROR.PAQUETE_INCORRECTO,
        `Código de producto ${control.codigoProducto} no reconocido`,
        { control, reserva }
      ));
      return;
    }
    
    // Verificar que el tipo de paquete sea compatible
    const tipoReserva = reserva.tipoActividad;
    const esNocturno = reserva.esNocturno;
    const esMiniTenis = reserva.esMiniTenis;
    
    if (producto.categoria === 'PAQUETE') {
      const esValido = esPaqueteValidoParaReserva(
        control.codigoProducto, 
        tipoReserva, 
        esNocturno, 
        esMiniTenis
      );
      
      if (!esValido) {
        errores.push(crearError(
          TIPO_ERROR.CRITICO,
          CODIGO_ERROR.PAQUETE_INCORRECTO,
          `Paquete ${producto.nombre} no es válido para ${reserva.sportName}`,
          {
            control: {
              fila: control.filaExcel,
              codigoProducto: control.codigoProducto,
              nombreProducto: producto.nombre,
            },
            reserva: {
              tipoActividad: reserva.sportName,
              esNocturno,
              esMiniTenis,
              cancha: reserva.cancha,
            }
          }
        ));
      }
    }
  });

  return errores;
}

/**
 * VALIDACIÓN 3: Conteo de paquetes
 * Verifica que el conteo "X DE Y" sea consistente con los usos reales
 */
export function validarConteoPaquetes(reservasEasyCancha, registrosControl) {
  const errores = [];
  
  // Agrupar registros por ID de paquete
  const paquetes = agruparPorPaquete(registrosControl);
  
  Object.values(paquetes).forEach(paquete => {
    if (!paquete.idPaquete) return;
    
    // Contar cuántas reservas USED tiene este usuario para el tipo de actividad
    const reservasUsuario = reservasEasyCancha.filter(r => 
      r.documentoId === paquete.documentoId && r.esUsado
    );
    
    // Verificar secuencia de usos
    const usosOrdenados = paquete.usos
      .filter(u => u.usoActual !== null)
      .sort((a, b) => {
        if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
        return a.horaInicio.localeCompare(b.horaInicio);
      });
    
    // Verificar que la secuencia sea continua
    for (let i = 1; i < usosOrdenados.length; i++) {
      const anterior = usosOrdenados[i - 1].usoActual;
      const actual = usosOrdenados[i].usoActual;
      
      if (actual !== anterior && actual !== anterior + 1) {
        errores.push(crearError(
          TIPO_ERROR.ADVERTENCIA,
          CODIGO_ERROR.CONTEO_DIFERENTE,
          `Salto en secuencia de paquete: ${anterior} -> ${actual}`,
          {
            paquete: {
              id: paquete.idPaquete,
              documento: paquete.documentoId,
              nombre: paquete.nombre,
            },
            registros: [usosOrdenados[i - 1], usosOrdenados[i]]
          }
        ));
      }
    }
    
    // Verificar que no se exceda el total
    if (paquete.maxUsoRegistrado > paquete.totalPaquete) {
      errores.push(crearError(
        TIPO_ERROR.CRITICO,
        CODIGO_ERROR.CONTEO_EXCEDIDO,
        `Paquete excede el límite: ${paquete.maxUsoRegistrado} de ${paquete.totalPaquete}`,
        {
          paquete: {
            id: paquete.idPaquete,
            documento: paquete.documentoId,
            nombre: paquete.nombre,
            maxUso: paquete.maxUsoRegistrado,
            total: paquete.totalPaquete,
          }
        }
      ));
    }
  });

  return errores;
}

/**
 * VALIDACIÓN 4: Reservas canceladas con descuento
 */
export function validarCancelacionesConDescuento(reservasEasyCancha, registrosControl) {
  const errores = [];
  
  reservasEasyCancha.forEach(reserva => {
    if (!reserva.esCancelado) return;
    
    // Buscar si hay registro en control
    const control = registrosControl.find(c => c.llaveCruce === reserva.llaveCruce);
    
    if (control && control.usoActual !== null) {
      errores.push(crearError(
        TIPO_ERROR.ADVERTENCIA,
        CODIGO_ERROR.CANCELADO_CON_DESCUENTO,
        `Reserva CANCELLED pero aparece como uso ${control.usoActual} en paquete`,
        {
          reserva: {
            bookingId: reserva.bookingId,
            fecha: reserva.fecha,
            hora: reserva.horaInicio,
            nombre: reserva.nombreCompleto,
          },
          control: {
            fila: control.filaExcel,
            idPaquete: control.idPaquete,
            usoActual: control.usoActual,
          }
        }
      ));
    }
  });

  return errores;
}

/**
 * VALIDACIÓN 5: Horario diurno/nocturno correcto
 */
export function validarHorarioPaquete(reservasEasyCancha, registrosControl) {
  const errores = [];
  
  registrosControl.forEach(control => {
    if (!control.codigoProducto || control.esEscuela) return;
    
    const producto = PRODUCTOS[control.codigoProducto];
    if (!producto || producto.horario === 'ambos') return;
    
    const reserva = reservasEasyCancha.find(r => r.llaveCruce === control.llaveCruce);
    if (!reserva) return;
    
    const horarioCorrecto = producto.horario === 'nocturno' ? reserva.esNocturno : !reserva.esNocturno;
    
    if (!horarioCorrecto) {
      errores.push(crearError(
        TIPO_ERROR.ADVERTENCIA,
        CODIGO_ERROR.HORARIO_INCORRECTO,
        `Paquete ${producto.horario} usado en horario ${reserva.esNocturno ? 'nocturno' : 'diurno'}`,
        {
          control: {
            fila: control.filaExcel,
            producto: producto.nombre,
            horarioProducto: producto.horario,
          },
          reserva: {
            fecha: reserva.fecha,
            hora: reserva.horaInicio,
            esNocturno: reserva.esNocturno,
          }
        }
      ));
    }
  });

  return errores;
}

/**
 * Ejecuta todas las validaciones y genera reporte
 */
export function ejecutarValidaciones(reservasEasyCancha, registrosControl) {
  const resultado = {
    timestamp: new Date().toISOString(),
    resumen: {
      totalReservas: reservasEasyCancha.length,
      reservasUsadas: reservasEasyCancha.filter(r => r.esUsado).length,
      reservasCanceladas: reservasEasyCancha.filter(r => r.esCancelado).length,
      totalRegistrosControl: registrosControl.length,
      registrosConPaquete: registrosControl.filter(r => r.idPaquete).length,
    },
    errores: {
      criticos: [],
      advertencias: [],
      info: [],
    },
    validaciones: {},
  };

  // Ejecutar cada validación
  const validaciones = [
    { nombre: 'cruceReservas', fn: validarCruceReservas },
    { nombre: 'tipoPaquete', fn: validarTipoPaquete },
    { nombre: 'conteoPaquetes', fn: validarConteoPaquetes },
    { nombre: 'cancelacionesConDescuento', fn: validarCancelacionesConDescuento },
    { nombre: 'horarioPaquete', fn: validarHorarioPaquete },
  ];

  validaciones.forEach(({ nombre, fn }) => {
    try {
      const errores = fn(reservasEasyCancha, registrosControl);
      resultado.validaciones[nombre] = {
        ejecutada: true,
        erroresEncontrados: errores.length,
      };
      
      errores.forEach(error => {
        switch (error.tipo) {
          case TIPO_ERROR.CRITICO:
            resultado.errores.criticos.push(error);
            break;
          case TIPO_ERROR.ADVERTENCIA:
            resultado.errores.advertencias.push(error);
            break;
          default:
            resultado.errores.info.push(error);
        }
      });
    } catch (e) {
      resultado.validaciones[nombre] = {
        ejecutada: false,
        error: e.message,
      };
    }
  });

  // Resumen de errores
  resultado.resumen.totalErroresCriticos = resultado.errores.criticos.length;
  resultado.resumen.totalAdvertencias = resultado.errores.advertencias.length;
  resultado.resumen.totalInfo = resultado.errores.info.length;

  return resultado;
}

/**
 * Genera resumen por usuario
 */
export function generarResumenPorUsuario(reservasEasyCancha, registrosControl, resultadoValidacion) {
  const usuarios = {};
  
  // Agrupar datos
  const reservasPorDoc = agruparPorDocumento(reservasEasyCancha);
  const controlPorDoc = agruparPorDocumentoControl(registrosControl);
  
  // Combinar
  const todosLosDocs = new Set([
    ...Object.keys(reservasPorDoc),
    ...Object.keys(controlPorDoc)
  ]);
  
  todosLosDocs.forEach(doc => {
    const reservas = reservasPorDoc[doc];
    const control = controlPorDoc[doc];
    
    usuarios[doc] = {
      documentoId: doc,
      nombre: reservas?.nombre || control?.nombre || 'Desconocido',
      
      // Datos de EasyCancha
      totalReservas: reservas?.reservas?.length || 0,
      reservasUsadas: reservas?.totalUsadas || 0,
      reservasCanceladas: reservas?.totalCanceladas || 0,
      
      // Datos de Control
      totalRegistrosControl: control?.registros?.length || 0,
      paquetesActivos: control?.paquetesActivos || [],
      
      // Errores asociados
      errores: resultadoValidacion.errores.criticos.filter(
        e => e.reserva?.documento === doc || e.control?.documento === doc
      ).concat(
        resultadoValidacion.errores.advertencias.filter(
          e => e.reserva?.documento === doc || e.control?.documento === doc
        )
      ),
    };
  });

  return usuarios;
}

export default ejecutarValidaciones;
