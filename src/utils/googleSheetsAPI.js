/**
 * Utilidad para obtener datos de Google Sheets y OneDrive
 */

// ============================================
// CONFIGURACIÓN DE URLs
// ============================================

// URL del CSV publicado de Google Sheets
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRV3H6RgjRRL6x6Kqoi_uSGTwCEdFLmekW9bgQdesfX_wslbjM1BkO2dv_OxjgZm2QXEu_ggWwNGdzu/pub?output=csv';

// URL de descarga directa de OneDrive (Excel)
// Formato: https://onedrive.live.com/download?...
const ONEDRIVE_EXCEL_URL = 'https://1drv.ms/x/c/d9591ac30acffceb/IQRAs7KxOEBmSbsizI0yfvlLAR9SG8oWGd5NzOx5jlF209Q';

/**
 * Obtiene los datos del CSV de Google Sheets
 * @returns {Promise<string>} Contenido del CSV como texto
 */
export async function obtenerDatosGoogleSheets() {
  try {
    console.log('🌐 Obteniendo datos de Google Sheets...');

    const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
      // Agregar cache: 'no-cache' para siempre obtener datos frescos
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      throw new Error('El CSV descargado está vacío');
    }

    console.log(`✅ Datos obtenidos exitosamente (${csvText.length} caracteres)`);
    return csvText;

  } catch (error) {
    console.error('❌ Error obteniendo datos de Google Sheets:', error);
    throw new Error(`No se pudieron obtener los datos: ${error.message}`);
  }
}

/**
 * Obtiene estadísticas rápidas del CSV
 * @param {string} csvText - Contenido del CSV
 * @returns {Object} Estadísticas básicas
 */
export function obtenerEstadisticasCSV(csvText) {
  const lineas = csvText.split('\n').filter(l => l.trim());
  const primeraLinea = lineas[0] || '';
  const columnas = primeraLinea.split(/[,\t]/).length;

  return {
    totalLineas: lineas.length,
    registros: lineas.length - 1, // -1 por el header
    columnas: columnas,
    tamanoKB: (csvText.length / 1024).toFixed(2)
  };
}

/**
 * Verifica si la URL de Google Sheets está accesible
 * @returns {Promise<boolean>}
 */
export async function verificarConexion() {
  try {
    const response = await fetch(GOOGLE_SHEETS_CSV_URL, {
      method: 'HEAD',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.error('Error verificando conexión:', error);
    return false;
  }
}

/**
 * Convierte URL de compartir de OneDrive a URL de descarga directa
 * @param {string} shareUrl - URL de compartir de OneDrive
 * @returns {string} URL de descarga directa
 */
export function convertirOneDriveURL(shareUrl) {
  // Si ya es una URL de descarga, retornarla
  if (shareUrl.includes('download?') || shareUrl.includes('download=1')) {
    return shareUrl;
  }

  // Convertir URL de compartir a descarga directa
  // Formato: https://1drv.ms/x/... → https://1drv.ms/x/...?download=1
  // O https://onedrive.live.com/embed?... → https://onedrive.live.com/download?...

  try {
    const url = new URL(shareUrl);

    // Para links cortos de 1drv.ms, agregar parámetro de descarga
    if (url.hostname === '1drv.ms') {
      // Si ya tiene parámetros, agregar download=1
      if (url.search) {
        return `${shareUrl}&download=1`;
      } else {
        // Si no tiene parámetros, agregar ?download=1
        return `${shareUrl}?download=1`;
      }
    }

    // Para OneDrive.live.com
    if (url.hostname.includes('onedrive.live.com')) {
      // Extraer parámetros de la URL
      const params = new URLSearchParams(url.search);
      const resid = params.get('resid') || params.get('id');
      const authkey = params.get('authkey');
      const cid = params.get('cid');

      // OneDrive for Business con resid
      if (resid) {
        if (authkey) {
          // URL con authkey (más común para archivos compartidos públicamente)
          return `https://onedrive.live.com/download?resid=${resid}&authkey=${authkey}`;
        } else {
          // URL sin authkey - intentar con resid y cid
          console.warn('⚠️ URL de OneDrive sin authkey. El archivo debe estar compartido públicamente.');
          // Intentar formato de descarga alternativo
          return `https://onedrive.live.com/download?resid=${resid}${cid ? `&cid=${cid}` : ''}`;
        }
      }

      // Si ya tiene el formato de embed, cambiar a download
      if (shareUrl.includes('/embed?')) {
        return shareUrl.replace('/embed?', '/download?');
      }

      // Si es un doc2.aspx (OneDrive for Business), intentar convertir
      if (shareUrl.includes('doc2.aspx')) {
        if (resid) {
          return `https://onedrive.live.com/download?resid=${resid}${cid ? `&cid=${cid}` : ''}`;
        }
      }
    }

    // Si no se pudo convertir, retornar la URL original
    return shareUrl;
  } catch (error) {
    console.warn('Error convirtiendo URL de OneDrive:', error);
    return shareUrl;
  }
}

/**
 * Obtiene el archivo Excel desde OneDrive
 * @param {string} customUrl - URL personalizada (opcional)
 * @returns {Promise<ArrayBuffer>} Contenido del Excel como ArrayBuffer
 */
export async function obtenerExcelOneDrive(customUrl = null) {
  try {
    console.log('🌐 Obteniendo Excel desde OneDrive...');

    const url = customUrl || ONEDRIVE_EXCEL_URL;

    if (!url) {
      throw new Error('No se ha configurado la URL de OneDrive. Edita ONEDRIVE_EXCEL_URL en googleSheetsAPI.js');
    }

    // Convertir a URL de descarga directa si es necesario
    const downloadUrl = convertirOneDriveURL(url);
    console.log('📥 URL de descarga:', downloadUrl);

    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      cache: 'no-cache'
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('El archivo descargado está vacío');
    }

    console.log(`✅ Excel obtenido exitosamente (${(arrayBuffer.byteLength / 1024).toFixed(2)} KB)`);
    return arrayBuffer;

  } catch (error) {
    console.error('❌ Error obteniendo Excel de OneDrive:', error);
    throw new Error(`No se pudo obtener el archivo: ${error.message}`);
  }
}

/**
 * Obtiene estadísticas del archivo Excel
 * @param {ArrayBuffer} arrayBuffer - Contenido del Excel
 * @returns {Object} Estadísticas básicas
 */
export function obtenerEstadisticasExcel(arrayBuffer) {
  return {
    tamanoKB: (arrayBuffer.byteLength / 1024).toFixed(2),
    tamanoBytes: arrayBuffer.byteLength
  };
}

export default {
  obtenerDatosGoogleSheets,
  obtenerEstadisticasCSV,
  verificarConexion,
  obtenerExcelOneDrive,
  obtenerEstadisticasExcel,
  convertirOneDriveURL
};
