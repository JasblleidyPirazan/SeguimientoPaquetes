/**
 * Tabla maestra de productos del club de tenis
 * Incluye todos los códigos, precios y categorías
 */

export const PRODUCTOS = {
  // CANCHAS - CLASES - PRACTICAS LIBRE (Unitarios)
  1101: { nombre: 'Practica libre sencilla diurno', categoria: 'UNITARIO', abono: 58000, tipo: 'practica_libre', horario: 'diurno', cancha: 'normal' },
  1202: { nombre: 'Practica libre sencilla nocturno', categoria: 'UNITARIO', abono: 75000, tipo: 'practica_libre', horario: 'nocturno', cancha: 'normal' },
  1003: { nombre: 'Practica libre dobles', categoria: 'UNITARIO', abono: 92500, tipo: 'practica_dobles', horario: 'ambos', cancha: 'normal' },
  1104: { nombre: 'Clase individual diurno', categoria: 'UNITARIO', abono: 58000, tipo: 'clase_individual', horario: 'diurno', cancha: 'normal' },
  1205: { nombre: 'Clase individual de nocturno', categoria: 'UNITARIO', abono: 75000, tipo: 'clase_individual', horario: 'nocturno', cancha: 'normal' },
  1006: { nombre: 'Clase en pareja', categoria: 'UNITARIO', abono: 104000, tipo: 'clase_pareja', horario: 'ambos', cancha: 'normal' },
  1007: { nombre: 'Clase grupal', categoria: 'UNITARIO', abono: 127000, tipo: 'clase_grupal', horario: 'ambos', cancha: 'normal' },

  // PAQUETES PRACTICA LIBRE
  2101: { nombre: 'Paquete X4 practica libre sencilla diurno', categoria: 'PAQUETE', abono: 231000, tipo: 'practica_libre', horario: 'diurno', cancha: 'normal', cantidad: 4 },
  2102: { nombre: 'Paquete X6 practica libre sencilla diurno', categoria: 'PAQUETE', abono: 330000, tipo: 'practica_libre', horario: 'diurno', cancha: 'normal', cantidad: 6 },
  2103: { nombre: 'Paquete X12 practica libre sencilla diurno', categoria: 'PAQUETE', abono: 624000, tipo: 'practica_libre', horario: 'diurno', cancha: 'normal', cantidad: 12 },
  2104: { nombre: 'Paquete X20 practica libre sencilla diurno', categoria: 'PAQUETE', abono: null, tipo: 'practica_libre', horario: 'diurno', cancha: 'normal', cantidad: 20 },
  2204: { nombre: 'Paquete X4 practica libre sencilla nocturno', categoria: 'PAQUETE', abono: 300000, tipo: 'practica_libre', horario: 'nocturno', cancha: 'normal', cantidad: 4 },
  2205: { nombre: 'Paquete X6 practica libre sencilla nocturno', categoria: 'PAQUETE', abono: 428000, tipo: 'practica_libre', horario: 'nocturno', cancha: 'normal', cantidad: 6 },
  2206: { nombre: 'Paquete X12 practica libre sencilla nocturno', categoria: 'PAQUETE', abono: 811000, tipo: 'practica_libre', horario: 'nocturno', cancha: 'normal', cantidad: 12 },
  2207: { nombre: 'Paquete X20 practica libre sencilla nocturno', categoria: 'PAQUETE', abono: null, tipo: 'practica_libre', horario: 'nocturno', cancha: 'normal', cantidad: 20 },
  2007: { nombre: 'Paquete X4 pratica libre dobles', categoria: 'PAQUETE', abono: 370000, tipo: 'practica_dobles', horario: 'ambos', cancha: 'normal', cantidad: 4 },
  2008: { nombre: 'Paquete X6 pratica libre dobles', categoria: 'PAQUETE', abono: 538000, tipo: 'practica_dobles', horario: 'ambos', cancha: 'normal', cantidad: 6 },
  2009: { nombre: 'Paquete X12 pratica libre dobles', categoria: 'PAQUETE', abono: 1043000, tipo: 'practica_dobles', horario: 'ambos', cancha: 'normal', cantidad: 12 },
  2010: { nombre: 'Paquete X20 practica libre dobles', categoria: 'PAQUETE', abono: null, tipo: 'practica_dobles', horario: 'ambos', cancha: 'normal', cantidad: 20 },

  // PAQUETES CLASE INDIVIDUAL
  3101: { nombre: 'Paquete X4 clase individual de diurno', categoria: 'PAQUETE', abono: 232000, tipo: 'clase_individual', horario: 'diurno', cancha: 'normal', cantidad: 4 },
  3102: { nombre: 'Paquete X6 clase individual de diurno', categoria: 'PAQUETE', abono: 330000, tipo: 'clase_individual', horario: 'diurno', cancha: 'normal', cantidad: 6 },
  3103: { nombre: 'Paquete X12 clase individual de diurno', categoria: 'PAQUETE', abono: 624000, tipo: 'clase_individual', horario: 'diurno', cancha: 'normal', cantidad: 12 },
  3104: { nombre: 'Paquete X20 clase individual de diurno', categoria: 'PAQUETE', abono: 1160000, tipo: 'clase_individual', horario: 'diurno', cancha: 'normal', cantidad: 20 },
  3204: { nombre: 'Paquete X4 clase individual nocturno', categoria: 'PAQUETE', abono: 300000, tipo: 'clase_individual', horario: 'nocturno', cancha: 'normal', cantidad: 4 },
  3205: { nombre: 'Paquete X6 clase individual nocturno', categoria: 'PAQUETE', abono: 428000, tipo: 'clase_individual', horario: 'nocturno', cancha: 'normal', cantidad: 6 },
  3206: { nombre: 'Paquete X12 clase individual nocturno', categoria: 'PAQUETE', abono: 811000, tipo: 'clase_individual', horario: 'nocturno', cancha: 'normal', cantidad: 12 },
  3207: { nombre: 'Paquete X20 clase individual nocturno', categoria: 'PAQUETE', abono: null, tipo: 'clase_individual', horario: 'nocturno', cancha: 'normal', cantidad: 20 },

  // PAQUETES CLASE EN PAREJA
  3001: { nombre: 'Paquete X4 clase en pareja', categoria: 'PAQUETE', abono: 416000, tipo: 'clase_pareja', horario: 'ambos', cancha: 'normal', cantidad: 4 },
  3002: { nombre: 'Paquete X6 clase en pareja', categoria: 'PAQUETE', abono: 593000, tipo: 'clase_pareja', horario: 'ambos', cancha: 'normal', cantidad: 6 },
  3203: { nombre: 'Paquete X12 clase en pareja', categoria: 'PAQUETE', abono: 1123000, tipo: 'clase_pareja', horario: 'ambos', cancha: 'normal', cantidad: 12 },
  3004: { nombre: 'Paquete X20 clase en pareja', categoria: 'PAQUETE', abono: null, tipo: 'clase_pareja', horario: 'ambos', cancha: 'normal', cantidad: 20 },

  // PAQUETES CLASES GRUPALES
  3404: { nombre: 'Paquete X4 clase grupal', categoria: 'PAQUETE', abono: 509000, tipo: 'clase_grupal', horario: 'ambos', cancha: 'normal', cantidad: 4 },
  3605: { nombre: 'Paquete X6 clase grupal', categoria: 'PAQUETE', abono: 725000, tipo: 'clase_grupal', horario: 'ambos', cancha: 'normal', cantidad: 6 },
  3806: { nombre: 'Paquete x12 clase grupal', categoria: 'PAQUETE', abono: 1373000, tipo: 'clase_grupal', horario: 'ambos', cancha: 'normal', cantidad: 12 },
  3807: { nombre: 'Paquete x20 clase grupal', categoria: 'PAQUETE', abono: 2286000, tipo: 'clase_grupal', horario: 'ambos', cancha: 'normal', cantidad: 20 },

  // MINITENIS (Cancha 5)
  8101: { nombre: 'MiniTenis Practica libre sencilla C5', categoria: 'UNITARIO', abono: null, tipo: 'practica_libre', horario: 'ambos', cancha: 'minitenis' },
  8102: { nombre: 'MiniTenis Clase individual Diurna C5', categoria: 'UNITARIO', abono: 45000, tipo: 'clase_individual', horario: 'diurno', cancha: 'minitenis' },
  8201: { nombre: 'MiniTenis Clase individual Nocturna C5', categoria: 'UNITARIO', abono: null, tipo: 'clase_individual', horario: 'nocturno', cancha: 'minitenis' },
  8103: { nombre: 'MiniTenis Clase en pareja C5', categoria: 'UNITARIO', abono: null, tipo: 'clase_pareja', horario: 'ambos', cancha: 'minitenis' },
  8105: { nombre: 'MiniTenis Clase Grupal C5', categoria: 'UNITARIO', abono: null, tipo: 'clase_grupal', horario: 'ambos', cancha: 'minitenis' },
  
  // PAQUETES MINITENIS
  8107: { nombre: 'Paquete X4 clase individual diurna C5', categoria: 'PAQUETE', abono: null, tipo: 'clase_individual', horario: 'diurno', cancha: 'minitenis', cantidad: 4 },
  8108: { nombre: 'Paquete X6 clase individual diurna C5', categoria: 'PAQUETE', abono: null, tipo: 'clase_individual', horario: 'diurno', cancha: 'minitenis', cantidad: 6 },
  8109: { nombre: 'Paquete X12 clase individual diurna C5', categoria: 'PAQUETE', abono: null, tipo: 'clase_individual', horario: 'diurno', cancha: 'minitenis', cantidad: 12 },
  8110: { nombre: 'Paquete X20 clase individual diurna C5', categoria: 'PAQUETE', abono: null, tipo: 'clase_individual', horario: 'diurno', cancha: 'minitenis', cantidad: 20 },

  // ESCUELA
  4001: { nombre: 'Chiquitines (ENTRE LOS 3 Y 6 AÑOS)', categoria: 'ESCUELA', abono: 2310000, tipo: 'escuela', horario: 'ambos', cancha: 'normal' },
  4002: { nombre: 'Escuela (MAYORES DE 7 AÑOS)', categoria: 'ESCUELA', abono: 2657000, tipo: 'escuela', horario: 'ambos', cancha: 'normal' },
};

