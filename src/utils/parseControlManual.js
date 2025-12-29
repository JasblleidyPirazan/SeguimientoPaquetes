/**
 * Parser para datos del Control Manual (Excel)
 * Normaliza y transforma los datos del registro de asistencia
 */

import * as XLSX from 'xlsx';
import { parse, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PRODUCTOS } from '../data/productos';
import { normalizarHora } from './parseEasyCancha';

/**
 * Mapeo de nombres de columnas del Excel
 * Ajustar según los encabezados reales del archivo
 */
const COLUMNAS_CONTROL = {
  fecha: 0,
  horaInicio: 1,
  horaFin: 2,
  nombre: 3,
  documento: 4,
  cancha: 5,
  codigoProducto: 6,
  nombreProducto: 7,
  idPaquete: 8,
  usoDePaquete: 9, // "8 DE 12"
  clasesRestantes: 10,
  estado: 11,
  valorPaquete: 12,
  metodoPago: 13,
  valorPagado: 14,
  comprobante: 15,
  fechaCompra: 16,
  observaciones: 17,
  profesor: 18,
};

/**
 * Parsea la fecha en formato largo español
 * Ej: "jueves, 18 de diciembre de 2025" -> Date
 */
function parsearFechaEspanol(fechaStr) {
  if (!fechaStr) return null;
  
  // Intentar parsear formato largo español
  const meses = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  const match = fechaStr.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = meses[match[2].toLowerCase()];
    const año = match[3];
    if (mes) {
      return `${año}-${mes}-${dia}`;
    }
  }
  
  // Si es una fecha de Excel (número), convertirla
  if (typeof fechaStr === 'number') {
    const fecha = XLSX.SSF.parse_date_code(fechaStr);
    return `${fecha.y}-${fecha.m.toString().padStart(2, '0')}-${fecha.d.toString().padStart(2, '0')}`;
  }
  
  return fechaStr;
}

/**
 * Parsea el formato "X DE Y" para extraer uso actual y total
 */
function parsearUsoPaquete(usoStr) {
  if (!usoStr || usoStr === 'NA') return { usoActual: null, totalPaquete: null };
  
  const match = String(usoStr).match(/(\d+)\s*DE\s*(\d+)/i);
  if (match) {
    return {
      usoActual: parseInt(match[1]),
      totalPaquete: parseInt(match[2])
    };
  }
  
  return { usoActual: null, totalPaquete: null };
}

/**
 * Normaliza el documento ID (solo números)
 */
function normalizarDocumento(doc) {
  if (!doc) return null;
  const str = String(doc).replace(/\D/g, '');
  return str || null;
}

/**
 * Parsea el valor monetario
 */
function parsearValor(valorStr) {
  if (!valorStr) return 0;
  const numStr = String(valorStr).replace(/[^\d]/g, '');
  return parseInt(numStr) || 0;
}

/**
 * Convierte hora de Excel a string
 */
