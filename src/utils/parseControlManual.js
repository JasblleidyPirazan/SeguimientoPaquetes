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
 * Mapeo de nombres de columnas del Excel (Hoja "USO")
 * Según estructura real del archivo
 */
const COLUMNAS_CONTROL = {
  fecha: 0,                    // FECHA
  horaInicio: 1,              // HORA INICIO
  horaFin: 2,                 // HORA FIN
  nombre: 3,                  // DEPORTISTA
  documento: 4,               // IDENTIFICACIÓN
  cancha: 5,                  // CANCHA
  codigoProducto: 6,          // COD PRODUCTO
  nombreProducto: 7,          // PRODUCTO
  idPaquete: 8,               // COD SERVICIO
  usoDePaquete: 9,            // AVANCE PAQUETE ("X DE Y")
  clasesRestantes: 10,        // TURNOS RESTANTES
  estado: 11,                 // ESTADO PAQUETE
  valorPaquete: 12,           // VALOR FACTURADO
  metodoPago: 13,             // MEDIO DE PAGO
  valorPagado: 14,            // VALOR
  comprobante: 15,            // TICKET
  fechaCompra: 16,            // FECHA DE PAGO
  observaciones: 17,          // OBSERVACIONES
  profesor: 18,               // PROFESOR
  revision: 19,               // REVISIÓN DE REGISTRO
  estadoFinal: 20,            // ESTADO FINAL DEL TURNO
};

/**
 * Parsea la fecha en formato largo español
 * Ej: "jueves, 18 de diciembre de 2025" -> Date
 */
function parsearFechaEspanol(fechaStr) {
  if (!fechaStr) return null;

  // Si ya es un objeto Date de Excel, formatearlo directamente
  if (fechaStr instanceof Date) {
    const year = fechaStr.getFullYear();
    const month = (fechaStr.getMonth() + 1).toString().padStart(2, '0');
    const day = fechaStr.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Si es una fecha de Excel (número), convertirla
  if (typeof fechaStr === 'number') {
    const fecha = XLSX.SSF.parse_date_code(fechaStr);
    return `${fecha.y}-${fecha.m.toString().padStart(2, '0')}-${fecha.d.toString().padStart(2, '0')}`;
  }

  // Convertir a string para parseo
  const fechaString = String(fechaStr);

  // Intentar parsear formato largo español
  const meses = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };

  const match = fechaString.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (match) {
    const dia = match[1].padStart(2, '0');
    const mes = meses[match[2].toLowerCase()];
    const año = match[3];
    if (mes) {
      return `${año}-${mes}-${dia}`;
    }
  }

  return fechaString;
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
  if (doc === null || doc === undefined || doc === '') return null;
  const str = String(doc).replace(/\D/g, '');
  return str || null;
}

/**
 * Convierte valor a string de forma segura
 */
