import { useState, useEffect } from 'react';
import api from '../api';

function Bitacora() {
  const [logs, setLogs] = useState([]);
  const [filtroFecha, setFiltroFecha] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch (err) {
      console.error("Error cargando logs");
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const logsFiltrados = logs.filter(l => {
    if (!filtroFecha) return true;
    const fechaLog = new Date(l.fecha).toLocaleDateString('en-CA');
    return fechaLog === filtroFecha;
  });

  const imprimirReporte = () => {
    window.print();
  };

  return (
    <div className="bitacora-container" style={{ padding: '20px', maxWidth: '1100px', margin: 'auto' }}>
      
      <style>{`
        @media print {
          /* 1. Reset total de la jerarquía para eliminar el espacio a la izquierda */
          html, body, #root, [class*="layout"], [class*="main"], .bitacora-container {
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important; /* Rompe el flex/grid del layout principal */
            position: static !important;
            overflow: visible !important;
          }

          /* 2. Ocultar absolutamente todo lo que no sea la bitácora */
          nav, .sidebar, aside, header, footer, .no-print, button {
            display: none !important;
          }

          /* 3. Ajuste de la tabla */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: auto !important;
            font-size: 10pt !important;
            margin-top: 0 !important;
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          th, td {
            border: 1px solid #000 !important; /* Borde negro sólido para PDF */
            padding: 8px !important;
          }

          thead {
            display: table-header-group !important;
            background-color: #2c3e50 !important;
            -webkit-print-color-adjust: exact;
          }

          th { color: white !important; }

          /* 4. Eliminar la hoja blanca extra al final */
          br, div:empty {
            display: none !important;
          }

          /* 5. Configuración de página */
          @page {
            size: letter landscape;
            margin: 0.5cm; /* Margen mínimo para aprovechar la hoja */
          }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>📋 Bitácora de Actividades</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="date" 
            value={filtroFecha} 
            onChange={(e) => setFiltroFecha(e.target.value)} 
            style={inputStyle}
          />
          <button onClick={() => setFiltroFecha('')} style={btnSecondary}>Limpiar</button>
          <button onClick={imprimirReporte} style={btnPrimary}>Generar Reporte (PDF)</button>
        </div>
      </div>

      <table className="tabla-reporte" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#2c3e50', color: 'white' }}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Usuario</th>
            <th style={thStyle}>Acción</th>
            <th style={thStyle}>Entidad</th>
            <th style={thStyle}>Detalle</th>
            <th style={thStyle}>Fecha / Hora</th>
          </tr>
        </thead>
        <tbody>
          {logsFiltrados.length > 0 ? logsFiltrados.map((l) => (
            <tr key={l.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={tdStyle}>{l.id}</td>
              <td style={tdStyle}><strong>{l.usuario}</strong></td>
              <td style={tdStyle}>{l.accion}</td>
              <td style={tdStyle}>{l.entidad}</td>
              <td style={{...tdStyle, maxWidth: '300px'}}>{l.detalle}</td>
              <td style={tdStyle}>{new Date(l.fecha).toLocaleString()}</td>
            </tr>
          )) : (
            <tr><td colSpan="6" style={{ ...tdStyle, textAlign: 'center' }}>No hay registros para esta fecha.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'left' };
const tdStyle = { padding: '12px', fontSize: '13px' };
const inputStyle = { padding: '8px', borderRadius: '5px', border: '1px solid #ccc' };
const btnPrimary = { padding: '10px 15px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const btnSecondary = { padding: '10px 15px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default Bitacora;