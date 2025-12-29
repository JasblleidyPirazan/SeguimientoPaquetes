import { useState } from 'react';
import { Database, FileSpreadsheet, Play, RotateCcw, HelpCircle, RefreshCw } from 'lucide-react';
import FileUploader from './components/FileUploader';
import ResultadosValidacion from './components/ResultadosValidacion';
import { parseEasyCancha } from './utils/parseEasyCancha';
import { parseControlManual } from './utils/parseControlManual';
import { ejecutarValidaciones } from './utils/validador';
import { obtenerDatosGoogleSheets, obtenerEstadisticasCSV } from './utils/googleSheetsAPI';
import './App.css';

function App() {
  const [datosEasyCancha, setDatosEasyCancha] = useState(null);
  const [datosControl, setDatosControl] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [mostrarAyuda, setMostrarAyuda] = useState(false);
  const [cargandoAPI, setCargandoAPI] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Procesar archivo de EasyCancha
  const handleEasyCancha = async (file) => {
    const texto = await file.text();
    const { reservas, errores } = parseEasyCancha(texto);
    
    if (errores.length > 0) {
      console.warn('Errores de parseo EasyCancha:', errores);
    }
    
    setDatosEasyCancha(reservas);
    setResultado(null); // Limpiar resultados anteriores
    
    return {
      'Registros cargados': reservas.length,
      'Reservas USED': reservas.filter(r => r.esUsado).length,
      'Reservas CANCELLED': reservas.filter(r => r.esCancelado).length,
      'Errores de parseo': errores.length,
    };
  };

  // Procesar archivo de Control Manual
  const handleControlManual = async (file) => {
    const buffer = await file.arrayBuffer();
    const { registros, errores } = parseControlManual(buffer);

    if (errores.length > 0) {
      console.warn('Errores de parseo Control:', errores);
    }

    setDatosControl(registros);
    setResultado(null); // Limpiar resultados anteriores

    return {
      'Registros cargados': registros.length,
      'Con paquete': registros.filter(r => r.idPaquete).length,
      'Escuela': registros.filter(r => r.esEscuela).length,
      'Errores de parseo': errores.length,
    };
  };

  // Cargar datos desde Google Sheets API
  const cargarDesdeAPI = async () => {
    setCargandoAPI(true);

    try {
      // Obtener datos del CSV
      const csvText = await obtenerDatosGoogleSheets();

      // Obtener estadísticas
      const stats = obtenerEstadisticasCSV(csvText);
      console.log('📊 Estadísticas del CSV:', stats);

      // Parsear como EasyCancha (asumiendo que el CSV tiene el formato de EasyCancha)
      const { reservas, errores } = parseEasyCancha(csvText);

      if (errores.length > 0) {
        console.warn('Errores de parseo desde API:', errores);
      }

      // Actualizar estado
      setDatosEasyCancha(reservas);
      setUltimaActualizacion(new Date());
      setResultado(null); // Limpiar resultados anteriores

      // Mostrar mensaje de éxito
      alert(`✅ Datos actualizados desde Google Sheets\n\n` +
            `📊 ${reservas.length} reservas cargadas\n` +
            `✓ USED: ${reservas.filter(r => r.esUsado).length}\n` +
            `✓ CANCELLED: ${reservas.filter(r => r.esCancelado).length}`);

    } catch (error) {
      console.error('Error cargando desde API:', error);
      alert(`❌ Error al cargar datos:\n\n${error.message}\n\nVerifica que la URL de Google Sheets sea correcta y esté publicada.`);
    } finally {
      setCargandoAPI(false);
    }
  };

  // Ejecutar validación
  const ejecutarValidacion = () => {
    if (!datosEasyCancha || !datosControl) {
      alert('Debes cargar ambos archivos antes de validar');
      return;
    }
    
    setProcesando(true);
    
    // Usar setTimeout para permitir que se renderice el estado de carga
    setTimeout(() => {
      try {
        const res = ejecutarValidaciones(datosEasyCancha, datosControl);
        setResultado(res);
      } catch (error) {
        console.error('Error en validación:', error);
        alert('Error durante la validación: ' + error.message);
      } finally {
        setProcesando(false);
      }
    }, 100);
  };

  // Reiniciar todo
  const reiniciar = () => {
    setDatosEasyCancha(null);
    setDatosControl(null);
    setResultado(null);
  };

  const puedeValidar = datosEasyCancha && datosControl && !procesando;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>🎾 Tennis Validator</h1>
          <p>Validación de paquetes y reservas - Santa María Tenis Club</p>
        </div>
        <button 
          className="btn-help"
          onClick={() => setMostrarAyuda(!mostrarAyuda)}
        >
          <HelpCircle size={20} />
        </button>
      </header>

      {mostrarAyuda && (
        <div className="ayuda-panel">
          <h3>¿Cómo usar?</h3>
          <ol>
            <li><strong>Carga el archivo de EasyCancha:</strong> Exporta las reservas desde EasyCancha en formato TSV/CSV.</li>
            <li><strong>Carga el archivo de Control Manual:</strong> El Excel con el registro de asistencia y paquetes.</li>
            <li><strong>Ejecuta la validación:</strong> El sistema cruzará los datos y detectará inconsistencias.</li>
            <li><strong>Revisa los resultados:</strong> Errores críticos, advertencias y exporta el reporte.</li>
          </ol>
          <h4>Validaciones que se ejecutan:</h4>
          <ul>
            <li>Cruce de reservas USED con registros de control</li>
            <li>Tipo de paquete correcto para cada actividad</li>
            <li>Conteo de usos de paquete (X DE Y)</li>
            <li>Reservas canceladas con descuento de paquete</li>
            <li>Horario diurno/nocturno correcto</li>
          </ul>
        </div>
      )}

      <main className="app-main">
        {/* Sección de carga de archivos */}
        <section className="upload-section">
          <FileUploader
            title="EasyCancha Export"
            description="Archivo TSV/CSV con las reservas exportadas"
            accept=".tsv,.csv,.txt"
            onFileLoaded={handleEasyCancha}
            icon={Database}
            processingLabel="Parseando reservas..."
          />

          <FileUploader
            title="Control Manual"
            description="Archivo Excel con registro de asistencia"
            accept=".xlsx,.xls"
            onFileLoaded={handleControlManual}
            icon={FileSpreadsheet}
            processingLabel="Procesando Excel..."
          />
        </section>

        {/* Sección de carga desde API */}
        <section className="api-section">
          <div className="api-card">
            <div className="api-header">
              <Database size={24} />
              <h3>Cargar desde Google Sheets</h3>
            </div>
            <p className="api-description">
              Obtén los datos más recientes directamente desde la API de Google Sheets
            </p>
            <button
              className={`btn-api ${cargandoAPI ? 'loading' : ''}`}
              onClick={cargarDesdeAPI}
              disabled={cargandoAPI}
            >
              {cargandoAPI ? (
                <>
                  <span className="spinner-small"></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Actualizar desde API
                </>
              )}
            </button>
            {ultimaActualizacion && (
              <p className="api-last-update">
                Última actualización: {ultimaActualizacion.toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </section>

        {/* Botones de acción */}
        <section className="actions-section">
          <button 
            className={`btn-primary ${!puedeValidar ? 'disabled' : ''}`}
            onClick={ejecutarValidacion}
            disabled={!puedeValidar}
          >
            {procesando ? (
              <>
                <span className="spinner-small"></span>
                Validando...
              </>
            ) : (
              <>
                <Play size={20} />
                Ejecutar Validación
              </>
            )}
          </button>
          
          {(datosEasyCancha || datosControl || resultado) && (
            <button className="btn-secondary" onClick={reiniciar}>
              <RotateCcw size={20} />
              Reiniciar
            </button>
          )}
        </section>

        {/* Indicador de archivos cargados */}
        {(datosEasyCancha || datosControl) && !resultado && (
          <section className="status-section">
            <div className="status-grid">
              <div className={`status-item ${datosEasyCancha ? 'loaded' : 'pending'}`}>
                <span className="status-label">EasyCancha</span>
                <span className="status-value">
                  {datosEasyCancha ? `${datosEasyCancha.length} registros` : 'Pendiente'}
                </span>
              </div>
              <div className={`status-item ${datosControl ? 'loaded' : 'pending'}`}>
                <span className="status-label">Control Manual</span>
                <span className="status-value">
                  {datosControl ? `${datosControl.length} registros` : 'Pendiente'}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Resultados */}
        {resultado && (
          <ResultadosValidacion resultado={resultado} />
        )}
      </main>

      <footer className="app-footer">
        <p>Tennis Validator v1.0 | Polidata</p>
      </footer>
    </div>
  );
}

export default App;
