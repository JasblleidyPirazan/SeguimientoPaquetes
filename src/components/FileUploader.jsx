import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Componente para cargar archivos
 */
export default function FileUploader({ 
  title, 
  description, 
  accept, 
  onFileLoaded, 
  icon: Icon = FileText,
  processingLabel = "Procesando..."
}) {
  const [estado, setEstado] = useState('idle'); // idle, loading, success, error
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer?.files || e.target?.files;
    if (files && files.length > 0) {
      procesarArchivo(files[0]);
    }
  }, []);

  const procesarArchivo = async (file) => {
    setEstado('loading');
    setArchivo(file);
    setError(null);

    try {
      const resultado = await onFileLoaded(file);
      setEstadisticas(resultado);
      setEstado('success');
    } catch (err) {
      setError(err.message);
      setEstado('error');
    }
  };

  const limpiar = () => {
    setEstado('idle');
    setArchivo(null);
    setError(null);
    setEstadisticas(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="file-uploader">
      <div className="file-uploader-header">
        <Icon size={24} />
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </div>

      {estado === 'idle' && (
        <div 
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById(`file-${title}`).click()}
        >
          <Upload size={32} />
          <p>Arrastra un archivo aquí o haz clic para seleccionar</p>
          <span className="file-types">Formatos: {accept}</span>
          <input 
            id={`file-${title}`}
            type="file" 
            accept={accept}
            onChange={(e) => handleDrop(e)}
            style={{ display: 'none' }}
          />
        </div>
      )}

      {estado === 'loading' && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>{processingLabel}</p>
          <span className="file-name">{archivo?.name}</span>
        </div>
      )}

      {estado === 'success' && (
        <div className="success-state">
          <div className="success-header">
            <CheckCircle size={24} className="success-icon" />
            <span className="file-name">{archivo?.name}</span>
            <button className="btn-clear" onClick={limpiar}>
              <X size={16} />
            </button>
          </div>
          {estadisticas && (
            <div className="estadisticas">
              {Object.entries(estadisticas).map(([key, value]) => (
                <div key={key} className="stat-item">
                  <span className="stat-label">{key}:</span>
                  <span className="stat-value">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {estado === 'error' && (
        <div className="error-state">
          <div className="error-header">
            <AlertCircle size={24} className="error-icon" />
            <span>Error al procesar archivo</span>
            <button className="btn-clear" onClick={limpiar}>
              <X size={16} />
            </button>
          </div>
          <p className="error-message">{error}</p>
        </div>
      )}
    </div>
  );
}
