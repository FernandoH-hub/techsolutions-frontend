import { useEffect, useState } from 'react';
import api from '../api';
import { registrarLog } from '../logger'; // <-- Importación añadida

function Tareas() {
  const [tareas, setTareas] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [equipo, setEquipo] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [proyectoId, setProyectoId] = useState('');
  const [nombreTarea, setNombreTarea] = useState('');
  const [responsable, setResponsable] = useState('');
  const [prioridad, setPrioridad] = useState('Media');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const getHoyStr = () => new Date().toISOString().split('T')[0];

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resT, resP, resE, resC] = await Promise.all([
        api.get('/tasks'),
        api.get('/projects'),
        api.get('/project_team'),
        api.get('/clients')
      ]);
      setTareas(resT.data || []);
      setProyectos(resP.data || []);
      setEquipo(resE.data || []);
      setClientes(resC.data || []);
    } catch (err) {
      console.error("Error al cargar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  // Lógica de Acciones Rápidas con Confirmación
  const handleAccionRapida = async (tarea) => {
    // 1. Alerta de confirmación global
    const confirmar = window.confirm(`¿Estás seguro de querer cambiar el estado de la tarea: "${tarea.title}"?`);
    if (!confirmar) return;

    let updates = { ...tarea };
    const hoy = getHoyStr();
    const estadoAnterior = tarea.status; // Para el log

    if (tarea.status === 'Pendiente') {
      const d1 = new Date(tarea.start_date);
      const d2 = new Date(tarea.end_date);
      const duracionMs = d2 - d1;
      updates.status = 'En Progreso';
      updates.start_date = hoy;
      updates.end_date = new Date(new Date().getTime() + duracionMs).toISOString().split('T')[0];
    } 
    else if (tarea.status === 'En Progreso') {
      const resp = window.confirm("¿Deseas PAUSAR la tarea? (Aceptar = Pausar / Cancelar = Finalizar)");
      if (resp) {
        const motivo = prompt("Motivo de la pausa:");
        if (!motivo) return;
        updates.status = 'En Pausa';
        updates.pause_reason = motivo;
        updates.pauses_count = (tarea.pauses_count || 0) + 1;
      } else {
        updates.status = 'Finalizada';
        updates.end_date = hoy;
      }
    } 
    else if (tarea.status === 'En Pausa') {
      updates.status = 'En Progreso';
    } 
    else if (tarea.status === 'Finalizada') {
      updates.status = 'Retrasada';
      const nuevaFecha = new Date();
      nuevaFecha.setDate(nuevaFecha.getDate() + 7);
      updates.end_date = nuevaFecha.toISOString().split('T')[0];
    }
    else if (tarea.status === 'Retrasada') {
      updates.status = 'Finalizada';
      updates.end_date = hoy;
    }

    try {
      await api.put(`/tasks/${tarea.id}`, updates);
      
      // REGISTRO EN BITÁCORA (Acción rápida)
      await registrarLog('ACTUALIZAR', 'TAREAS', `Cambio rápido de estado en tarea "${tarea.title}": de ${estadoAnterior} a ${updates.status}`);
      
      cargarDatos();
    } catch (err) {
      alert("Error al actualizar el estado de la tarea.");
    }
  };

  const calcularDuracion = (inicio, fin) => {
    if (!inicio || !fin || inicio === "0000-00-00") return 0;
    const f1 = new Date(inicio + "T00:00:00");
    const f2 = new Date(fin + "T00:00:00");
    const dias = Math.ceil((f2 - f1) / (1000 * 60 * 60 * 24)) + 1;
    return dias > 0 ? dias : 0;
  };

  const handleFechaChange = (tipo, valor) => {
    if (tipo === 'inicio') {
      setFechaInicio(valor);
      if (fechaFin && new Date(valor) > new Date(fechaFin)) setFechaFin('');
    } else {
      if (fechaInicio && new Date(valor) < new Date(fechaInicio)) {
        alert("La fecha de fin debe ser posterior al inicio.");
        setFechaFin('');
      } else {
        setFechaFin(valor);
      }
    }
  };

  const integrantesDisponibles = () => {
    if (!proyectoId) return [];
    const proy = proyectos.find(p => p.id === parseInt(proyectoId));
    if (!proy) return [];
    const miembros = equipo.filter(m => m.project_id === parseInt(proyectoId)).map(m => m.name);
    const cliente = clientes.find(c => c.id === proy.client_id);
    if (cliente) miembros.push(`${cliente.name} (Cliente)`);
    return [...new Set(miembros)];
  };

  const calcularEstado = (inicio, fin) => {
    const hoy = getHoyStr();
    if (hoy < inicio) return 'Pendiente';
    if (hoy >= inicio && hoy <= fin) return 'En Progreso';
    return 'Finalizada';
  };

  const guardarTarea = async (e) => {
    e.preventDefault();
    const idProy = parseInt(proyectoId);
    if (isNaN(idProy)) return alert("Error: Selecciona un proyecto.");
    if (!nombreTarea || !responsable || !fechaInicio || !fechaFin) return alert("Completa todos los campos.");

    const payload = {
      project_id: idProy,
      title: nombreTarea.trim(),
      responsible: responsable,
      priority: prioridad,
      start_date: fechaInicio,
      end_date: fechaFin,
      status: calcularEstado(fechaInicio, fechaFin)
    };

    try {
      if (editingId) {
        await api.put(`/tasks/${editingId}`, payload);
        // REGISTRO EN BITÁCORA (Edición)
        await registrarLog('ACTUALIZAR', 'TAREAS', `Se actualizaron los detalles de la tarea: ${nombreTarea}`);
      } else {
        await api.post('/tasks', payload);
        // REGISTRO EN BITÁCORA (Creación)
        await registrarLog('INSERTAR', 'TAREAS', `Se creó y asignó una nueva tarea: ${nombreTarea} a ${responsable}`);
      }
      resetForm();
      cargarDatos();
      alert("¡Tarea guardada correctamente!");
    } catch (err) {
      alert("Error al guardar.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setProyectoId('');
    setNombreTarea('');
    setResponsable('');
    setPrioridad('Media');
    setFechaInicio('');
    setFechaFin('');
  };

  const prepararEdicion = (t) => {
    setEditingId(t.id);
    setProyectoId(String(t.project_id || ''));
    setNombreTarea(String(t.title || ''));
    setResponsable(String(t.responsible || ''));
    setPrioridad(String(t.priority || 'Media'));
    setFechaInicio(t.start_date || '');
    setFechaFin(t.end_date || '');
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando sistema de tareas...</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.5em' }}></span> Gestión de Tareas
      </h2>

      {/* Formulario */}
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, color: '#34495e', fontSize: '1.1em' }}>
          {editingId ? 'Editando Tarea' : 'Asignación de Trabajo'}
        </h3>
        <form onSubmit={guardarTarea} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
          <div>
            <label style={labelStyle}>Proyecto</label>
            <select value={proyectoId} onChange={(e) => { setProyectoId(e.target.value); setResponsable(''); }} style={inputStyle}>
              <option value="">Seleccionar Proyecto...</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>¿Qué hay que hacer?</label>
            <input type="text" value={nombreTarea} onChange={(e) => setNombreTarea(e.target.value)} style={inputStyle} placeholder="Nombre de la tarea..." />
          </div>
          <div>
            <label style={labelStyle}>Responsable</label>
            <select value={responsable} onChange={(e) => setResponsable(e.target.value)} style={inputStyle} disabled={!proyectoId}>
              <option value="">Seleccionar...</option>
              {integrantesDisponibles().map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Prioridad</label>
            <select value={prioridad} onChange={(e) => setPrioridad(e.target.value)} style={inputStyle}>
              <option value="Baja">Baja</option>
              <option value="Media">Media 🟡</option>
              <option value="Alta">Alta 🟠</option>
              <option value="Crítica">Crítica 🔴</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Inicio</label>
              <input type="date" value={fechaInicio} onChange={(e) => handleFechaChange('inicio', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fin</label>
              <input type="date" value={fechaFin} onChange={(e) => handleFechaChange('fin', e.target.value)} style={inputStyle} />
            </div>
          </div>
          <button type="submit" style={btnStyle}>
            {editingId ? 'Confirmar Edición' : 'Asignar Tarea al Equipo'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} style={{...btnStyle, background: '#95a5a6', gridColumn: 'span 3', marginTop: '-5px'}}>
              Cancelar Edición
            </button>
          )}
        </form>
      </section>

      {/* Tabla */}
      <div style={{ ...cardStyle, marginTop: '25px', padding: '0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc' }}>
            <tr style={{ textAlign: 'left', fontSize: '0.75em', color: '#64748b', textTransform: 'uppercase' }}>
              <th style={paddingStyle}>Tarea / Proyecto</th>
              <th style={paddingStyle}>Responsable</th>
              <th style={paddingStyle}>Duración</th>
              <th style={paddingStyle}>Estado</th>
              <th style={paddingStyle}>Gestión</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map(t => (
              <tr key={t.id} style={trStyle}>
                <td style={paddingStyle}>
                  <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>{t.title}</div>
                  <small style={{ color: '#3498db' }}>📁 {proyectos.find(p => p.id === t.project_id)?.name || 'Sin Proyecto'}</small>
                </td>
                <td style={paddingStyle}>👤 {t.responsible}</td>
                <td style={paddingStyle}>
                  <div style={{ fontWeight: 'bold' }}>{calcularDuracion(t.start_date, t.end_date)} días</div>
                  <small style={{ color: '#94a3b8' }}>{t.start_date || '--'} al {t.end_date || '--'}</small>
                </td>
                <td style={paddingStyle}><span style={statusStyle(t.status)}>{t.status}</span></td>
                <td style={{...paddingStyle, display: 'flex', gap: '8px'}}>
                    <button onClick={() => prepararEdicion(t)} style={actionBtnStyle('#f1c40f')}>✏️</button>
                    
                    {/* Botón de Acción Dinámico */}
                    <button onClick={() => handleAccionRapida(t)} style={actionBtnStyle(
                        t.status === 'Pendiente' ? '#2ecc71' : 
                        t.status === 'En Progreso' ? '#e67e22' : 
                        t.status === 'En Pausa' ? '#3498db' : 
                        t.status === 'Finalizada' ? '#9b59b6' : '#27ae60'
                    )}>
                        {t.status === 'Pendiente' ? '🚀 Iniciar' : 
                         t.status === 'En Progreso' ? '⚡ Acción' : 
                         t.status === 'En Pausa' ? '▶️ Seguir' : 
                         t.status === 'Finalizada' ? '⚠️ Retraso' : '✅ Cerrar'}
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Estilos
const cardStyle = { background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', border: '1px solid #edf2f7' };
const inputStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9em', outline: 'none', boxSizing: 'border-box' };
const btnStyle = { gridColumn: 'span 3', background: '#27ae60', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };
const labelStyle = { fontSize: '0.7em', color: '#7f8c8d', fontWeight: 'bold', marginBottom: '5px', display: 'block', textTransform: 'uppercase' };
const paddingStyle = { padding: '15px' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const actionBtnStyle = (color) => ({ background: color, color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75em' });
const statusStyle = (s) => {
  const styles = {
    'Finalizada': { bg: '#def7ec', text: '#03543f' },
    'En Progreso': { bg: '#e1effe', text: '#1e429f' },
    'En Pausa': { bg: '#fde8e8', text: '#9b1c1c' },
    'Retrasada': { bg: '#fef3c7', text: '#92400e' },
    'Pendiente': { bg: '#f3f4f6', text: '#374151' }
  };
  const current = styles[s] || styles['Pendiente'];
  return { fontSize: '0.7em', padding: '5px 12px', borderRadius: '20px', fontWeight: 'bold', background: current.bg, color: current.text };
};

export default Tareas;