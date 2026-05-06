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
    <div className="bitacora-container">
      
      <style>{`
        .bitacora-container {
          padding: 20px;
          max-width: 1100px;
          margin: auto;
        }

        .header-bitacora {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          align-items: center;
          gap: 15px;
        }

        .controles-bitacora {
          display: flex;
          gap: 10px;
        }

        /* --- RESPONSIVO MÓVIL --- */
        @media (max-width: 800px) {
          .header-bitacora {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .controles-bitacora {
            width: 100%;
            flex-wrap: wrap;
          }

          .controles-bitacora input, 
          .controles-bitacora button {
            flex: 1;
            min-width: 120px;
          }

          /* Transformación de Tabla a Cards */
          .tabla-reporte thead {
            display: none; /* Ocultar cabecera en móvil */
          }

          .tabla-reporte, .tabla-reporte tbody, .tabla-reporte tr, .tabla-reporte td {
            display: block;
            width: 100%;
          }

          .tabla-reporte tr {
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            background: #fff;
          }

          .tabla-reporte td {
            text-align: right;
            padding-left: 50% !important;
            position: relative;
            border-bottom: 1px solid #f0f0f0;
            min-height: 35px;
            display: flex;
            align-items: center;
            justify-content: flex-end;
          }

          .tabla-reporte td:last-child {
            border-bottom: none;
          }

          .tabla-reporte td::before {
            content: attr(data-label);
            position: absolute;
            left: 10px;
            width: 45%;
            font-weight: bold;
            text-align: left;
            font-size: 12px;
            color: #7f8c8d;
          }
        }

        /* --- ESTILOS DE IMPRESIÓN (PDF) --- */
        @media print {
          html, body, #root, .bitacora-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }

          .no-print {
            display: none !important;
          }

          table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 9pt !important;
          }

          th, td {
            border: 1px solid #000 !important;
            padding: 6px !important;
            display: table-cell !important; /* Asegura formato tabla en PDF */
            text-align: left !important;
          }

          thead { display: table-header-group !important; background-color: #2c3e50 !important; }
          th { color: white !important; -webkit-print-color-adjust: exact; }

          @page {
            size: letter landscape;
            margin: 1cm;
          }
        }
      `}</style>

      <div className="header-bitacora no-print">
        <h2 style={{ margin: 0, color: '#2c3e50' }}>📋 Bitácora de Actividades</h2>
        <div className="controles-bitacora">
          <input 
            type="date" 
            value={filtroFecha} 
            onChange={(e) => setFiltroFecha(e.target.value)} 
            style={inputStyle}
          />
          <button onClick={() => setFiltroFecha('')} style={btnSecondary}>Limpiar</button>
          <button onClick={imprimirReporte} style={btnPrimary}>Generar PDF</button>
        </div>
      </div>

      <table className="tabla-reporte" style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
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
              <td style={tdStyle} data-label="ID">{l.id}</td>
              <td style={tdStyle} data-label="Usuario"><strong>{l.usuario}</strong></td>
              <td style={tdStyle} data-label="Acción">{l.accion}</td>
              <td style={tdStyle} data-label="Entidad">{l.entidad}</td>
              <td style={{...tdStyle, maxWidth: '300px'}} data-label="Detalle">{l.detalle}</td>
              <td style={tdStyle} data-label="Fecha/Hora">{new Date(l.fecha).toLocaleString()}</td>
            </tr>
          )) : (
            <tr>
              <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '40px' }}>
                No hay registros para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = { padding: '12px', textAlign: 'left', fontSize: '14px' };
const tdStyle = { padding: '12px', fontSize: '13px', color: '#333' };
const inputStyle = { padding: '8px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none' };
const btnPrimary = { padding: '10px 15px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };
const btnSecondary = { padding: '10px 15px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' };

export default Bitacora;