function convertirHoraExcel(valor) {
  if (!valor) return null;
  
  // Si es un número (fracción del día en Excel)
  if (typeof valor === 'number') {
    const totalMinutos = Math.round(valor * 24 * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }
  
  // Si es string con formato "6:00:00 a. m."
  return normalizarHora(String(valor));
}

/**
 * Determina si es un registro de ESCUELA (no paga por reserva individual)
 */
function esRegistroEscuela(nombre, documento) {
  const nombreUpper = String(nombre).toUpperCase();
  return nombreUpper.includes('ESCUELA') || 
         nombreUpper === 'LIBRE' ||
         String(documento).startsWith('111');
}

/**
 * Transforma una fila del Excel a formato normalizado
 */
function normalizarRegistroControl(fila, numeroFila) {
  const nombre = String(fila[COLUMNAS_CONTROL.nombre] || '').toUpperCase().trim();
  const documento = normalizarDocumento(fila[COLUMNAS_CONTROL.documento]);
  const fecha = parsearFechaEspanol(fila[COLUMNAS_CONTROL.fecha]);
  const horaInicio = convertirHoraExcel(fila[COLUMNAS_CONTROL.horaInicio]);
  const usoPaquete = parsearUsoPaquete(fila[COLUMNAS_CONTROL.usoDePaquete]);
  
  // Ignorar registros de LIBRE o ESCUELA para validación de paquetes
  const esEscuela = esRegistroEscuela(nombre, documento);
  
  return {
    // Identificadores
    filaExcel: numeroFila,
    documentoId: documento,
    
    // Persona
    nombreCompleto: nombre,
    
    // Fecha y hora
    fecha: fecha,
    horaInicio: horaInicio,
    horaFin: convertirHoraExcel(fila[COLUMNAS_CONTROL.horaFin]),
    
    // Cancha
    cancha: parseInt(fila[COLUMNAS_CONTROL.cancha]) || null,
    
    // Producto/Paquete
    codigoProducto: parseInt(fila[COLUMNAS_CONTROL.codigoProducto]) || null,
    nombreProducto: String(fila[COLUMNAS_CONTROL.nombreProducto] || '').trim(),
    idPaquete: String(fila[COLUMNAS_CONTROL.idPaquete] || '').trim() || null,
    
    // Uso del paquete
    usoActual: usoPaquete.usoActual,
    totalPaquete: usoPaquete.totalPaquete,
    clasesRestantes: parseInt(fila[COLUMNAS_CONTROL.clasesRestantes]) || null,
    
    // Estado
    estado: String(fila[COLUMNAS_CONTROL.estado] || '').trim(),
    esActivo: String(fila[COLUMNAS_CONTROL.estado] || '').toUpperCase() === 'ACTIVO',
    
    // Valores
    valorPaquete: parsearValor(fila[COLUMNAS_CONTROL.valorPaquete]),
    valorPagado: parsearValor(fila[COLUMNAS_CONTROL.valorPagado]),
    metodoPago: String(fila[COLUMNAS_CONTROL.metodoPago] || '').trim() || null,
    
    // Info adicional
    comprobante: String(fila[COLUMNAS_CONTROL.comprobante] || '').trim() || null,
    fechaCompra: String(fila[COLUMNAS_CONTROL.fechaCompra] || '').trim() || null,
    observaciones: String(fila[COLUMNAS_CONTROL.observaciones] || '').trim() || null,
    profesor: String(fila[COLUMNAS_CONTROL.profesor] || '').trim() || null,
    
    // Clasificación
    esEscuela: esEscuela,
    esLibre: nombre === 'LIBRE' || documento === '999',
    esPaquete: Boolean(fila[COLUMNAS_CONTROL.idPaquete]),
    
    // Llave única para cruce
    llaveCruce: `${fecha}|${horaInicio}|${documento}`,
    llaveCruceSinDoc: `${fecha}|${horaInicio}|${fila[COLUMNAS_CONTROL.cancha]}`,
  };
}

/**
 * Parsea un archivo Excel de control manual
 */
export function parseControlManual(buffer) {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const primeraHoja = workbook.SheetNames[0];
  const hoja = workbook.Sheets[primeraHoja];
  
  // Convertir a array de arrays
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true });
  
  const registros = [];
  const errores = [];
  
  // Saltar la primera fila si es encabezado
  const iniciar = datos[0] && typeof datos[0][0] === 'string' && 
                  datos[0][0].toLowerCase().includes('fecha') ? 1 : 0;
  
  for (let i = iniciar; i < datos.length; i++) {
    const fila = datos[i];
    if (!fila || fila.length < 5) continue; // Fila vacía o incompleta
    
    try {
      const registro = normalizarRegistroControl(fila, i + 1);
      
      // Solo incluir registros con datos válidos
      if (registro.fecha && registro.horaInicio && !registro.esLibre) {
        registros.push(registro);
      }
    } catch (error) {
      errores.push({ fila: i + 1, error: error.message });
    }
  }

  return { registros, errores };
}

/**
 * Agrupa registros por ID de paquete para seguimiento
 */
export function agruparPorPaquete(registros) {
  const paquetes = {};
  
  registros.forEach(registro => {
    if (!registro.idPaquete || registro.esEscuela) return;
    
    if (!paquetes[registro.idPaquete]) {
      paquetes[registro.idPaquete] = {
        idPaquete: registro.idPaquete,
        documentoId: registro.documentoId,
        nombre: registro.nombreCompleto,
        codigoProducto: registro.codigoProducto,
        totalPaquete: registro.totalPaquete,
        usos: [],
        maxUsoRegistrado: 0,
      };
    }
    
    paquetes[registro.idPaquete].usos.push(registro);
    if (registro.usoActual > paquetes[registro.idPaquete].maxUsoRegistrado) {
      paquetes[registro.idPaquete].maxUsoRegistrado = registro.usoActual;
    }
  });

  return paquetes;
}

/**
 * Agrupa registros por documento ID
 */
export function agruparPorDocumentoControl(registros) {
  const grupos = {};
  
  registros.forEach(registro => {
    const doc = registro.documentoId;
    if (!doc || registro.esEscuela || registro.esLibre) return;
    
    if (!grupos[doc]) {
      grupos[doc] = {
        documentoId: doc,
        nombre: registro.nombreCompleto,
        registros: [],
        paquetesActivos: new Set(),
      };
    }
    
    grupos[doc].registros.push(registro);
    if (registro.idPaquete) {
      grupos[doc].paquetesActivos.add(registro.idPaquete);
    }
  });

  // Convertir Sets a arrays
  Object.values(grupos).forEach(g => {
    g.paquetesActivos = Array.from(g.paquetesActivos);
  });

  return grupos;
}

export default parseControlManual;
