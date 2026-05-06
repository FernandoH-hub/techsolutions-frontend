import { useEffect, useState } from 'react';
import api from '../api';
import { registrarLog } from '../logger'; //

function Proyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('Planificación');

  // --- LÓGICA DE EQUIPO ---
  const [equipoTemporal, setEquipoTemporal] = useState([]);
  const [miembroNombre, setMiembroNombre] = useState('');
  const [miembroCargo, setMiembroCargo] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const getHoyStr = () => new Date().toISOString().split('T')[0];

  const handleStartDateChange = (val) => {
    if (endDate && val && new Date(val) > new Date(endDate)) {
      alert("La fecha de inicio no puede ser posterior a la de finalización.");
      setStartDate('');
      return;
    }
    setStartDate(val);
  };

  const handleEndDateChange = (val) => {
    if (startDate && val && new Date(val) < new Date(startDate)) {
      alert("La fecha de finalización no puede ser anterior a la de inicio.");
      setEndDate('');
      return;
    }
    setEndDate(val);
  };

  useEffect(() => {
    if (startDate && endDate && !editingId) {
      const hoy = new Date().setHours(0, 0, 0, 0);
      const inicio = new Date(startDate + "T00:00:00").getTime();
      const fin = new Date(endDate + "T00:00:00").getTime();

      if (status !== 'En Pausa' && status !== 'Retrasado') {
        if (hoy < inicio) setStatus('Planificación');
        else if (hoy >= inicio && hoy <= fin) setStatus('En Progreso');
        else if (hoy > fin) setStatus('Finalizado');
      }
    }
  }, [startDate, endDate, status, editingId]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resProy, resClie] = await Promise.all([
        api.get('/projects'),
        api.get('/clients')
      ]);
      setProyectos(resProy.data || []);
      setClientes(resClie.data || []);
    } catch (err) {
      console.error("Error al cargar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleAccionRapida = async (proyecto) => {
    let updates = { ...proyecto };
    const hoy = getHoyStr();
    const estadoAnterior = proyecto.status;

    if (proyecto.status === 'Planificación') {
      const d1 = new Date(proyecto.start_date);
      const d2 = new Date(proyecto.end_date);
      const duracionMs = d2 - d1;
      updates.status = 'En Progreso';
      updates.start_date = hoy;
      updates.end_date = new Date(new Date().getTime() + duracionMs).toISOString().split('T')[0];
    } 
    else if (proyecto.status === 'En Progreso') {
      const resp = window.confirm("¿Deseas PAUSAR el proyecto? (Aceptar = Pausar / Cancelar = Finalizar)");
      if (resp) {
        const motivo = prompt("Motivo de la pausa:");
        if (!motivo) return;
        updates.status = 'En Pausa';
        updates.pause_reason = motivo;
        updates.pauses_count = (proyecto.pauses_count || 0) + 1;
      } else {
        updates.status = 'Finalizado';
        updates.end_date = hoy;
      }
    } 
    else if (proyecto.status === 'En Pausa') {
      updates.status = 'En Progreso';
    } 
    else if (proyecto.status === 'Finalizado') {
      updates.status = 'Retrasado';
      const nuevaFecha = new Date();
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
      updates.end_date = nuevaFecha.toISOString().split('T')[0];
    }
    else if (proyecto.status === 'Retrasado') {
      updates.status = 'Finalizado';
      updates.end_date = hoy;
    }

    try {
      await api.put(`/projects/${proyecto.id}`, updates);
      
      // REGISTRO EN BITÁCORA (Acción rápida)
      await registrarLog('ACTUALIZAR', 'PROYECTOS', `Cambio rápido de estado en "${proyecto.name}": de ${estadoAnterior} a ${updates.status}`); //
      
      cargarDatos();
    } catch (err) {
      alert("Error al actualizar la línea de tiempo.");
    }
  };

  const agregarMiembro = () => {
    if (!miembroNombre || !miembroCargo) return;
    setEquipoTemporal([...equipoTemporal, { name: miembroNombre, role: miembroCargo }]);
    setMiembroNombre('');
    setMiembroCargo('');
  };

  const eliminarMiembro = (index) => {
    setEquipoTemporal(equipoTemporal.filter((_, i) => i !== index));
  };

  const guardarProyecto = async (e) => {
    e.preventDefault();
    if (!clientId || !name || !startDate || !endDate) return alert("Faltan campos obligatorios.");

    const payload = {
      client_id: parseInt(clientId),
      name,
      description: description || '',
      start_date: startDate,
      end_date: endDate,
      status
    };

    try {
      let proyectoId = editingId;

      if (editingId) {
        await api.put(`/projects/${editingId}`, payload);
        // REGISTRO EN BITÁCORA (Edición)
        await registrarLog('ACTUALIZAR', 'PROYECTOS', `Se actualizaron los datos generales del proyecto: ${name}`); //
      } else {
        const res = await api.post('/projects', payload);
        proyectoId = res.data.id;
        // REGISTRO EN BITÁCORA (Creación)
        await registrarLog('INSERTAR', 'PROYECTOS', `Se creó el nuevo proyecto: ${name}`); //
      }

      if (equipoTemporal.length > 0) {
        await Promise.all(equipoTemporal.map(m => 
          api.post('/project_team', { 
            project_id: proyectoId, 
            name: m.name, 
            role: m.role 
          })
        ));
      }

      cancelarEdicion();
      cargarDatos();
      alert("Operación exitosa.");
    } catch (err) {
      console.error(err);
      alert("Error al guardar.");
    }
  };

  const cancelarEdicion = () => {
    setEditingId(null);
    setClientId('');
    setName('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setStatus('Planificación');
    setEquipoTemporal([]);
  };

  const calcularDias = (inicio, fin) => {
    if (!inicio || !fin) return "N/A";
    const d = Math.ceil((new Date(fin) - new Date(inicio)) / 86400000);
    return d < 0 ? "Error" : `${d} días`;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <h2 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.5em' }}></span> Panel de Control de Proyectos
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.7fr', gap: '25px' }}>
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <section style={cardStyle}>
          <h3 style={{ margin: '0 0 20px 0' }}>{editingId ? 'Editando' : 'Nuevo Proyecto'}</h3>
          <form onSubmit={guardarProyecto} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={labelStyle}>Cliente</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={inputStyle}>
              <option value="">Seleccionar Cliente...</option>
              {clientes.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
            </select>
            
            <input type="text" placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
            
            <textarea placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: '60px', resize: 'none' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} style={inputStyle} />
              <input type="date" value={endDate} onChange={(e) => handleEndDateChange(e.target.value)} style={inputStyle} />
            </div>

            {/* APARTADO INTEGRANTES */}
            <div style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
              <label style={labelStyle}>Integrantes del Equipo</label>
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <input type="text" placeholder="Nombre" value={miembroNombre} onChange={(e) => setMiembroNombre(e.target.value)} style={inputStyle} />
                <input type="text" placeholder="Cargo" value={miembroCargo} onChange={(e) => setMiembroCargo(e.target.value)} style={inputStyle} />
                <button type="button" onClick={agregarMiembro} style={{ ...btnStyle, padding: '5px 15px' }}>+</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {equipoTemporal.map((m, i) => (
                  <span key={i} style={{ background: '#e1f5fe', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8em' }}>
                    {m.name} ({m.role}) <b onClick={() => eliminarMiembro(i)} style={{ cursor: 'pointer', color: 'red' }}>×</b>
                  </span>
                ))}
              </div>
            </div>

            <div style={statusInferred}>Estado: <strong>{status}</strong></div>
            <button type="submit" style={btnStyle}>{editingId ? 'Actualizar Información' : 'Registrar Proyecto'}</button>
            {editingId && <button type="button" onClick={cancelarEdicion} style={{ ...btnStyle, background: '#95a5a6', marginTop: '-5px' }}>Cancelar</button>}
          </form>
        </section>

        {/* LADO DERECHO: TABLA */}
        <section style={cardStyle}>
          <input type="text" placeholder="🔍 Filtrar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, marginBottom: '20px' }} />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', fontSize: '0.75em', color: '#7f8c8d', borderBottom: '2px solid #edf2f7' }}>
                  <th style={paddingStyle}>DETALLES</th>
                  <th style={paddingStyle}>TIEMPO</th>
                  <th style={paddingStyle}>ESTADO</th>
                  <th style={paddingStyle}>GESTIÓN</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <tr key={p.id} style={trStyle}>
                    <td style={paddingStyle}>
                      <strong style={{ color: '#2c3e50' }}>{p.name}</strong><br/>
                      <small style={{color: '#94a3b8'}}>Pausas: {p.pauses_count || 0}</small>
                    </td>
                    <td style={{ ...paddingStyle, fontSize: '0.85em' }}>{calcularDias(p.start_date, p.end_date)}</td>
                    <td style={paddingStyle}><span style={statusBadge(p.status)}>{p.status}</span></td>
                    <td style={{ ...paddingStyle, display: 'flex', gap: '8px' }}>
                      <button
                        onClick={async () => {
                          setEditingId(p.id); 
                          setClientId(p.client_id); 
                          setName(p.name);
                          setDescription(p.description || ''); 
                          setStartDate(p.start_date);
                          setEndDate(p.end_date); 
                          setStatus(p.status);
                          setEquipoTemporal([]);

                          try {
                            const res = await api.get(`/project_team?project_id=${p.id}&t=${Date.now()}`);
                            setEquipoTemporal(res.data || []);
                          } catch (err) {
                            console.error("Error al cargar equipo:", err);
                          }
                        }} 
                        style={editBtn}
                      >
                        ✏️
                      </button>
                      
                      <button onClick={() => handleAccionRapida(p)} style={actionBtn(p.status)}>
                        {p.status === 'Planificación' ? '🚀 Iniciar' : 
                         p.status === 'En Progreso' ? '⚡ Acción' : 
                         p.status === 'En Pausa' ? '▶️ Seguir' : 
                         p.status === 'Finalizado' ? '⚠️ Retraso' : '✅ Cerrar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

// --- ESTILOS ---
const cardStyle = { background: '#fff', padding: '25px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid #f0f0f0' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #dcdde1', fontSize: '0.9em', outline: 'none' };
const labelStyle = { fontSize: '0.7em', fontWeight: 'bold', color: '#95a5a6', textTransform: 'uppercase', marginBottom: '4px', display: 'block' };
const btnStyle = { background: '#3498db', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const paddingStyle = { padding: '15px 10px' };
const trStyle = { borderBottom: '1px solid #f1f2f6' };
const editBtn = { background: '#f1c40f', border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', color: '#fff' };
const statusInferred = { background: '#f8f9fa', padding: '12px', borderRadius: '8px', fontSize: '0.9em', borderLeft: '4px solid #3498db', marginBottom: '10px' };

const actionBtn = (s) => ({
  border: 'none', borderRadius: '6px', padding: '8px 12px', cursor: 'pointer', fontSize: '0.75em', color: 'white', fontWeight: 'bold',
  background: s === 'Planificación' ? '#2ecc71' : s === 'En Progreso' ? '#e67e22' : s === 'En Pausa' ? '#3498db' : '#34495e'
});

const statusBadge = (s) => ({
  padding: '6px 12px', borderRadius: '20px', fontSize: '0.7em', fontWeight: 'bold', display: 'inline-block',
  background: s === 'Finalizado' ? '#def7ec' : s === 'En Pausa' ? '#fee2e2' : '#fef3c7',
  color: s === 'Finalizado' ? '#03543f' : s === 'En Pausa' ? '#991b1b' : '#92400e'
});

export default Proyectos;
