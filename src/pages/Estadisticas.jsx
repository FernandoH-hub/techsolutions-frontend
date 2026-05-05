import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Estadisticas = ({ dataProyectos = [], dataTareas = [], dataClientes = [], dataIntegrantes = [] }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState(null);

  // --- 1. VALIDACIÓN DE FECHAS ---
  const manejarFechaInicio = (val) => {
    if (fechaFin && val > fechaFin) {
      alert("La fecha de inicio no puede ser posterior a la fecha fin.");
      setFechaInicio('');
    } else setFechaInicio(val);
  };

  const manejarFechaFin = (val) => {
    if (fechaInicio && val < fechaInicio) {
      alert("La fecha fin no puede ser anterior a la fecha de inicio.");
      setFechaFin('');
    } else setFechaFin(val);
  };

  // --- 2. PROCESAMIENTO DE DATOS ---
  const procesarTareasGlobal = () => {
    const conteo = { 'Pendiente': 0, 'En Progreso': 0, 'Completada': 0 };
    dataTareas.forEach(t => {
      const st = t.status || t.estado; 
      if (conteo[st] !== undefined) conteo[st]++;
      else if (['Finalizada', 'Completado', 'Terminada'].includes(st)) conteo['Completada']++;
      else if (['En Curso', 'Desarrollo'].includes(st)) conteo['En Progreso']++;
    });
    return Object.keys(conteo).map(key => ({ name: key, total: conteo[key] }));
  };

  const procesarProyectos = () => {
    const conteo = { 'Planificación': 0, 'En Progreso': 0, 'Finalizado': 0 };
    dataProyectos.forEach(p => {
      const st = p.status || p.estado || '';
      if (conteo[st] !== undefined) conteo[st]++;
    });
    return Object.keys(conteo).map(key => ({ name: key, total: conteo[key] }));
  };

  // --- 3. FILTRADO Y HELPERS ---
  const proyectosFiltrados = dataProyectos.filter(p => {
    const coincideFecha = (!fechaInicio || p.start_date >= fechaInicio) && (!fechaFin || p.end_date <= fechaFin);
    const estadoProyecto = p.status || p.estado;
    const coincideEstado = filtroEstado === 'Todos' || estadoProyecto === filtroEstado;
    return coincideFecha && coincideEstado;
  });

  const obtenerNombreCliente = (clientId) => {
    if (!clientId) return 'Sin Cliente';
    const cliente = dataClientes.find(c => String(c.id) === String(clientId));
    return cliente ? cliente.name : `ID #${clientId} (No encontrado)`;
  };

  const exportarPanel = () => { window.print(); };

  const COLORS = ['#3498db', '#f1c40f', '#2ecc71', '#9b59b6'];

  return (
    <div className="printable-dashboard" style={{ padding: '10px', color: '#2c3e50' }}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-dashboard, .printable-dashboard * { visibility: visible; }
          .printable-dashboard { position: absolute; left: 0; top: 0; width: 100%; }
          button, select, input { display: none !important; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h2 style={{ margin: 0 }}>📊 Dashboard TechSolutions</h2>
        <button onClick={exportarPanel} style={exportBtnStyle}>🖨️ Exportar Informe</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr', gap: '20px' }}>
        
        {/* TABLA DE PROYECTOS */}
        <div style={sectionCardStyle}>
          <h3 style={subtitleStyle}>🔍 Proyectos en Periodo</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <div style={inputGroup}><label style={labelStyle}>Desde:</label><input type="date" value={fechaInicio} onChange={(e) => manejarFechaInicio(e.target.value)} style={inputStyle} /></div>
            <div style={inputGroup}><label style={labelStyle}>Hasta:</label><input type="date" value={fechaFin} onChange={(e) => manejarFechaFin(e.target.value)} style={inputStyle} /></div>
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

        {/* DESGLOSE DETALLADO */}
        <div style={sectionCardStyle}>
          <h3 style={subtitleStyle}>📋 Desglose Operativo</h3>
          {proyectoSeleccionado ? (
            <div>
              <div style={highlightBox}>
                <h4 style={{margin: '0 0 8px 0', color: '#2980b9'}}>{proyectoSeleccionado.name}</h4>
                <p style={detailText}><strong>Descripción:</strong> {proyectoSeleccionado.description || 'Sin descripción'}</p>
                <p style={detailText}><strong>Cliente:</strong> <span style={{color: '#2c3e50', fontWeight: 'bold'}}>{obtenerNombreCliente(proyectoSeleccionado.client_id)}</span></p>
              </div>

              <div style={{marginTop: '15px'}}>
                <h5 style={{marginBottom: '10px', fontSize: '0.9em', color: '#34495e'}}>Asignación de Tareas por Integrante:</h5>
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {dataIntegrantes
                    .filter(i => String(i.project_id) === String(proyectoSeleccionado.id))
                    .map(integ => {
                      // Filtramos las tareas donde el responsable coincida con el nombre del integrante
                      const tareasMiembro = dataTareas.filter(t => 
                        String(t.project_id) === String(proyectoSeleccionado.id) && 
                        (t.responsible || t.responsable)?.trim() === integ.name?.trim()
                      );

                      return (
                        <div key={integ.id} style={teamGroup}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span style={{fontWeight: 'bold', fontSize: '0.85em'}}>👤 {integ.name} <small style={{color: '#95a5a6'}}>({integ.role})</small></span>
                            {tareasMiembro.length === 0 ? (
                               <span style={availableBadge}>Sin tareas</span>
                            ) : (
                               <span style={{fontSize: '0.7em', color: '#7f8c8d'}}>{tareasMiembro.length} tarea(s)</span>
                            )}
                          </div>
                          
                          {/* Listado de tareas específicas del integrante */}
                          {tareasMiembro.map(t => (
                            <div key={t.id} style={taskSubItem}>
                              <span>• {t.title || t.nombre}</span> 
                              <span>{['Completada', 'Finalizada', 'Terminada'].includes(t.status || t.estado) ? '✅' : '⏳'}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}

                  {/* Mensaje si no hay integrantes en el proyecto */}
                  {dataIntegrantes.filter(i => String(i.project_id) === String(proyectoSeleccionado.id)).length === 0 && (
                    <p style={{fontSize: '0.8em', color: '#bdc3c7', textAlign: 'center', marginTop: '20px'}}>No hay integrantes registrados en este proyecto.</p>
                  )}
                </div>
              </div>
            </div>
          ) : <p style={{textAlign: 'center', marginTop: '100px', color: '#bdc3c7'}}>Selecciona un proyecto para ver el equipo y sus tareas</p>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <div style={chartCardStyle}>
          <h4 style={chartTitle}>Estado de Proyectos</h4>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={procesarProyectos()} innerRadius={50} outerRadius={70} dataKey="total" paddingAngle={5}>
                {procesarProyectos().map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={chartCardStyle}>
          <h4 style={chartTitle}>Tareas por Estado (Global)</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={procesarTareasGlobal()}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" style={{fontSize: '0.7em'}} />
              <YAxis style={{fontSize: '0.7em'}} />
              <Tooltip />
              <Bar dataKey="total" fill="#3498db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS ---
const sectionCardStyle = { background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minHeight: '400px' };
const subtitleStyle = { fontSize: '0.95em', marginBottom: '15px', color: '#34495e', borderBottom: '2px solid #f1f1f1', paddingBottom: '8px' };
const inputGroup = { display: 'flex', flexDirection: 'column', gap: '2px' };
const labelStyle = { fontSize: '0.7em', fontWeight: 'bold', color: '#95a5a6' };
const inputStyle = { padding: '5px', borderRadius: '4px', border: '1px solid #dcdde1', fontSize: '0.85em' };
const tableContainer = { maxHeight: '250px', overflowY: 'auto' };
const thStyle = { padding: '10px', fontSize: '0.75em', color: '#7f8c8d' };
const tdStyle = { padding: '10px', fontSize: '0.85em' };
const detailBtn = { padding: '4px 10px', background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' };
const highlightBox = { background: '#f8fbfe', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3498db', marginBottom: '10px' };
const detailText = { fontSize: '0.8em', margin: '4px 0', color: '#576574' };
const teamGroup = { marginBottom: '8px', padding: '10px', background: '#fcfcfc', borderRadius: '6px', border: '1px solid #f1f1f1' };
const taskSubItem = { fontSize: '0.75em', padding: '4px 0 0 12px', color: '#7f8c8d', display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #eee', marginTop: '4px' };
const availableBadge = { background: '#fef9e7', color: '#f1c40f', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7em', fontWeight: 'bold' };
const chartCardStyle = { background: 'white', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' };
const chartTitle = { fontSize: '0.85em', marginBottom: '10px', textAlign: 'center', color: '#7f8c8d' };
const exportBtnStyle = { padding: '8px 15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85em' };
const statusBadge = (s) => ({
  padding: '2px 8px', borderRadius: '10px', fontSize: '0.7em', fontWeight: 'bold',
  background: (s === 'En Progreso' || s === 'En Curso') ? '#e8f4fd' : (s === 'Finalizado' || s === 'Completado' || s === 'Terminada') ? '#eafaf1' : '#fef9e7',
  color: (s === 'En Progreso' || s === 'En Curso') ? '#3498db' : (s === 'Finalizado' || s === 'Completado' || s === 'Terminada') ? '#2ecc71' : '#f1c40f'
});

export default Estadisticas;