function toStringSafe(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor);
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
  const nombre = toStringSafe(fila[COLUMNAS_CONTROL.nombre]).toUpperCase().trim();
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
    nombreProducto: toStringSafe(fila[COLUMNAS_CONTROL.nombreProducto]).trim(),
    idPaquete: toStringSafe(fila[COLUMNAS_CONTROL.idPaquete]).trim() || null,

    // Uso del paquete
    usoActual: usoPaquete.usoActual,
    totalPaquete: usoPaquete.totalPaquete,
    clasesRestantes: parseInt(fila[COLUMNAS_CONTROL.clasesRestantes]) || null,

    // Estado
    estado: toStringSafe(fila[COLUMNAS_CONTROL.estado]).trim(),
    esActivo: toStringSafe(fila[COLUMNAS_CONTROL.estado]).toUpperCase() === 'ACTIVO',

    // Valores
    valorPaquete: parsearValor(fila[COLUMNAS_CONTROL.valorPaquete]),
    valorPagado: parsearValor(fila[COLUMNAS_CONTROL.valorPagado]),
    metodoPago: toStringSafe(fila[COLUMNAS_CONTROL.metodoPago]).trim() || null,

    // Info adicional
    comprobante: toStringSafe(fila[COLUMNAS_CONTROL.comprobante]).trim() || null,
    fechaCompra: toStringSafe(fila[COLUMNAS_CONTROL.fechaCompra]).trim() || null,
    observaciones: toStringSafe(fila[COLUMNAS_CONTROL.observaciones]).trim() || null,
    profesor: toStringSafe(fila[COLUMNAS_CONTROL.profesor]).trim() || null,

    // Estado final del turno
    estadoFinal: toStringSafe(fila[COLUMNAS_CONTROL.estadoFinal]).trim() || null,
    
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
  console.log('📄 Parseando Excel de Control Manual...');

  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  console.log(`📊 Hojas disponibles en el Excel: ${workbook.SheetNames.join(', ')}`);

  // Buscar la hoja "USO" específicamente
  const nombreHoja = workbook.SheetNames.find(name => name.toUpperCase() === 'USO') || workbook.SheetNames[0];
  const hoja = workbook.Sheets[nombreHoja];

  console.log(`📊 Hoja seleccionada: "${nombreHoja}"`);

  // Convertir a array de arrays
  const datos = XLSX.utils.sheet_to_json(hoja, { header: 1, raw: true });

  console.log(`📊 Total de filas en Excel: ${datos.length}`);

  const registros = [];
  const errores = [];

  // Saltar la primera fila si es encabezado
  const iniciar = datos[0] && typeof datos[0][0] === 'string' &&
                  datos[0][0].toLowerCase().includes('fecha') ? 1 : 0;

  if (iniciar === 1) {
    console.log('📋 Header detectado, saltando primera fila');
    console.log('📋 Columnas del Excel:', datos[0]); // Mostrar TODAS las columnas
  } else {
    console.log('⚠️ No se detectó header. Primera fila:', datos[0]?.slice(0, 5));
  }

  let registrosValidos = 0;
  let registrosEscuela = 0;
  let registrosLibre = 0;
  let registrosSinFecha = 0;

  for (let i = iniciar; i < datos.length; i++) {
    const fila = datos[i];
    if (!fila || fila.length < 5) {
      console.warn(`Fila ${i + 1}: vacía o incompleta (${fila?.length || 0} columnas)`);
      continue;
    }

    try {
      const registro = normalizarRegistroControl(fila, i + 1);

      // Solo incluir registros con datos válidos
      if (registro.fecha && registro.horaInicio && !registro.esLibre) {
        registros.push(registro);
        registrosValidos++;
      } else {
        if (!registro.fecha) {
          registrosSinFecha++;
          // Mostrar las primeras 3 filas sin fecha para debugging
          if (registrosSinFecha <= 3) {
            console.warn(`Fila ${i + 1} sin fecha. Contenido:`, {
              fecha_raw: fila[0],
              hora_raw: fila[1],
              nombre: fila[3]
            });
          }
        }
        if (registro.esLibre) registrosLibre++;
        if (registro.esEscuela) registrosEscuela++;
      }
    } catch (error) {
      errores.push({ fila: i + 1, error: error.message });
      // Solo mostrar los primeros 5 errores
      if (errores.length <= 5) {
        console.error(`❌ Error en fila ${i + 1}:`, error.message);
        console.error(`   Contenido de la fila (primeros 5 campos):`, fila.slice(0, 5));
      }
    }
  }

  console.log(`✅ Registros válidos procesados: ${registrosValidos}`);
  console.log(`📊 Registros ESCUELA (excluidos): ${registrosEscuela}`);
  console.log(`📊 Registros LIBRE (excluidos): ${registrosLibre}`);
  console.log(`⚠️ Registros sin fecha (excluidos): ${registrosSinFecha}`);
  console.log(`⚠️ Errores encontrados: ${errores.length}`);

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
