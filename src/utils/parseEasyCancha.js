/**
 * Parser para datos de EasyCancha
 * Normaliza y transforma los datos del export de reservas
 */

import { parse } from 'date-fns';
import { SPORT_NAME_MAP } from '../data/productos';

/**
 * Estructura de columnas del export de EasyCancha (desde Google Sheets)
 * IMPORTANTE: Esta estructura es diferente al export directo de EasyCancha
 */
const COLUMNAS_EASYCANCHA = [
  'id_reserva',          // 0
  'court_id',            // 1
  'sport_id',            // 2
  'sport_name',          // 3
  'court_name',          // 4
  'fecha',               // 5
  'hora_inicio',         // 6
  'hora_fin',            // 7
  'duracion_minutos',    // 8
  'user_id',             // 9
  'nombre_cliente',      // 10
  'apellido_cliente',    // 11
  'email_cliente',       // 12
  'telefono_cliente',    // 13
  'documento_cliente',   // 14
  'fecha_nacimiento',    // 15
  'estado_reserva',      // 16 (puede no existir en algunos exports)
  'comentarios',         // 17
  'reservado_por',       // 18
  'monto_cancha',        // 19
  'monto_pagado',        // 20
  'monto_ancillaries',   // 21
  'monto_total',         // 22
  'descuento',           // 23
  'ancillaries_json',    // 24
  'fecha_sincronizacion' // 25
];

/**
 * Detecta el delimitador del archivo (Tab o Coma)
 */
function detectarDelimitador(linea) {
  const tabs = (linea.match(/\t/g) || []).length;
  const comas = (linea.match(/,/g) || []).length;

  // Si tiene más tabs que comas, es TSV, sino es CSV
  return tabs > comas ? '\t' : ',';
}

/**
 * Parsea una línea del archivo de EasyCancha
 */
function parseLineaEasyCancha(linea, index, delimitador) {
  const campos = linea.split(delimitador);

  if (campos.length < 17) {
    console.warn(`Línea ${index + 1}: campos insuficientes (${campos.length}/${COLUMNAS_EASYCANCHA.length}). Delimitador usado: '${delimitador === '\t' ? 'TAB' : 'COMA'}'`);
    return null;
  }

  const raw = {};
  COLUMNAS_EASYCANCHA.forEach((col, i) => {
    raw[col] = campos[i]?.trim() || '';
  });

  return raw;
}

/**
 * Extrae el número de cancha del service_name
 * Ej: "Profesor Camilo Ortiz - Cancha 1" -> 1
 * Ej: "Cancha 4" -> 4
 * Ej: "Cancha 5 [Minitenis]" -> 5
 */
