import { useEffect, useState } from 'react';
import api from '../api'; 
import { registrarLog } from '../logger'; 

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');

  const obtenerClientes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      const datos = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setClientes(datos);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { obtenerClientes(); }, []);

  const total = clientes.length;
  const activos = clientes.filter(c => c.status === 'Activo').length;
  const inactivos = clientes.filter(c => c.status === 'Inactivo') .length;

  const clientesFiltrados = clientes
    .filter(c => {
      const cumpleBusqueda = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.company.toLowerCase().includes(searchTerm.toLowerCase());
      const cumpleEstado = statusFilter === 'Todos' || c.status === statusFilter;
      return cumpleBusqueda && cumpleEstado;
    })
    .sort((a, b) => (a.status === 'Inactivo' ? 1 : -1));

  const handlePhoneChange = (e) => {
    const input = e.target.value.replace(/\D/g, '');
    setPhone(input.length <= 4 ? input : `${input.slice(0, 4)}-${input.slice(4, 8)}`);
  };

  const resetForm = () => {
    setEditId(null); setName(''); setEmail(''); setPhone(''); setCompany('');
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/clients/${editId}`, { name, email, phone, company });
        await registrarLog('ACTUALIZAR', 'CLIENTES', `Se actualizaron los datos del cliente: ${name} (${company})`);
        alert("Cliente actualizado");
      } else {
        await api.post('/clients', { name, email, phone, company, status: 'Activo' });
        await registrarLog('CREAR', 'CLIENTES', `Se registró un nuevo cliente: ${name} de la empresa ${company}`);
        alert("Cliente registrado");
      }
      resetForm();
      obtenerClientes();
    } catch (err) { alert("Error en la operación"); }
  };

  const toggleEstado = async (cliente) => {
    const nuevoEstado = cliente.status === 'Activo' ? 'Inactivo' : 'Activo';
    const confirmacion = window.confirm(`¿Deseas ${nuevoEstado === 'Inactivo' ? 'desactivar' : 'activar'} a ${cliente.name}?`);
    if (confirmacion) {
      try {
        await api.put(`/clients/${cliente.id}`, { status: nuevoEstado });
        await registrarLog('ACTUALIZAR', 'CLIENTES', `Cambio de estado de "${cliente.status}" a "${nuevoEstado}" para el cliente: ${cliente.name}`);
        obtenerClientes();
      } catch (err) { alert("Error al cambiar estado"); }
    }
  };

  const prepararEdicion = (c) => {
    setEditId(c.id); setName(c.name); setEmail(c.email); setPhone(c.phone); setCompany(c.company);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '100%' }}>
      <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Gestión de Asociados</h2>
      
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>{editId ? '✏️ Editando Cliente' : '📝 Registro de Nuevo Cliente'}</h3>
        <form onSubmit={guardarCliente} style={formGrid}>
          <input type="text" placeholder="Nombre" value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
          <input type="text" placeholder="Empresa" value={company} onChange={e => setCompany(e.target.value)} style={inputStyle} required />
          <input type="email" placeholder="Correo" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          <input type="text" placeholder="Teléfono" value={phone} onChange={handlePhoneChange} maxLength="9" style={inputStyle} required />
          <button type="submit" style={{ ...btnStyle, background: editId ? '#3498db' : '#27ae60' }}>
            {editId ? 'Actualizar Datos' : 'Registrar Asociado'}
          </button>
          {editId && <button type="button" onClick={resetForm} style={cancelBtn}>Cancelar</button>}
        </form>
      </section>

      {/* Grid de estadísticas responsivo */}
      <div className="stats-grid" style={statsGrid}>
        <div style={{ ...miniCard, borderLeft: '5px solid #2c3e50' }}> <p style={miniCardLabel}>TOTAL</p> <h2>{total}</h2> </div>
        <div style={{ ...miniCard, borderLeft: '5px solid #2ecc71' }}> <p style={miniCardLabel}>ACTIVOS</p> <h2 style={{color:'#2ecc71'}}>{activos}</h2> </div>
        <div style={{ ...miniCard, borderLeft: '5px solid #e74c3c' }}> <p style={miniCardLabel}>INACTIVOS</p> <h2 style={{color:'#e74c3c'}}>{inactivos}</h2> </div>
      </div>

      <div style={filterBar}>
        <input style={{...inputStyle, flex: '1 1 200px'}} placeholder="🔍 Buscar nombre o empresa..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select style={{...inputStyle, flex: '1 1 150px'}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="Todos">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="Inactivo">Inactivos</option>
        </select>
      </div>

      <div style={cardStyle}>
        {/* CONTENEDOR CON SCROLL PARA LA TABLA */}
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ ...tableStyle, minWidth: '600px' }}>
            <thead>
              <tr style={headerRowStyle}>
                <th style={paddingStyle}>#</th>
                <th style={paddingStyle}>Nombre Completo</th>
                <th style={paddingStyle}>Empresa</th>
                <th style={paddingStyle}>Contacto</th>
                <th style={paddingStyle}>Estado</th>
                <th style={paddingStyle}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((c, i) => (
                <tr key={c.id} style={{ ...rowStyle, opacity: c.status === 'Inactivo' ? 0.6 : 1, background: c.status === 'Inactivo' ? '#f9f9f9' : 'white' }}>
                  <td style={paddingStyle}>{i + 1}</td>
                  <td style={paddingStyle}><strong>{c.name}</strong></td>
                  <td style={paddingStyle}>{c.company}</td>
                  <td style={paddingStyle}>
                    <div style={{ fontSize: '0.85em' }}>
                      <span title={c.email}>✉️ {c.email}</span><br/>
                      <span>📞 {c.phone}</span>
                    </div>
                  </td>
                  <td style={paddingStyle}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.7em', fontWeight: 'bold', background: c.status === 'Activo' ? '#2ecc71' : '#95a5a6', color: 'white' }}>
                      {c.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={paddingStyle}>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => prepararEdicion(c)} style={actionBtn}>Editar</button>
                      <button onClick={() => toggleEstado(c)} style={{ ...actionBtn, background: c.status === 'Activo' ? '#e74c3c' : '#2ecc71' }}>
                        {c.status === 'Activo' ? 'Baja' : 'Alta'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' };
const cancelBtn = { background: '#95a5a6', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer' };
const actionBtn = { padding: '5px 10px', fontSize: '0.8em', border: 'none', borderRadius: '3px', background: '#34495e', color: 'white', cursor: 'pointer' };
const cardStyle = { background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', marginBottom: '20px', overflow: 'hidden' };
const inputStyle = { padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minWidth: '0' };
const btnStyle = { border: 'none', color: 'white', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
// Ajustado para ser flexible en móviles
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '15px', marginBottom: '20px' };
const miniCard = { background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const miniCardLabel = { margin: 0, fontSize: '0.7em', color: '#7f8c8d' };
const filterBar = { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const headerRowStyle = { background: '#2c3e50', color: 'white', textAlign: 'left' };
const rowStyle = { borderBottom: '1px solid #eee' };
const paddingStyle = { padding: '12px', whiteSpace: 'nowrap' };

export default Clientes;
