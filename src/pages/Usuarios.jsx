import { useState, useEffect } from 'react';
import api from '../api';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('Todos');
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    username: '', 
    password: '', 
    full_name: '', 
    role: 'Usuario',
    security_question: '',
    custom_question: '',
    security_answer: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('user')) || {};

  const preguntasPredefinidas = [
    "¿Cuál es el nombre de tu primera mascota?",
    "¿En qué ciudad nacieron tus padres?",
    "¿Cuál era tu apodo de la infancia?",
    "¿Cuál es el nombre de tu escuela primaria?",
    "Otra pregunta (Personalizada)..."
  ];

  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/users');
      setUsuarios(res.data);
    } catch (err) {
      console.error("Error al cargar la lista");
    }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const usuariosFiltrados = usuarios.filter(u => {
    const coincideNombre = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideRol = roleFilter === 'Todos' || u.role === roleFilter;
    return coincideNombre && coincideRol;
  });

  const validarPassword = (pass) => {
    if (editingId && !pass) return true; 
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return regex.test(pass);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      username: '', password: '', full_name: '', role: 'Usuario',
      security_question: '', custom_question: '', security_answer: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const preguntaFinal = formData.security_question === "Otra pregunta (Personalizada)..." 
      ? formData.custom_question 
      : formData.security_question;

    if (!formData.username || !formData.full_name || !preguntaFinal || (!editingId && !formData.security_answer)) {
      return alert("Por favor, llena todos los campos obligatorios.");
    }

    if (!validarPassword(formData.password)) {
      return alert("La contraseña debe tener al menos 6 caracteres, incluyendo letras y números.");
    }

    const payload = { ...formData, security_question: preguntaFinal };

    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        alert("Usuario actualizado correctamente");
      } else {
        await api.post('/users/register', payload);
        alert("¡Usuario registrado exitosamente!");
      }
      resetForm();
      fetchUsuarios(); 
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Error de conexión"));
    }
  };

  const handleEditar = (u) => {
    setEditingId(u.id);
    const esPredefinida = preguntasPredefinidas.includes(u.security_question);
    setFormData({
      username: u.username || '',
      full_name: u.full_name || '',
      role: u.role || 'Usuario',
      password: '', 
      security_question: esPredefinida ? (u.security_question || '') : "Otra pregunta (Personalizada)...",
      custom_question: esPredefinida ? '' : (u.security_question || ''),
      security_answer: '' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir al formulario en móvil
  };

  const handleEliminar = async (u) => {
    if (u.id === currentUser.id) return alert("No puedes eliminar tu propia cuenta.");
    if (currentUser.role === 'Administrador' && (u.role === 'Administrador' || u.role === 'Superadministrador')) {
        return alert("Permisos insuficientes: No puedes eliminar a otros administradores.");
    }
    if (currentUser.role === 'Superadministrador' && u.role === 'Superadministrador') {
        return alert("Seguridad: No puedes eliminar a otros Superadministradores.");
    }

    if (window.confirm(`¿Estás seguro de eliminar a ${u.full_name}?`)) {
      try {
        await api.delete(`/users/${u.id}`, { headers: { 'role': currentUser.role } });
        fetchUsuarios();
      } catch (err) {
        alert(err.response?.data?.error || "Error al eliminar el usuario.");
      }
    }
  };

  return (
    <div className="usuarios-container">
      <style>{`
        .usuarios-container {
          display: flex;
          gap: 20px;
          padding: 20px;
          max-width: 1250px;
          margin: auto;
          font-family: Arial, sans-serif;
          flex-direction: row;
        }
        .form-section {
          flex: 0 0 350px;
          background: #fff;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          height: fit-content;
        }
        .table-section {
          flex: 1;
          background: #fff;
          padding: 25px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.08);
          overflow-x: auto;
        }
        .search-controls {
          display: flex;
          gap: 10px;
          marginBottom: 20px;
        }

        /* DISEÑO RESPONSIVO MÓVIL */
        @media (max-width: 850px) {
          .usuarios-container {
            flex-direction: column;
            padding: 10px;
          }
          .form-section {
            flex: none;
            width: 100%;
            box-sizing: border-box;
          }
          .search-controls {
            flex-direction: column;
          }
          
          /* Convertir tabla en Cards */
          table, thead, tbody, th, td, tr { 
            display: block; 
          }
          thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          tr {
            border: 1px solid #eee;
            margin-bottom: 15px;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.02);
          }
          td {
            border: none;
            position: relative;
            padding-left: 50% !important;
            text-align: right !important;
          }
          td:before {
            position: absolute;
            left: 10px;
            width: 45%;
            white-space: nowrap;
            font-weight: bold;
            text-align: left;
            color: #7f8c8d;
          }
          td:nth-of-type(1):before { content: "#"; }
          td:nth-of-type(2):before { content: "Usuario"; }
          td:nth-of-type(3):before { content: "Rol"; }
          td:nth-of-type(4):before { content: "Acciones"; }
          
          .actions-div {
            justify-content: flex-end;
          }
        }
      `}</style>

      {/* FORMULARIO */}
      <div className="form-section">
        <h2 style={{ color: '#2c3e50', marginTop: 0, fontSize: '1.2em' }}>
            {editingId ? '📝 Editar Usuario' : '👤 Nuevo Usuario'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <label style={labelStyle}>Nombre Completo</label>
          <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} style={inputStyle} />
          
          <label style={labelStyle}>Usuario (Login)</label>
          <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} style={inputStyle} />
          
          <label style={labelStyle}>Contraseña {editingId && <small>(dejar vacío para no cambiar)</small>}</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>{showPassword ? "🙈" : "👁️"}</button>
          </div>
          
          <label style={labelStyle}>Rol del Sistema</label>
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={inputStyle}>
            <option value="Usuario">Usuario</option>
            <option value="Administrador">Administrador</option>
          </select>

          <label style={labelStyle}>Pregunta de Seguridad</label>
          <select 
            value={formData.security_question} 
            onChange={e => setFormData({...formData, security_question: e.target.value})} 
            style={inputStyle}
          >
            <option value="">-- Seleccione una --</option>
            {preguntasPredefinidas.map((p, i) => <option key={i} value={p}>{p}</option>)}
          </select>

          {formData.security_question === "Otra pregunta (Personalizada)..." && (
            <input 
                type="text" 
                placeholder="Escribe tu pregunta personalizada" 
                value={formData.custom_question} 
                onChange={e => setFormData({...formData, custom_question: e.target.value})} 
                style={inputStyle} 
            />
          )}

          <label style={labelStyle}>Respuesta {editingId && <small>(dejar vacío para no cambiar)</small>}</label>
          <input 
            type="text" 
            value={formData.security_answer} 
            onChange={e => setFormData({...formData, security_answer: e.target.value})} 
            style={inputStyle} 
          />

          <button type="submit" style={editingId ? {...btnStyle, background: '#f39c12'} : btnStyle}>
            {editingId ? 'Actualizar Datos' : 'Crear Cuenta'}
          </button>
          {editingId && (
              <button type="button" onClick={resetForm} style={{...btnStyle, background: '#95a5a6'}}>Cancelar</button>
          )}
        </form>
      </div>

      {/* TABLA DE USUARIOS */}
      <div className="table-section">
        <h2 style={{ color: '#2c3e50', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            👥 Usuarios Activos
        </h2>
        
        <div className="search-controls" style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            style={{ ...inputStyle, flex: 2 }}
          />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
            <option value="Todos">Todos los roles</option>
            <option value="Usuario">Usuarios</option>
            <option value="Administrador">Administradores</option>
            <option value="Superadministrador">Superadministradores</option>
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#34495e', color: 'white' }}>
              <th style={{...thStyle, borderRadius: '8px 0 0 0'}}>#</th>
              <th style={thStyle}>Nombre / Usuario</th>
              <th style={thStyle}>Rol</th>
              <th style={{...thStyle, borderRadius: '0 8px 0 0'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((u, index) => {
              const esPropioUser = u.id === currentUser.id;
              const esAdminOSuper = u.role === 'Administrador' || u.role === 'Superadministrador';
              const adminBloqueado = currentUser.role === 'Administrador' && esAdminOSuper;
              const superBloqueado = currentUser.role === 'Superadministrador' && u.role === 'Superadministrador' && !esPropioUser;

              return (
                <tr key={u.id}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    <strong>{u.full_name}</strong> {esPropioUser && <small>(Tú)</small>}<br />
                    <small style={{ color: '#7f8c8d' }}>@{u.username}</small>
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(u.role)}>{u.role?.toUpperCase()}</span>
                  </td>
                  <td style={tdStyle}>
                    <div className="actions-div" style={{ display: 'flex', gap: '15px' }}>
                      {!(adminBloqueado && !esPropioUser) && (
                        <button onClick={() => handleEditar(u)} style={actionBtnStyle('#3498db')}>Editar</button>
                      )}
                      {!esPropioUser && !adminBloqueado && !superBloqueado && (
                        <button onClick={() => handleEliminar(u)} style={actionBtnStyle('#e74c3c')}>Eliminar</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Estilos constantes
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '-5px' };
const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', fontSize: '14px', background: '#fcfcfc' };
const btnStyle = { padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' };
const eyeButtonStyle = { position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' };
const thStyle = { padding: '12px', textAlign: 'left', fontSize: '14px' };
const tdStyle = { padding: '15px 12px', fontSize: '14px', borderBottom: '1px solid #eee' };
const actionBtnStyle = (color) => ({ color, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', padding: 0 });

const badgeStyle = (role) => ({
  padding: '4px 10px', borderRadius: '20px', fontSize: '0.7em', fontWeight: 'bold',
  background: role === 'Superadministrador' ? '#f3e5f5' : role === 'Administrador' ? '#e3f2fd' : '#fff3e0',
  color: role === 'Superadministrador' ? '#8e24aa' : role === 'Administrador' ? '#1e88e5' : '#fb8c00',
  border: `1px solid`,
  display: 'inline-block'
});

export default Usuarios;
