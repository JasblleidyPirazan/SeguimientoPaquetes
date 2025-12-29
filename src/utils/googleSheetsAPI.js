/**
 * Utilidad para obtener datos de Google Sheets publicado como CSV
 */

// URL del CSV publicado de Google Sheets
const GOOGLE_SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRV3H6RgjRRL6x6Kqoi_uSGTwCEdFLmekW9bgQdesfX_wslbjM1BkO2dv_OxjgZm2QXEu_ggWwNGdzu/pub?output=csv';

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

export default {
  obtenerDatosGoogleSheets,
  obtenerEstadisticasCSV,
  verificarConexion
};
