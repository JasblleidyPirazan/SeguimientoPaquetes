import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Download,
  Filter,
  FileText,
  User
} from 'lucide-react';
import {
  generarReporteUsuario,
  descargarReporte,
  obtenerListaUsuarios
} from '../utils/reporteUsuario';

/**
 * Tarjeta de resumen
 */
function ResumenCard({ titulo, valor, tipo, icono: Icono }) {
  const claseColor = {
    critico: 'card-critico',
    advertencia: 'card-advertencia',
    info: 'card-info',
    success: 'card-success',
    neutral: 'card-neutral',
  }[tipo] || 'card-neutral';

  return (
    <div className={`resumen-card ${claseColor}`}>
      <Icono size={24} />
      <div className="card-content">
        <span className="card-valor">{valor}</span>
        <span className="card-titulo">{titulo}</span>
      </div>
    </div>
  );
}

/**
 * Item de error expandible
 */
function ErrorItem({ error, index }) {
  const [expandido, setExpandido] = useState(false);

  const IconoTipo = {
    CRITICO: AlertCircle,
    ADVERTENCIA: AlertTriangle,
    INFO: Info,
  }[error.tipo] || Info;

  const claseTipo = {
    CRITICO: 'error-critico',
    ADVERTENCIA: 'error-advertencia',
    INFO: 'error-info',
  }[error.tipo] || 'error-info';

  return (
    <div className={`error-item ${claseTipo}`}>
      <div 
        className="error-header" 
        onClick={() => setExpandido(!expandido)}
      >
        <div className="error-title">
          <IconoTipo size={18} />
          <span className="error-codigo">{error.codigo}</span>
          <span className="error-mensaje">{error.mensaje}</span>
        </div>
        {expandido ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </div>
      
      {expandido && (
        <div className="error-detalles">
          {error.reserva && (
            <div className="detalle-grupo">
              <h4>Reserva (EasyCancha)</h4>
              <pre>{JSON.stringify(error.reserva, null, 2)}</pre>
            </div>
          )}
          {error.control && (
            <div className="detalle-grupo">
              <h4>Control Manual</h4>
              <pre>{JSON.stringify(error.control, null, 2)}</pre>
            </div>
          )}
          {error.paquete && (
            <div className="detalle-grupo">
              <h4>Paquete</h4>
              <pre>{JSON.stringify(error.paquete, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Lista de errores agrupada
 */
function ListaErrores({ titulo, errores, tipo }) {
  const [mostrarTodos, setMostrarTodos] = useState(false);
  
  if (!errores || errores.length === 0) return null;
  
  const erroresMostrados = mostrarTodos ? errores : errores.slice(0, 5);

  return (
    <div className="lista-errores">
      <h3 className={`titulo-${tipo.toLowerCase()}`}>
        {titulo} ({errores.length})
      </h3>
      
      <div className="errores-container">
        {erroresMostrados.map((error, index) => (
          <ErrorItem key={index} error={error} index={index} />
        ))}
      </div>
      
      {errores.length > 5 && (
        <button 
          className="btn-mostrar-mas"
          onClick={() => setMostrarTodos(!mostrarTodos)}
        >
          {mostrarTodos ? 'Mostrar menos' : `Mostrar todos (${errores.length})`}
        </button>
      )}
    </div>
  );
}

/**
 * Componente principal de resultados
 */
export default function ResultadosValidacion({
  resultado,
  reservasEasyCancha = [],
  registrosControl = [],
  onExportar
}) {
  const [filtroActivo, setFiltroActivo] = useState('todos');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [mostrarSelectorUsuario, setMostrarSelectorUsuario] = useState(false);

  if (!resultado) return null;

  const { resumen, errores, validaciones } = resultado;

  // Obtener lista de usuarios
  const listaUsuarios = obtenerListaUsuarios(reservasEasyCancha, registrosControl);

  const exportarJSON = () => {
    const blob = new Blob([JSON.stringify(resultado, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `validacion-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarCSV = () => {
    const lineas = ['Tipo,Código,Mensaje,Fecha,Hora,Documento,Nombre'];

    [...errores.criticos, ...errores.advertencias].forEach(error => {
      const fecha = error.reserva?.fecha || error.control?.fecha || '';
      const hora = error.reserva?.hora || error.control?.hora || '';
      const doc = error.reserva?.documento || error.control?.documento || '';
      const nombre = error.reserva?.nombre || error.control?.nombre || '';

      lineas.push(`${error.tipo},${error.codigo},"${error.mensaje}",${fecha},${hora},${doc},"${nombre}"`);
    });

    const blob = new Blob([lineas.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `errores-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generarReporteDeUsuario = () => {
    if (!usuarioSeleccionado) {
      alert('Por favor selecciona un usuario');
      return;
    }

    const usuario = listaUsuarios.find(u => u.documento === usuarioSeleccionado);
    if (!usuario) {
      alert('Usuario no encontrado');
      return;
    }

    try {
      const workbook = generarReporteUsuario(
        usuario.documento,
        usuario.nombre,
        reservasEasyCancha,
        registrosControl,
        resultado
      );

      descargarReporte(workbook, usuario.nombre, usuario.documento);
      alert(`✅ Reporte generado para ${usuario.nombre}`);
      setMostrarSelectorUsuario(false);
      setUsuarioSeleccionado('');
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert(`❌ Error al generar reporte: ${error.message}`);
    }
  };

  return (
    <div className="resultados-validacion">
      <div className="resultados-header">
        <h2>Resultados de Validación</h2>
        <div className="acciones">
          <button
            className="btn-primary btn-reporte-usuario"
            onClick={() => setMostrarSelectorUsuario(!mostrarSelectorUsuario)}
          >
            <FileText size={16} /> Reporte por Usuario
          </button>
          <button className="btn-secondary" onClick={exportarCSV}>
            <Download size={16} /> CSV
          </button>
          <button className="btn-secondary" onClick={exportarJSON}>
            <Download size={16} /> JSON
          </button>
        </div>
      </div>

      {/* Selector de Usuario */}
      {mostrarSelectorUsuario && (
        <div className="selector-usuario-panel">
          <div className="selector-header">
            <User size={20} />
            <h3>Seleccionar Usuario para Reporte Detallado</h3>
          </div>
          <div className="selector-content">
            <select
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="select-usuario"
            >
              <option value="">-- Selecciona un usuario --</option>
              {listaUsuarios.map(usuario => (
                <option key={usuario.documento} value={usuario.documento}>
                  {usuario.nombre} (Doc: {usuario.documento})
                </option>
              ))}
            </select>
            <div className="selector-acciones">
              <button
                className="btn-primary"
                onClick={generarReporteDeUsuario}
                disabled={!usuarioSeleccionado}
              >
                <Download size={16} /> Generar Reporte Excel
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setMostrarSelectorUsuario(false);
                  setUsuarioSeleccionado('');
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
          <div className="selector-info">
            <Info size={14} />
            <span>
              El reporte incluirá: resumen ejecutivo, inconsistencias detalladas,
              paquetes y historial completo de actividades.
            </span>
          </div>
        </div>
      )}

      {/* Tarjetas de resumen */}
      <div className="resumen-grid">
        <ResumenCard 
          titulo="Reservas analizadas" 
          valor={resumen.totalReservas}
          tipo="neutral"
          icono={Info}
        />
        <ResumenCard 
          titulo="Reservas usadas" 
          valor={resumen.reservasUsadas}
          tipo="success"
          icono={CheckCircle}
        />
        <ResumenCard 
          titulo="Errores críticos" 
          valor={resumen.totalErroresCriticos}
          tipo={resumen.totalErroresCriticos > 0 ? 'critico' : 'success'}
          icono={AlertCircle}
        />
        <ResumenCard 
          titulo="Advertencias" 
          valor={resumen.totalAdvertencias}
          tipo={resumen.totalAdvertencias > 0 ? 'advertencia' : 'success'}
          icono={AlertTriangle}
        />
      </div>

      {/* Estado de validaciones */}
      <div className="validaciones-estado">
        <h3>Estado de Validaciones</h3>
        <div className="validaciones-grid">
          {Object.entries(validaciones).map(([nombre, estado]) => (
            <div 
              key={nombre} 
              className={`validacion-item ${estado.ejecutada ? 'ejecutada' : 'fallida'}`}
            >
              {estado.ejecutada ? (
                <CheckCircle size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              <span>{nombre}</span>
              {estado.ejecutada && (
                <span className="count">{estado.erroresEncontrados}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Listas de errores */}
      <div className="errores-section">
        <ListaErrores 
          titulo="Errores Críticos" 
          errores={errores.criticos}
          tipo="CRITICO"
        />
        
        <ListaErrores 
          titulo="Advertencias" 
          errores={errores.advertencias}
          tipo="ADVERTENCIA"
        />
        
        {errores.info.length > 0 && (
          <ListaErrores 
            titulo="Información" 
            errores={errores.info}
            tipo="INFO"
          />
        )}
      </div>

      {/* Mensaje cuando no hay errores */}
      {resumen.totalErroresCriticos === 0 && resumen.totalAdvertencias === 0 && (
        <div className="sin-errores">
          <CheckCircle size={48} />
          <h3>¡Sin inconsistencias!</h3>
          <p>No se encontraron errores ni advertencias en los datos analizados.</p>
        </div>
      )}
    </div>
  );
}
