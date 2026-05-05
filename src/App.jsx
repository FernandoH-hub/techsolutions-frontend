import { Routes, Route, Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Clientes from './pages/Clientes';
import Proyectos from './pages/Proyectos';
import Tareas from './pages/Tareas';
import Usuarios from './pages/Usuarios';
import Login from './pages/Login';
import Estadisticas from './pages/Estadisticas';
import Bitacora from './pages/Bitacora';

// --- COMPONENTE DE BIENVENIDA ---
const WelcomeScreen = ({ stats }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const firstName = user ? user.full_name.split(' ')[0] : 'Admin';

  return (
    <div style={{ padding: '20px' }}>
      <header style={welcomeBannerStyle}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '2.2em' }}>¡Hola, {firstName}!</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Bienvenido al panel de control de TechSolutions.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '25px', marginBottom: '40px' }}>
        <div onClick={() => navigate('/proyectos')} style={{ ...interactiveCardStyle, borderBottom: '5px solid #3498db' }}>
          <span style={{ fontSize: '2.5em' }}>📁</span>
          <h2 style={{ fontSize: '2em', margin: '10px 0' }}>{stats.proyectos}</h2>
          <p style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Proyectos Activos</p>
        </div>
        <div onClick={() => navigate('/clientes')} style={{ ...interactiveCardStyle, borderBottom: '5px solid #2ecc71' }}>
          <span style={{ fontSize: '2.5em' }}>🏢</span>
          <h2 style={{ fontSize: '2em', margin: '10px 0' }}>{stats.clientes}</h2>
          <p style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Clientes Registrados</p>
        </div>
        <div onClick={() => navigate('/tareas')} style={{ ...interactiveCardStyle, borderBottom: '5px solid #e67e22' }}>
          <span style={{ fontSize: '2.5em' }}>✅</span>
          <h2 style={{ fontSize: '2em', margin: '10px 0' }}>{stats.tareas}</h2>
          <p style={{ fontWeight: 'bold', color: '#7f8c8d' }}>Tareas Pendientes</p>
        </div>
      </div>

      <div style={systemStatusStyle}>
        <h4 style={{ margin: '0 0 15px 0' }}>ℹ️ Estado del Sistema</h4>
        <div style={{ display: 'flex', gap: '30px', fontSize: '0.9em' }}>
          <span><strong>Usuario:</strong> {user?.full_name}</span>
          <span><strong>Rol:</strong> <span style={roleBadgeStyle}>{user?.role || 'Admin'}</span></span>
          <span><strong>Base de Datos:</strong> <span style={{ color: '#2ecc71' }}>● Conectada</span></span>
        </div>
      </div>
    </div>
  );
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ 
    clientes: 0, proyectos: 0, tareas: 0,
    rawProyectos: [], rawTareas: [],
    rawClientes: [],
    rawIntegrantes: [] // Para project_team
  });
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Administrador' || user?.role === 'Superadministrador';
  const isLoginPage = location.pathname === '/login';

  const obtenerDatos = async () => {
    if (isLoginPage) return;
    try {
      // Agregamos la ruta correcta según el nombre de tu tabla
      const [resClients, resProjects, resTasks, resTeam] = await Promise.all([
        api.get('/clients'),
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/project_team') 
      ]);
      
      setStats({
        clientes: resClients.data.length,
        proyectos: resProjects.data.length,
        tareas: resTasks.data.length,
        rawProyectos: resProjects.data,
        rawTareas: resTasks.data,
        rawClientes: resClients.data,
        rawIntegrantes: resTeam.data // Guardamos la data de los integrantes
      });
    } catch (err) { 
      console.error("Error sincronizando datos:", err); 
    }
  };

  useEffect(() => { obtenerDatos(); }, [location.pathname, isLoginPage]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const activeLink = (path) => 
    location.pathname === path ? { background: '#34495e', color: 'white', borderLeft: '4px solid #3498db' } : {};

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6' }}>
      
      <style>{`
        @media print {
          nav.sidebar, .sidebar { display: none !important; }
          main { 
            margin-left: 0 !important; 
            padding: 0 !important; 
            width: 100% !important;
          }
          body { background-color: white !important; }
        }
      `}</style>

      {!isLoginPage && (
        <nav 
          className="sidebar" 
          style={{ ...sidebarStyle, width: isCollapsed ? '80px' : '280px' }}
        >
          <button onClick={() => setIsCollapsed(!isCollapsed)} style={toggleButtonStyle}>
            {isCollapsed ? '➡' : '⬅'}
          </button>

          <Link to="/" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '30px 10px', textAlign: 'center', background: '#1a252f', overflow: 'hidden' }}>
              <h2 style={{ color: '#ecf0f1', margin: 0, fontSize: isCollapsed ? '0.8em' : '1.5em' }}>
                TechSolutions
              </h2>
            </div>
          </Link>
          
          <div style={{ marginTop: '20px', flexGrow: 1, overflowY: 'auto' }}>
            <div style={separatorStyle}>{isCollapsed ? '---' : 'GESTIÓN'}</div>
            <Link to="/clientes" style={{ ...linkStyle, ...activeLink('/clientes') }}> {!isCollapsed && "Clientes"}</Link>
            <Link to="/proyectos" style={{ ...linkStyle, ...activeLink('/proyectos') }}> {!isCollapsed && "Proyectos"}</Link>
            <Link to="/tareas" style={{ ...linkStyle, ...activeLink('/tareas') }}> {!isCollapsed && "Tareas"}</Link>

            <div style={separatorStyle}>{isCollapsed ? '---' : 'ANÁLISIS Y RECURSOS'}</div>
            <Link to="/estadisticas" style={{ ...linkStyle, ...activeLink('/estadisticas') }}> {!isCollapsed && "Estadísticas"}</Link>

            {isAdmin && (
              <>
                <div style={separatorStyle}>{isCollapsed ? '---' : 'ADMINISTRACIÓN'}</div>
                <Link to="/usuarios" style={{ ...linkStyle, ...activeLink('/usuarios') }}> {!isCollapsed && "Usuarios"}</Link>
                <Link to="/bitacora" style={{ ...linkStyle, ...activeLink('/bitacora') }}> {!isCollapsed && "Bitácora"}</Link>
              </>
            )}
          </div>

          <button onClick={handleLogout} style={logoutButtonStyle}>
            {!isCollapsed && "Cerrar Sesión"}
          </button>
        </nav>
      )}

      <main style={{ 
        flex: 1, 
        marginLeft: isLoginPage ? '0' : (isCollapsed ? '80px' : '280px'),
        transition: 'margin-left 0.3s ease',
        padding: isLoginPage ? '0' : '40px',
        minHeight: '100vh'
      }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<WelcomeScreen stats={stats} />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/tareas" element={<Tareas />} />
          <Route 
            path="/estadisticas" 
            element={
              <Estadisticas 
                dataProyectos={stats.rawProyectos} 
                dataTareas={stats.rawTareas} 
                dataClientes={stats.rawClientes}
                dataIntegrantes={stats.rawIntegrantes} // Se pasa a la página de estadísticas
              />
            } 
          />
          
          <Route path="/usuarios" element={isAdmin ? <Usuarios /> : <Navigate to="/" />} />
          <Route path="/bitacora" element={isAdmin ? <Bitacora /> : <Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

const sidebarStyle = { background: '#2c3e50', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.1)', transition: 'width 0.3s ease', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 100 };
const welcomeBannerStyle = { background: '#2c3e50', color: 'white', padding: '40px', borderRadius: '15px', marginBottom: '30px' };
const interactiveCardStyle = { padding: '30px', background: 'white', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const systemStatusStyle = { padding: '25px', background: 'white', borderRadius: '12px', border: '1px solid #e0e0e0' };
const roleBadgeStyle = { background: '#ecf0f1', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#2980b9' };
const toggleButtonStyle = { position: 'absolute', right: '-15px', top: '25px', background: '#3498db', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 101 };
const linkStyle = { color: '#bdc3c7', textDecoration: 'none', padding: '12px 25px', display: 'block', transition: 'all 0.2s ease', borderLeft: '4px solid transparent', fontSize: '0.95em' };
const separatorStyle = { padding: '25px 25px 10px', fontSize: '0.7em', color: '#5d6d7e', fontWeight: 'bold', letterSpacing: '1px' };
const logoutButtonStyle = { background: 'none', border: 'none', color: '#e74c3c', padding: '25px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', borderTop: '1px solid #34495e' };

export default App;