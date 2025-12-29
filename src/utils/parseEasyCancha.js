/**
 * Parser para datos de EasyCancha
 * Normaliza y transforma los datos del export de reservas
 */

import { parse } from 'date-fns';
import { SPORT_NAME_MAP } from '../data/productos';

/**
 * Estructura de columnas del export de EasyCancha
 */
const COLUMNAS_EASYCANCHA = [
  'booking_id',
  'service_id', 
  'sport_id',
  'sport_name',
  'service_name',
  'date',
  'start_time',
  'end_time',
  'duration',
  'customer_id',
  'first_name',
  'last_name',
  'email',
  'phone',
  'document_id',
  'birth_date',
  'status',
  'notes',
  'booked_from',
  'col20',
  'col21',
  'col22',
  'total_price'
];

/**
 * Parsea una línea del archivo de EasyCancha
 */
function parseLineaEasyCancha(linea, index) {
  const campos = linea.split('\t');
  
  if (campos.length < 17) {
    console.warn(`Línea ${index + 1}: campos insuficientes (${campos.length})`);
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
  const cancha = extraerNumeroCancha(raw.service_name);
  const horaInicio = normalizarHora(raw.start_time);
  
  return {
    // Identificadores
    bookingId: raw.booking_id,
    documentoId: raw.document_id?.replace(/\D/g, '') || null, // Solo números
    
    // Persona
    nombre: raw.first_name,
    apellido: raw.last_name,
    nombreCompleto: `${raw.first_name} ${raw.last_name}`.toUpperCase().trim(),
    email: raw.email,
    telefono: raw.phone,
    
    // Fecha y hora
    fecha: raw.date, // Ya viene en formato YYYY-MM-DD
    horaInicio: horaInicio,
    horaFin: normalizarHora(raw.end_time),
    duracion: parseInt(raw.duration) || 0,
    
    // Tipo de actividad
    sportName: raw.sport_name,
    tipoActividad: SPORT_NAME_MAP[raw.sport_name] || 'desconocido',
    serviceName: raw.service_name,
    
    // Cancha
    cancha: cancha,
    esMiniTenis: cancha === 5,
    esNocturno: horaInicio ? esHorarioNocturno(horaInicio) : false,
    
    // Estado
    estado: raw.status,
    esUsado: raw.status === 'USED',
    esCancelado: raw.status === 'CANCELLED',
    esIntercambiado: raw.status === 'EXCHANGED',
    
    // Pago
    precioTotal: parseInt(raw.total_price) || 0,
    
    // Notas
    notas: raw.notes,
    
    // Llave única para cruce
    llaveCruce: `${raw.date}|${horaInicio}|${raw.document_id?.replace(/\D/g, '')}`,
    llaveCruceSinDoc: `${raw.date}|${horaInicio}|${cancha}`,
  };
}

/**
 * Parsea el contenido completo del archivo de EasyCancha
 */
export function parseEasyCancha(contenido) {
  const lineas = contenido.split('\n').filter(l => l.trim());
  const reservas = [];
  const errores = [];

  lineas.forEach((linea, index) => {
    try {
      const raw = parseLineaEasyCancha(linea, index);
      if (raw && raw.booking_id) {
        const normalizado = normalizarReservaEasyCancha(raw);
        reservas.push(normalizado);
      }
    } catch (error) {
      errores.push({ linea: index + 1, error: error.message });
    }
  });

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
