# 🎾 Tennis Validator

Aplicación web para validar el uso de paquetes y reservas del club de tenis Santa María. Cruza datos exportados de EasyCancha con el control manual de asistencia para detectar inconsistencias.

## 🚀 Demo

Desplegado en Netlify: [tennis-validator.netlify.app](https://tennis-validator.netlify.app) *(actualizar con URL real)*

## ✨ Características

- **Carga de archivos**: Soporta TSV/CSV de EasyCancha y Excel de control manual
- **Integración con Google Sheets**: Botón para actualizar datos automáticamente desde una hoja de Google Sheets publicada
- **5 validaciones automáticas**:
  1. Cruce de reservas USED con registros de control
  2. Tipo de paquete correcto para cada actividad
  3. Conteo de usos de paquete (X DE Y)
  4. Reservas canceladas con descuento de paquete
  5. Horario diurno/nocturno correcto
- **Dashboard de resultados**: Errores críticos, advertencias e información
- **Exportación**: JSON y CSV de errores encontrados
- **100% cliente**: No requiere backend, todo se procesa en el navegador

## 📦 Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/tennis-validator.git
cd tennis-validator

# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build
```

## 🔧 Uso

### 1. Preparar archivo de EasyCancha

Exportar las reservas desde EasyCancha en formato TSV o CSV. El archivo debe contener columnas como:
- `booking_id`, `date`, `start_time`, `end_time`
- `customer_id`, `first_name`, `last_name`, `document_id`
- `sport_name`, `service_name`, `status`

### 2. Preparar archivo de Control Manual

El Excel debe tener las siguientes columnas en orden:
1. Fecha
2. Hora inicio
3. Hora fin
4. Nombre
5. Documento
6. Cancha
7. Código producto
8. Nombre producto
9. ID Paquete
10. Uso de paquete (formato "X DE Y")
11. Clases restantes
12. Estado
13. Valor paquete
14. Método de pago
15. Valor pagado
16. Comprobante
17. Fecha compra
18. Observaciones
19. Profesor

### 3. Cargar datos desde Google Sheets (Alternativo)

En lugar de cargar archivos manualmente, puedes usar la integración con Google Sheets:

1. **Publicar tu Google Sheet como CSV**:
   - Abre tu Google Sheet con los datos de EasyCancha
   - Ve a `Archivo` → `Compartir` → `Publicar en la Web`
   - Selecciona la pestaña que quieres publicar
   - Cambia el formato a "CSV"
   - Copia el enlace generado

2. **Configurar la URL en la aplicación**:
   - Edita el archivo `/src/utils/googleSheetsAPI.js`
   - Reemplaza `GOOGLE_SHEETS_CSV_URL` con tu enlace

3. **Usar el botón de actualización**:
   - Haz clic en el botón "Actualizar desde API"
   - Los datos se cargarán automáticamente

### 4. Ejecutar validación

1. Cargar ambos archivos en la aplicación (o usar el botón de actualización de API)
2. Hacer clic en "Ejecutar Validación"
3. Revisar resultados y exportar reporte si es necesario

## 📊 Tipos de errores detectados

### 🔴 Críticos
- `RESERVA_SIN_CONTROL`: Reserva USED sin registro en control manual
- `PAQUETE_INCORRECTO`: Tipo de paquete no válido para la actividad
- `CONTEO_EXCEDIDO`: Paquete con más usos que el límite
- `DOBLE_DESCUENTO`: Misma reserva descontada de dos paquetes

### 🟡 Advertencias
- `CONTROL_SIN_RESERVA`: Registro en control sin reserva correspondiente
- `ESTADO_DIFERENTE`: Estado de reserva no coincide
- `HORARIO_INCORRECTO`: Paquete diurno usado en horario nocturno
- `CANCELADO_CON_DESCUENTO`: Reserva cancelada pero con descuento

## 🏗️ Estructura del proyecto

```
tennis-validator/
├── src/
│   ├── components/
│   │   ├── FileUploader.jsx      # Componente de carga de archivos
│   │   └── ResultadosValidacion.jsx  # Dashboard de resultados
│   ├── data/
│   │   └── productos.js          # Tabla maestra de productos
│   ├── utils/
│   │   ├── parseEasyCancha.js    # Parser de EasyCancha
│   │   ├── parseControlManual.js # Parser de Excel
│   │   └── validador.js          # Motor de validación
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── netlify.toml                   # Configuración de Netlify
├── package.json
└── README.md
```

## 🛠️ Tecnologías

- **React 18** + Vite
- **xlsx** - Lectura de archivos Excel
- **papaparse** - Parseo de CSV
- **date-fns** - Manejo de fechas
- **lucide-react** - Iconos

## 📝 Despliegue en Netlify

### Opción 1: Desde GitHub

1. Conectar repositorio a Netlify
2. Configuración de build ya está en `netlify.toml`
3. Deploy automático en cada push

### Opción 2: Deploy manual

```bash
# Construir
npm run build

# Subir carpeta dist/ a Netlify manualmente
```

## 🔜 Roadmap

- [ ] Conexión directa con API de EasyCancha
- [x] Conexión con Google Sheets
- [ ] Historial de validaciones
- [ ] Filtros avanzados por usuario/fecha
- [ ] Generación de reportes PDF

## 📄 Licencia

MIT © Polidata
