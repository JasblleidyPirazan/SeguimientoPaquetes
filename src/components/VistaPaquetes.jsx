import { useState, useMemo } from 'react';
import {
  Package,
  Users,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  Download
} from 'lucide-react';
import {
  generarReporteUsuario,
  descargarReporte
} from '../utils/reporteUsuario';
import { CODIGO_ERROR } from '../utils/validador';

/**
 * Tarjeta de métrica para KPIs
 */
function MetricCard({ titulo, valor, subtitulo, tipo, icono: Icono }) {
  const claseColor = {
    success: 'metric-success',
    warning: 'metric-warning',
    error: 'metric-error',
    info: 'metric-info',
    neutral: 'metric-neutral'
  }[tipo] || 'metric-neutral';

  return (
    <div className={`metric-card ${claseColor}`}>
      <div className="metric-icon">
        <Icono size={28} />
      </div>
      <div className="metric-content">
        <div className="metric-valor">{valor}</div>
        <div className="metric-titulo">{titulo}</div>
        {subtitulo && <div className="metric-subtitulo">{subtitulo}</div>}
      </div>
    </div>
  );
}

/**
 * Fila de usuario con problemas de paquetes
 */
function FilaUsuario({
  usuario,
  onGenerarReporte,
  expandido,
  onToggleExpand
}) {
  const { nombre, documento, paquetesActivos, inconsistencias, detalleErrores } = usuario;

  const totalInconsistencias = inconsistencias.criticas + inconsistencias.advertencias;

  return (
    <div className="fila-usuario">
      <div className="fila-principal" onClick={onToggleExpand}>
        <div className="usuario-info">
          <div className="usuario-nombre">{nombre}</div>
          <div className="usuario-documento">Doc: {documento}</div>
        </div>

        <div className="usuario-metricas">
          <div className="metrica-item">
            <Package size={16} />
            <span>{paquetesActivos} paquetes</span>
          </div>
          <div className="metrica-item error">
            <AlertCircle size={16} />
            <span>{inconsistencias.criticas} críticas</span>
          </div>
          <div className="metrica-item warning">
            <AlertTriangle size={16} />
            <span>{inconsistencias.advertencias} advertencias</span>
          </div>
        </div>

        <div className="usuario-acciones">
          <button
            className="btn-small btn-primary"
            onClick={(e) => {
              e.stopPropagation();
              onGenerarReporte(documento, nombre);
            }}
          >
            <FileText size={14} /> Reporte
          </button>
          {expandido ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expandido && (
        <div className="fila-detalles">
          <h4>Detalles de Inconsistencias:</h4>
          <div className="detalles-grid">
            {detalleErrores.map((error, idx) => (
              <div key={idx} className={`detalle-item ${error.severidad}`}>
                <div className="detalle-tipo">{error.tipo}</div>
                <div className="detalle-descripcion">{error.descripcion}</div>
                <div className="detalle-count">{error.cantidad}x</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Vista principal de seguimiento de paquetes
 */
export default function VistaPaquetes({
  resultado,
  reservasEasyCancha = [],
  registrosControl = []
}) {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroSeveridad, setFiltroSeveridad] = useState('todos');
  const [ordenPor, setOrdenPor] = useState('inconsistencias');
  const [usuarioExpandido, setUsuarioExpandido] = useState(null);

  if (!resultado) return null;

  // Calcular métricas y usuarios con problemas
  const { metricas, usuariosConProblemas } = useMemo(() => {
    return calcularMetricasPaquetes(
      reservasEasyCancha,
      registrosControl,
      resultado.errores
    );
  }, [reservasEasyCancha, registrosControl, resultado]);

  // Aplicar filtros
  const usuariosFiltrados = usuariosConProblemas.filter(usuario => {
    if (filtroSeveridad === 'criticas' && usuario.inconsistencias.criticas === 0) {
      return false;
    }
    if (filtroSeveridad === 'advertencias' && usuario.inconsistencias.advertencias === 0) {
      return false;
    }
    return true;
  });

  // Ordenar usuarios
  const usuariosOrdenados = [...usuariosFiltrados].sort((a, b) => {
    if (ordenPor === 'inconsistencias') {
      const totalA = a.inconsistencias.criticas + a.inconsistencias.advertencias;
      const totalB = b.inconsistencias.criticas + b.inconsistencias.advertencias;
      return totalB - totalA;
    } else if (ordenPor === 'criticas') {
      return b.inconsistencias.criticas - a.inconsistencias.criticas;
    } else if (ordenPor === 'nombre') {
      return a.nombre.localeCompare(b.nombre);
    }
    return 0;
  });

  const generarReporte = (documento, nombre) => {
    try {
      const workbook = generarReporteUsuario(
        documento,
        nombre,
        reservasEasyCancha,
        registrosControl,
        resultado
      );

      descargarReporte(workbook, nombre, documento);
      alert(`✅ Reporte generado para ${nombre}`);
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert(`❌ Error al generar reporte: ${error.message}`);
    }
  };

  return (
    <div className="vista-paquetes">
      {/* Header */}
      <div className="vista-header">
        <div className="header-title">
          <Package size={28} />
          <div>
            <h2>Seguimiento de Paquetes</h2>
            <p>Control y validación de paquetes activos</p>
          </div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="metricas-grid">
        <MetricCard
          titulo="Paquetes Activos"
          valor={metricas.paquetesActivos}
          subtitulo={`${metricas.paquetesPorVencer} por vencer`}
          tipo="info"
          icono={Package}
        />
        <MetricCard
          titulo="Usuarios con Paquetes"
          valor={metricas.usuariosConPaquetes}
          subtitulo={`${metricas.usuariosConProblemas} con problemas`}
          tipo="neutral"
          icono={Users}
        />
        <MetricCard
          titulo="Inconsistencias Críticas"
          valor={metricas.inconsistenciasCriticas}
          subtitulo="Requieren atención inmediata"
          tipo={metricas.inconsistenciasCriticas > 0 ? 'error' : 'success'}
          icono={AlertCircle}
        />
        <MetricCard
          titulo="Advertencias"
          valor={metricas.inconsistenciasAdvertencias}
          subtitulo="Revisar y corregir"
          tipo={metricas.inconsistenciasAdvertencias > 0 ? 'warning' : 'success'}
          icono={AlertTriangle}
        />
      </div>

      {/* Resumen por tipo de paquete */}
      <div className="resumen-tipos">
        <h3>Paquetes por Tipo</h3>
        <div className="tipos-grid">
          {metricas.porTipo.map(tipo => (
            <div key={tipo.codigo} className="tipo-card">
              <div className="tipo-nombre">{tipo.nombre}</div>
              <div className="tipo-stats">
                <span className="stat-activos">{tipo.activos} activos</span>
                <span className="stat-errores">{tipo.errores} con errores</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="controles-seccion">
        <div className="filtros">
          <div className="filtro-grupo">
            <Filter size={16} />
            <label>Severidad:</label>
            <select
              value={filtroSeveridad}
              onChange={(e) => setFiltroSeveridad(e.target.value)}
            >
              <option value="todos">Todas</option>
              <option value="criticas">Solo Críticas</option>
              <option value="advertencias">Solo Advertencias</option>
            </select>
          </div>

          <div className="filtro-grupo">
            <TrendingUp size={16} />
            <label>Ordenar por:</label>
            <select
              value={ordenPor}
              onChange={(e) => setOrdenPor(e.target.value)}
            >
              <option value="inconsistencias">Total Inconsistencias</option>
              <option value="criticas">Críticas</option>
              <option value="nombre">Nombre</option>
            </select>
          </div>
        </div>

        <div className="info-resultados">
          Mostrando {usuariosOrdenados.length} de {usuariosConProblemas.length} usuarios con problemas
        </div>
      </div>

      {/* Lista de usuarios con problemas */}
      <div className="usuarios-seccion">
        <h3>Usuarios con Inconsistencias en Paquetes</h3>

        {usuariosOrdenados.length === 0 ? (
          <div className="sin-problemas">
            <CheckCircle size={48} />
            <h4>¡Sin problemas detectados!</h4>
            <p>No se encontraron inconsistencias en los paquetes</p>
          </div>
        ) : (
          <div className="usuarios-lista">
            {usuariosOrdenados.map(usuario => (
              <FilaUsuario
                key={usuario.documento}
                usuario={usuario}
                onGenerarReporte={generarReporte}
                expandido={usuarioExpandido === usuario.documento}
                onToggleExpand={() =>
                  setUsuarioExpandido(
                    usuarioExpandido === usuario.documento ? null : usuario.documento
                  )
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Calcula métricas de paquetes y usuarios con problemas
 */
function calcularMetricasPaquetes(reservasEasyCancha, registrosControl, errores) {
  // Agrupar registros por usuario
  const usuariosPaquetes = new Map();

  registrosControl.forEach(reg => {
    if (reg.idPaquete && reg.documentoId) {
      if (!usuariosPaquetes.has(reg.documentoId)) {
        usuariosPaquetes.set(reg.documentoId, {
          nombre: reg.nombreCompleto,
          documento: reg.documentoId,
          paquetes: new Map()
        });
      }

      const usuario = usuariosPaquetes.get(reg.documentoId);
      const keyPaquete = `${reg.codigoProducto}-${reg.idPaquete}`;

      if (!usuario.paquetes.has(keyPaquete)) {
        usuario.paquetes.set(keyPaquete, {
          codigo: reg.codigoProducto,
          nombre: reg.nombreProducto,
          idPaquete: reg.idPaquete,
          estado: reg.estado,
          total: reg.totalPaquete || 0,
          usos: [],
          restantes: reg.clasesRestantes || 0
        });
      }

      usuario.paquetes.get(keyPaquete).usos.push(reg);
    }
  });

  // Contar paquetes activos y por vencer
  let paquetesActivos = 0;
  let paquetesPorVencer = 0;

  usuariosPaquetes.forEach(usuario => {
    usuario.paquetes.forEach(paquete => {
      if (paquete.estado === 'ACTIVO' || paquete.estado === 'Activo') {
        paquetesActivos++;
        if (paquete.restantes <= 2 && paquete.restantes > 0) {
          paquetesPorVencer++;
        }
      }
    });
  });

  // Filtrar errores relacionados con paquetes
  const erroresPaquetes = {
    criticos: errores.criticos.filter(e =>
      e.codigo === CODIGO_ERROR.PAQUETE_INCORRECTO ||
      e.codigo === CODIGO_ERROR.CONTEO_EXCEDIDO ||
      e.codigo === CODIGO_ERROR.CANCELADO_CON_DESCUENTO
    ),
    advertencias: errores.advertencias.filter(e =>
      e.codigo === CODIGO_ERROR.CONTEO_DIFERENTE ||
      e.codigo === CODIGO_ERROR.PAQUETE_INACTIVO_CON_USOS
    )
  };

  // Agrupar errores por usuario
  const erroresPorUsuario = new Map();

  [...erroresPaquetes.criticos, ...erroresPaquetes.advertencias].forEach(error => {
    const doc = error.reserva?.documento ||
                error.control?.documentoId ||
                error.datos?.reserva?.documento ||
                error.datos?.control?.documentoId;

    if (doc) {
      if (!erroresPorUsuario.has(doc)) {
        erroresPorUsuario.set(doc, {
          criticos: [],
          advertencias: []
        });
      }

      const severidad = error.tipo === 'CRITICO' ? 'criticos' : 'advertencias';
      erroresPorUsuario.get(doc)[severidad].push(error);
    }
  });

  // Construir lista de usuarios con problemas
  const usuariosConProblemas = [];

  erroresPorUsuario.forEach((erroresUsuario, documento) => {
    const usuarioData = usuariosPaquetes.get(documento);
    const nombre = usuarioData?.nombre ||
                   erroresUsuario.criticos[0]?.reserva?.nombre ||
                   erroresUsuario.advertencias[0]?.reserva?.nombre ||
                   'Desconocido';

    // Contar paquetes activos del usuario
    const paquetesActivosUsuario = usuarioData
      ? Array.from(usuarioData.paquetes.values()).filter(p =>
          p.estado === 'ACTIVO' || p.estado === 'Activo'
        ).length
      : 0;

    // Agrupar errores por tipo
    const detalleErrores = agruparErroresPorTipo([
      ...erroresUsuario.criticos,
      ...erroresUsuario.advertencias
    ]);

    usuariosConProblemas.push({
      nombre,
      documento,
      paquetesActivos: paquetesActivosUsuario,
      inconsistencias: {
        criticas: erroresUsuario.criticos.length,
        advertencias: erroresUsuario.advertencias.length
      },
      detalleErrores
    });
  });

  // Agrupar paquetes por tipo
  const tiposPaquetes = new Map();

  registrosControl.forEach(reg => {
    if (reg.codigoProducto && reg.idPaquete) {
      const codigo = reg.codigoProducto;
      if (!tiposPaquetes.has(codigo)) {
        tiposPaquetes.set(codigo, {
          codigo,
          nombre: reg.nombreProducto,
          activos: new Set(),
          errores: 0
        });
      }

      if (reg.estado === 'ACTIVO' || reg.estado === 'Activo') {
        tiposPaquetes.get(codigo).activos.add(`${codigo}-${reg.idPaquete}`);
      }
    }
  });

  // Contar errores por tipo de paquete
  erroresPaquetes.criticos.forEach(error => {
    const codigo = error.control?.codigoProducto;
    if (codigo && tiposPaquetes.has(codigo)) {
      tiposPaquetes.get(codigo).errores++;
    }
  });

  const porTipo = Array.from(tiposPaquetes.values()).map(tipo => ({
    codigo: tipo.codigo,
    nombre: tipo.nombre,
    activos: tipo.activos.size,
    errores: tipo.errores
  }));

  return {
    metricas: {
      paquetesActivos,
      paquetesPorVencer,
      usuariosConPaquetes: usuariosPaquetes.size,
      usuariosConProblemas: usuariosConProblemas.length,
      inconsistenciasCriticas: erroresPaquetes.criticos.length,
      inconsistenciasAdvertencias: erroresPaquetes.advertencias.length,
      porTipo
    },
    usuariosConProblemas
  };
}

/**
 * Agrupa errores por tipo para mostrar en detalles
 */
function agruparErroresPorTipo(errores) {
  const agrupados = {};

  errores.forEach(error => {
    const tipo = error.codigo;
    if (!agrupados[tipo]) {
      agrupados[tipo] = {
        tipo: traducirTipoError(tipo),
        descripcion: error.mensaje,
        cantidad: 0,
        severidad: error.tipo === 'CRITICO' ? 'critico' : 'advertencia'
      };
    }
    agrupados[tipo].cantidad++;
  });

  return Object.values(agrupados);
}

/**
 * Traduce códigos de error a nombres legibles
 */
function traducirTipoError(codigo) {
  const traducciones = {
    [CODIGO_ERROR.PAQUETE_INCORRECTO]: 'Tipo de paquete incorrecto',
    [CODIGO_ERROR.CONTEO_EXCEDIDO]: 'Conteo excedido',
    [CODIGO_ERROR.CONTEO_DIFERENTE]: 'Conteo diferente',
    [CODIGO_ERROR.CANCELADO_CON_DESCUENTO]: 'Cancelado con descuento',
    [CODIGO_ERROR.PAQUETE_INACTIVO_CON_USOS]: 'Paquete inactivo con usos'
  };

  return traducciones[codigo] || codigo;
}
