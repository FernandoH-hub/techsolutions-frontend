import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Estadisticas = ({ dataProyectos = [], dataTareas = [], dataClientes = [], dataIntegrantes = [] }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // --- 1. PROCESAMIENTO DE DATOS ---
  
  const datosProyectosPie = useMemo(() => {
    const conteo = { 'Planificación': 0, 'En Progreso': 0, 'Finalizado': 0 };
    dataProyectos.forEach(p => {
      const st = p.status || p.estado || 'Planificación';
      if (conteo[st] !== undefined) conteo[st]++;
    });
    return Object.keys(conteo).map(key => ({ name: key, value: conteo[key] }));
  }, [dataProyectos]);

  const datosCargaTrabajo = useMemo(() => {
    if (!proyectoSeleccionado) return [];
    const integrantesProyecto = dataIntegrantes.filter(i => String(i.project_id) === String(proyectoSeleccionado.id));
    return integrantesProyecto.map(integ => ({
      name: integ.name,
      tareas: dataTareas.filter(t => 
        String(t.project_id) === String(proyectoSeleccionado.id) && 
        (t.responsible || t.responsable)?.trim() === integ.name?.trim()
      ).length
    }));
  }, [proyectoSeleccionado, dataIntegrantes, dataTareas]);

  // --- 2. FILTRADO Y HELPERS ---
  const proyectosFiltrados = dataProyectos.filter(p => {
    const coincideFecha = (!fechaInicio || p.start_date >= fechaInicio) && (!fechaFin || p.end_date <= fechaFin);
    const coincideEstado = filtroEstado === 'Todos' || (p.status || p.estado) === filtroEstado;
    return coincideFecha && coincideEstado;
  });

  const obtenerNombreCliente = (clientId) => {
    if (!clientId) return 'Sin Cliente';
    const cliente = dataClientes.find(c => String(c.id) === String(clientId));
    return cliente ? cliente.name : `ID #${clientId}`;
  };

  const exportarPanel = () => { window.print(); };
  const COLORS = ['#3498db', '#f1c40f', '#2ecc71', '#9b59b6', '#e74c3c'];

  return (
    <div className="stats-container" style={{ padding: '15px', color: '#2c3e50', fontFamily: 'sans-serif' }}>
      <style>{`
        .stats-container { max-width: 1200px; margin: auto; }
        .main-grid { display: grid; grid-template-columns: 1.2fr 1.3fr; gap: 20px; }
        .charts-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .scroll-area { max-height: 350px; overflow-y: auto; padding-right: 10px; }
        .scroll-area::-webkit-scrollbar { width: 6px; }
        .scroll-area::-webkit-scrollbar-thumb { background: #dfe6e9; borderRadius: 10px; }
        
        @media (max-width: 950px) {
          .main-grid { grid-template-columns: 1fr; }
        }
        @media print {
          body * { visibility: hidden; }
          .stats-container, .stats-container * { visibility: visible; }
          .stats-container { position: absolute; left: 0; top: 0; width: 100%; }
          button, select, input { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ margin: 0 }}>📊 Dashboard TechSolutions</h2>
        <button onClick={exportarPanel} style={exportBtnStyle}>🖨️ Exportar Informe</button>
      </div>

      <div className="main-grid">
        {/* LISTADO DE PROYECTOS */}
        <div style={sectionCardStyle}>
          <h3 style={subtitleStyle}>🔍 Explorador de Proyectos</h3>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexWrap: 'wrap' }}>
            <div style={inputGroup}><label style={labelStyle}>Desde</label><input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={inputStyle} /></div>
            <div style={inputGroup}><label style={labelStyle}>Hasta</label><input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={inputStyle} /></div>
            <div style={inputGroup}>
              <label style={labelStyle}>Estado</label>
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
              <thead><tr style={{ textAlign: 'left', background: '#f8f9fa' }}><th style={thStyle}>Nombre</th><th style={thStyle}>Estado</th><th style={thStyle}>Acción</th></tr></thead>
              <tbody>
                {proyectosFiltrados.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={tdStyle}>{p.name}</td>
                    <td style={tdStyle}><span style={statusBadge(p.status || p.estado)}>{p.status || p.estado}</span></td>
                    <td style={tdStyle}><button onClick={() => setProyectoSeleccionado(p)} style={detailBtn}>Ver Análisis</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ANÁLISIS DETALLADO DEL PROYECTO SELECCIONADO */}
        <div style={sectionCardStyle}>
          <h3 style={subtitleStyle}>📋 Desglose Operativo y Carga</h3>
          {proyectoSeleccionado ? (
            <div className="scroll-area">
              {/* Info General del Proyecto */}
              <div style={highlightBox}>
                <h4 style={{margin: '0 0 8px 0', color: '#2980b9'}}>{proyectoSeleccionado.name}</h4>
                <p style={detailText}><strong>Descripción:</strong> {proyectoSeleccionado.description || 'Sin descripción'}</p>
                <p style={detailText}><strong>Cliente:</strong> <span style={{color: '#2c3e50', fontWeight: 'bold'}}>{obtenerNombreCliente(proyectoSeleccionado.client_id)}</span></p>
              </div>

              {/* Gráfica de Carga de Trabajo */}
              <div style={{ marginTop: '20px' }}>
                <h5 style={{marginBottom: '10px', fontSize: '0.85em', color: '#7f8c8d'}}>DISTRIBUCIÓN DE TAREAS:</h5>
                <div style={{ height: '180px', background: '#fcfcfc', borderRadius: '8px', padding: '10px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosCargaTrabajo} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} style={{fontSize: '0.65em'}} />
                      <Tooltip cursor={{fill: '#f0f0f0'}} />
                      <Bar dataKey="tareas" fill="#3498db" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Listado de Equipo y Tareas (Tu código original) */}
              <div style={{marginTop: '20px'}}>
                <h5 style={{marginBottom: '10px', fontSize: '0.85em', color: '#7f8c8d'}}>EQUIPO Y TAREAS ASIGNADAS:</h5>
                {dataIntegrantes
                  .filter(i => String(i.project_id) === String(proyectoSeleccionado.id))
                  .map(integ => {
                    const tareasMiembro = dataTareas.filter(t => 
                      String(t.project_id) === String(proyectoSeleccionado.id) && 
                      (t.responsible || t.responsable)?.trim() === integ.name?.trim()
                    );
                    return (
                      <div key={integ.id} style={teamGroup}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                          <span style={{fontWeight: 'bold', fontSize: '0.85em'}}>👤 {integ.name} <small style={{color: '#95a5a6'}}>({integ.role})</small></span>
                          <span style={{fontSize: '0.7em', color: '#7f8c8d'}}>{tareasMiembro.length} tareas</span>
                        </div>
                        {tareasMiembro.map(t => (
                          <div key={t.id} style={taskSubItem}>
                            <span>• {t.title || t.nombre}</span> 
                            <span>{['Completada', 'Finalizada', 'Terminada'].includes(t.status || t.estado) ? '✅' : '⏳'}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div style={{textAlign: 'center', marginTop: '100px', color: '#bdc3c7'}}>
              <p>Selecciona un proyecto para ver la descripción, equipo y carga de trabajo</p>
            </div>
          )}
        </div>
      </div>

      {/* GRÁFICAS GLOBALES */}
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
          <h4 style={chartTitle}>Resumen Global de Tareas</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { name: 'Pendientes', total: dataTareas.filter(t => t.status === 'Pendiente').length },
              { name: 'En Progreso', total: dataTareas.filter(t => t.status === 'En Progreso' || t.status === 'En Curso').length },
              { name: 'Finalizadas', total: dataTareas.filter(t => ['Completada', 'Finalizada', 'Terminada'].includes(t.status)).length }
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

// --- ESTILOS ---
const sectionCardStyle = { background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minHeight: '450px', display: 'flex', flexDirection: 'column' };
const subtitleStyle = { fontSize: '0.95em', marginBottom: '15px', color: '#34495e', borderBottom: '2px solid #f1f1f1', paddingBottom: '8px', fontWeight: 'bold' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '2px', flex: '1 1 100px' };
const labelStyle = { fontSize: '0.65em', fontWeight: 'bold', color: '#95a5a6', textTransform: 'uppercase' };
const inputStyle = { padding: '6px', borderRadius: '4px', border: '1px solid #dcdde1', fontSize: '0.8em' };
const tableContainer = { overflowY: 'auto', flexGrow: 1 };
const thStyle = { padding: '10px', fontSize: '0.75em', color: '#7f8c8d' };
const tdStyle = { padding: '10px', fontSize: '0.8em' };
const detailBtn = { padding: '4px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75em' };
const highlightBox = { background: '#f8fbfe', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3498db' };
const detailText = { fontSize: '0.8em', margin: '4px 0', color: '#576574', lineHeight: '1.4' };
const teamGroup = { marginBottom: '8px', padding: '10px', background: '#fcfcfc', borderRadius: '6px', border: '1px solid #f1f1f1' };
const taskSubItem = { fontSize: '0.75em', padding: '4px 0 0 12px', color: '#7f8c8d', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #eee', marginTop: '4px' };
const chartCardStyle = { background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const chartTitle = { fontSize: '0.85em', marginBottom: '10px', textAlign: 'center', color: '#7f8c8d' };
const exportBtnStyle = { padding: '8px 15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85em', fontWeight: 'bold' };
const statusBadge = (s) => ({
  padding: '2px 8px', borderRadius: '10px', fontSize: '0.7em', fontWeight: 'bold',
  background: (s === 'En Progreso' || s === 'En Curso') ? '#e8f4fd' : (s === 'Finalizado' || s === 'Completado') ? '#eafaf1' : '#fef9e7',
  color: (s === 'En Progreso' || s === 'En Curso') ? '#3498db' : (s === 'Finalizado' || s === 'Completado') ? '#2ecc71' : '#f1c40f'
});

export default Estadisticas;