export function extraerNumeroCancha(serviceName) {
  const match = serviceName.match(/Cancha\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
}

/**
 * Determina si es horario nocturno (18:00 o después)
 */
export function esHorarioNocturno(horaStr) {
  const [hora] = horaStr.split(':').map(Number);
  return hora >= 18;
}

/**
 * Normaliza la hora al formato HH:MM
 */
export function normalizarHora(horaStr) {
  if (!horaStr) return null;
  
  // Manejar formatos como "6:00", "18:00", "6:00:00 a. m."
  const limpio = horaStr
    .replace(/\s*(a\.\s*m\.|p\.\s*m\.)/gi, '')
    .replace(/:\d{2}$/, '') // Quitar segundos si existen
    .trim();
  
  const [hora, minutos] = limpio.split(':').map(Number);
  
  // Si tenía "p. m." y no es 12, sumar 12
  if (horaStr.toLowerCase().includes('p. m.') && hora !== 12) {
    return `${(hora + 12).toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }
  // Si era "a. m." y es 12, convertir a 00
  if (horaStr.toLowerCase().includes('a. m.') && hora === 12) {
    return `00:${minutos.toString().padStart(2, '0')}`;
  }
  
  return `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

/**
 * Transforma los datos crudos a formato normalizado
 */
function normalizarReservaEasyCancha(raw) {
  const cancha = extraerNumeroCancha(raw.court_name);
  const horaInicio = normalizarHora(raw.hora_inicio);

  return {
    // Identificadores
    bookingId: raw.id_reserva,
    documentoId: raw.documento_cliente?.toString().replace(/\D/g, '') || null, // Solo números

    // Persona
    nombre: raw.nombre_cliente,
    apellido: raw.apellido_cliente,
    nombreCompleto: `${raw.nombre_cliente || ''} ${raw.apellido_cliente || ''}`.toUpperCase().trim(),
    email: raw.email_cliente,
    telefono: raw.telefono_cliente,

    // Fecha y hora
    fecha: raw.fecha, // Ya viene en formato YYYY-MM-DD
    horaInicio: horaInicio,
    horaFin: normalizarHora(raw.hora_fin),
    duracion: parseInt(raw.duracion_minutos) || 0,

    // Tipo de actividad
    sportName: raw.sport_name,
    tipoActividad: SPORT_NAME_MAP[raw.sport_name] || 'desconocido',
    serviceName: raw.court_name,

    // Cancha
    cancha: cancha,
    esMiniTenis: cancha === 5,
    esNocturno: horaInicio ? esHorarioNocturno(horaInicio) : false,

    // Estado
    estado: raw.estado_reserva,
    esUsado: raw.estado_reserva === 'USED',
    esCancelado: raw.estado_reserva === 'CANCELLED',
    esIntercambiado: raw.estado_reserva === 'EXCHANGED',

    // Pago
    precioTotal: parseInt(raw.monto_total) || 0,

    // Notas
    notas: raw.comentarios,

    // Llave única para cruce
    llaveCruce: `${raw.fecha}|${horaInicio}|${raw.documento_cliente?.toString().replace(/\D/g, '')}`,
    llaveCruceSinDoc: `${raw.fecha}|${horaInicio}|${cancha}`,
  };
}

/**
 * Parsea el contenido completo del archivo de EasyCancha
 */
export function parseEasyCancha(contenido) {
  const lineas = contenido.split('\n').filter(l => l.trim());
  const reservas = [];
  const errores = [];

  if (lineas.length === 0) {
    console.error('El archivo está vacío');
    return { reservas, errores };
  }

  // Detectar el delimitador usando la primera línea
  const delimitador = detectarDelimitador(lineas[0]);
  console.log(`📄 Delimitador detectado: ${delimitador === '\t' ? 'TAB (TSV)' : 'COMA (CSV)'}`);
  console.log(`📊 Total de líneas a procesar: ${lineas.length}`);

  lineas.forEach((linea, index) => {
    try {
      const raw = parseLineaEasyCancha(linea, index, delimitador);
      if (raw && raw.id_reserva) {
        const normalizado = normalizarReservaEasyCancha(raw);
        reservas.push(normalizado);
      } else if (raw && !raw.id_reserva) {
        // Solo mostrar advertencia en las primeras 5 líneas
        if (index < 5) {
          console.warn(`Línea ${index + 1}: sin id_reserva (podría ser header). Primeros campos:`, raw);
        }
      }
    } catch (error) {
      errores.push({ linea: index + 1, error: error.message });
      // Solo mostrar errores de las primeras 5 líneas
      if (errores.length <= 5) {
        console.error(`❌ Error en línea ${index + 1}:`, error.message);
        console.error(`   Contenido de la línea:`, linea.substring(0, 200));
      }
    }
  });

  console.log(`✅ Reservas parseadas exitosamente: ${reservas.length}`);
  console.log(`⚠️ Errores encontrados: ${errores.length}`);

  return { reservas, errores };
}

/**
 * Agrupa reservas por documento ID
 */
export function agruparPorDocumento(reservas) {
  const grupos = {};
  
  reservas.forEach(reserva => {
    const doc = reserva.documentoId;
    if (!doc) return;
    
    if (!grupos[doc]) {
      grupos[doc] = {
        documentoId: doc,
        nombre: reserva.nombreCompleto,
        reservas: [],
        totalUsadas: 0,
        totalCanceladas: 0,
      };
    }
    
    grupos[doc].reservas.push(reserva);
    if (reserva.esUsado) grupos[doc].totalUsadas++;
    if (reserva.esCancelado) grupos[doc].totalCanceladas++;
  });

  return grupos;
}

export default parseEasyCancha;
