import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Estadisticas = ({ dataProyectos = [], dataTareas = [], dataClientes = [], dataIntegrantes = [] }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // --- 1. PROCESAMIENTO DE DATOS ---
  
  // Gráfica Global de Proyectos
  const datosProyectosPie = useMemo(() => {
    const conteo = { 'Planificación': 0, 'En Progreso': 0, 'Finalizado': 0 };
    dataProyectos.forEach(p => {
      const st = p.status || p.estado || 'Planificación';
      if (conteo[st] !== undefined) conteo[st]++;
    });
    return Object.keys(conteo).map(key => ({ name: key, value: conteo[key] }));
  }, [dataProyectos]);

  // Gráfica de Carga de Trabajo (Solo para el proyecto seleccionado)
  const datosCargaTrabajo = useMemo(() => {
    if (!proyectoSeleccionado) return [];
    
    const integrantesProyecto = dataIntegrantes.filter(
      i => String(i.project_id) === String(proyectoSeleccionado.id)
    );

    return integrantesProyecto.map(integ => {
      const numTareas = dataTareas.filter(t => 
        String(t.project_id) === String(proyectoSeleccionado.id) && 
        (t.responsible || t.responsable)?.trim() === integ.name?.trim()
      ).length;

      return {
        name: integ.name,
        tareas: numTareas
      };
    });
  }, [proyectoSeleccionado, dataIntegrantes, dataTareas]);

  // --- 2. FILTRADO ---
  const proyectosFiltrados = dataProyectos.filter(p => {
    const coincideFecha = (!fechaInicio || p.start_date >= fechaInicio) && (!fechaFin || p.end_date <= fechaFin);
    const estadoProyecto = p.status || p.estado;
    const coincideEstado = filtroEstado === 'Todos' || estadoProyecto === filtroEstado;
    return coincideFecha && coincideEstado;
  });

  const exportarPanel = () => { window.print(); };

  const COLORS = ['#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e74c3c'];

  return (
    <div className="stats-container" style={{ padding: '15px', color: '#2c3e50', fontFamily: 'sans-serif' }}>
      <style>{`
        .stats-container { max-width: 1200px; margin: auto; }
        .main-grid { display: grid; grid-template-columns: 1.4fr 1.1fr; gap: 20px; }
        .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        
        @media (max-width: 850px) {
          .main-grid { grid-template-columns: 1fr; }
          .filter-controls { flex-direction: column; }
        }

        @media print {
          body * { visibility: hidden; }
          .stats-container, .stats-container * { visibility: visible; }
          .stats-container { position: absolute; left: 0; top: 0; width: 100%; }
          button, select, input { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>📊 Dashboard TechSolutions</h2>
        <button onClick={exportarPanel} style={exportBtnStyle}>🖨️ Exportar Informe</button>
      </div>

      <div className="main-grid">
        {/* LISTADO DE PROYECTOS */}
        <div style={sectionCardStyle}>
          <h3 style={subtitleStyle}>🔍 Proyectos</h3>
          <div className="filter-controls" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <div style={inputGroup}><label style={labelStyle}>Desde:</label><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={inputStyle} /></div>
            <div style={inputGroup}><label style={labelStyle}>Hasta:</label><input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={inputStyle} /></div>
            <div style={inputGroup}>
              <label style={labelStyle}>Estado:</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={inputStyle}>
                <option value="Todos">Todos</option>
                <option value="Planificación">Planificación</option>
                <option value="En Progreso">En Progreso</option>
                <option value="Finalizado">Finalizado</option>
              </select>
            </div>
          </div>

          <div style={tableContainer}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f1f1' }}><th style={thStyle}>Proyecto</th><th style={thStyle}>Estado</th><th style={thStyle}>Acción</th></tr></thead>
              <tbody>
                {proyectosFiltrados.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}><span style={statusBadge(p.status || p.estado)}>{p.status || p.estado}</span></td>
                    <td style={tdStyle}><button onClick={() => setProyectoSeleccionado(p)} style={detailBtn}>Analizar</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DETALLE Y CARGA DE TRABAJO */}
        <div style={sectionCardStyle}>
          <h3 style={subtitleStyle}>📋 Carga de Trabajo por Proyecto</h3>
          {proyectoSeleccionado ? (
            <div>
              <div style={highlightBox}>
                <h4 style={{margin: '0', color: '#2980b9'}}>{proyectoSeleccionado.name}</h4>
                <p style={{fontSize: '0.8em', margin: '5px 0'}}>Distribución de tareas entre integrantes activos:</p>
              </div>

              <div style={{ height: '250px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosCargaTrabajo} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} style={{fontSize: '0.7em', fontWeight: 'bold'}} />
                    <Tooltip cursor={{fill: '#f0f0f0'}} />
                    <Bar dataKey="tareas" fill="#3498db" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{maxHeight: '120px', overflowY: 'auto', marginTop: '10px', fontSize: '0.8em'}}>
                 {datosCargaTrabajo.map((integ, idx) => (
                   <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f9f9f9'}}>
                     <span>{integ.name}</span>
                     <strong>{integ.tareas} tareas</strong>
                   </div>
                 ))}
              </div>
            </div>
          ) : (
            <div style={{textAlign: 'center', color: '#bdc3c7', paddingTop: '80px'}}>
              <p>Selecciona un proyecto de la lista para ver la carga de trabajo del equipo.</p>
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICAS GLOBALES ABAJO */}
      <div className="charts-row">
        <div style={chartCardStyle}>
          <h4 style={chartTitle}>Estado Global de Proyectos</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={datosProyectosPie} innerRadius={60} outerRadius={80} dataKey="value" paddingAngle={5}>
                {datosProyectosPie.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={chartCardStyle}>
          <h4 style={chartTitle}>Resumen de Tareas (Global)</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Pendientes', total: dataTareas.filter(t => t.status === 'Pendiente').length },
              { name: 'En Progreso', total: dataTareas.filter(t => t.status === 'En Progreso' || t.status === 'En Curso').length },
              { name: 'Completadas', total: dataTareas.filter(t => ['Completada', 'Finalizada', 'Terminada'].includes(t.status)).length }
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" style={{fontSize: '0.7em'}} />
              <YAxis style={{fontSize: '0.7em'}} />
              <Tooltip />
              <Bar dataKey="total" fill="#2ecc71" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS MEJORADOS ---
const sectionCardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)', minHeight: '420px', display: 'flex', flexDirection: 'column' };
const subtitleStyle = { fontSize: '1em', marginBottom: '15px', color: '#34495e', borderLeft: '4px solid #3498db', paddingLeft: '10px' };
const inputGroup = { display: 'flex', flexDirection: 'column', flex: 1 };
const labelStyle = { fontSize: '0.7em', fontWeight: 'bold', color: '#95a5a6', marginBottom: '3px' };
const inputStyle = { padding: '8px', borderRadius: '6px', border: '1px solid #dcdde1', fontSize: '0.85em', width: '100%' };
const tableContainer = { overflowY: 'auto', flexGrow: 1 };
const thStyle = { padding: '12px 8px', fontSize: '0.75em', color: '#7f8c8d', background: '#fcfcfc' };
const tdStyle = { padding: '12px 8px', fontSize: '0.85em' };
const detailBtn = { padding: '6px 12px', background: '#3498db', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75em', transition: '0.3s' };
const highlightBox = { background: '#f0f7ff', padding: '12px', borderRadius: '8px', border: '1px solid #e1effe' };
const chartCardStyle = { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.06)' };
const chartTitle = { fontSize: '0.9em', marginBottom: '15px', textAlign: 'center', color: '#7f8c8d', fontWeight: '500' };
const exportBtnStyle = { padding: '10px 18px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const statusBadge = (s) => ({
  padding: '3px 8px', borderRadius: '6px', fontSize: '0.7em', fontWeight: 'bold',
  background: (s === 'En Progreso' || s === 'En Curso') ? '#e8f4fd' : (s === 'Finalizado' || s === 'Completado') ? '#eafaf1' : '#fef9e7',
  color: (s === 'En Progreso' || s === 'En Curso') ? '#3498db' : (s === 'Finalizado' || s === 'Completado') ? '#2ecc71' : '#f1c40f'
});

export default Estadisticas;