/**
 * Mapeo de sport_name de EasyCancha a tipo interno
 */
export const SPORT_NAME_MAP = {
  'Práctica libre': 'practica_libre',
  'Practica libre': 'practica_libre',
  'Clases individuales': 'clase_individual',
  'Clases en parejas': 'clase_pareja',
  'Clases grupales (3-4 personas)': 'clase_grupal',
};

/**
 * Obtiene el código de producto esperado según el tipo de actividad, horario y cancha
 */
export function getCodigoProductoBase(tipo, esNocturno, esMiniTenis) {
  const horario = esNocturno ? 'nocturno' : 'diurno';
  const cancha = esMiniTenis ? 'minitenis' : 'normal';

  // Buscar el producto unitario que coincida
  for (const [codigo, producto] of Object.entries(PRODUCTOS)) {
    if (
      producto.categoria === 'UNITARIO' &&
      producto.tipo === tipo &&
      producto.cancha === cancha &&
      (producto.horario === horario || producto.horario === 'ambos')
    ) {
      return parseInt(codigo);
    }
  }
  return null;
}

/**
 * Obtiene todos los códigos de paquete válidos para un tipo de actividad
 */
export function getPaquetesValidos(tipo, esNocturno, esMiniTenis) {
  const horario = esNocturno ? 'nocturno' : 'diurno';
  const cancha = esMiniTenis ? 'minitenis' : 'normal';
  const paquetes = [];

  for (const [codigo, producto] of Object.entries(PRODUCTOS)) {
    if (
      producto.categoria === 'PAQUETE' &&
      producto.tipo === tipo &&
      producto.cancha === cancha &&
      (producto.horario === horario || producto.horario === 'ambos')
    ) {
      paquetes.push(parseInt(codigo));
    }
  }
  return paquetes;
}

/**
 * Verifica si un código de paquete es válido para una reserva específica
 */
export function esPaqueteValidoParaReserva(codigoPaquete, tipoReserva, esNocturno, esMiniTenis) {
  const producto = PRODUCTOS[codigoPaquete];
  if (!producto || producto.categoria !== 'PAQUETE') return false;

  const horarioValido = producto.horario === 'ambos' || 
    (esNocturno ? producto.horario === 'nocturno' : producto.horario === 'diurno');
  
  const canchaValida = esMiniTenis ? producto.cancha === 'minitenis' : producto.cancha === 'normal';
  
  return producto.tipo === tipoReserva && horarioValido && canchaValida;
}

export default PRODUCTOS;
