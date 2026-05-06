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
    <div style={{ padding: '10px' }}>
      <header style={welcomeBannerStyle}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '1.8em' }}>¡Hola, {firstName}!</h1>
        <p style={{ margin: 0, opacity: 0.9 }}>Bienvenido al panel de control de TechSolutions.</p>
      </header>

      <div style={statsGridStyle}>
        <div onClick={() => navigate('/proyectos')} style={{ ...interactiveCardStyle, borderBottom: '5px solid #3498db' }}>
          <span style={{ fontSize: '2em' }}>📁</span>
          <h2 style={{ fontSize: '1.8em', margin: '10px 0' }}>{stats.proyectos}</h2>
          <p style={{ fontWeight: 'bold', color: '#7f8c8d', margin: 0 }}>Proyectos</p>
        </div>
        <div onClick={() => navigate('/clientes')} style={{ ...interactiveCardStyle, borderBottom: '5px solid #2ecc71' }}>
          <span style={{ fontSize: '2em' }}>🏢</span>
          <h2 style={{ fontSize: '1.8em', margin: '10px 0' }}>{stats.clientes}</h2>
          <p style={{ fontWeight: 'bold', color: '#7f8c8d', margin: 0 }}>Clientes</p>
        </div>
        <div onClick={() => navigate('/tareas')} style={{ ...interactiveCardStyle, borderBottom: '5px solid #e67e22' }}>
          <span style={{ fontSize: '2em' }}>✅</span>
          <h2 style={{ fontSize: '1.8em', margin: '10px 0' }}>{stats.tareas}</h2>
          <p style={{ fontWeight: 'bold', color: '#7f8c8d', margin: 0 }}>Tareas</p>
        </div>
      </div>

      <div style={systemStatusStyle}>
        <h4 style={{ margin: '0 0 15px 0' }}>ℹ️ Estado del Sistema</h4>
        <div style={statusInfoWrapper}>
          <span><strong>Usuario:</strong> {user?.full_name}</span>
          <span><strong>Rol:</strong> <span style={roleBadgeStyle}>{user?.role || 'Admin'}</span></span>
          <span><strong>BD:</strong> <span style={{ color: '#2ecc71' }}>● OK</span></span>
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
    rawIntegrantes: []
  });
  
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Administrador' || user?.role === 'Superadministrador';
  const isLoginPage = location.pathname === '/login';

  const obtenerDatos = async () => {
    if (isLoginPage || !user) return;
    try {
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
        rawIntegrantes: resTeam.data
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

  const calculateMargin = () => {
    if (isLoginPage) return '0';
    if (window.innerWidth < 768) return '0';
    return isCollapsed ? '80px' : '280px';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', overflowX: 'hidden' }}>
      
      <style>{`
        body { margin: 0; padding: 0; overflow-x: hidden; }
        @media print {
          nav.sidebar, .sidebar { display: none !important; }
          main { margin-left: 0 !important; width: 100% !important; }
        }
        @media (max-width: 768px) {
          .sidebar { 
            transform: ${isCollapsed ? 'translateX(-100%)' : 'translateX(0)'};
            width: 280px !important;
          }
          .main-content-area { 
            margin-left: 0 !important; 
            padding: 10px !important;
            width: 100vw !important;
          }
          .overlay {
            display: ${isCollapsed ? 'none' : 'block'};
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
          }
        }
      `}</style>

      {/* Overlay para cerrar sidebar en móvil */}
      {!isLoginPage && <div className="overlay" onClick={() => setIsCollapsed(true)}></div>}

      {!isLoginPage && (
        <nav 
          className="sidebar" 
          style={{ ...sidebarStyle, width: isCollapsed ? '80px' : '280px' }}
        >
          {/* Botón de toggle corregido */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            style={{
              ...toggleButtonStyle,
              right: window.innerWidth < 768 ? '-45px' : '-15px',
              backgroundColor: window.innerWidth < 768 ? '#2c3e50' : '#3498db'
            }}
          >
            {isCollapsed ? '➡' : '⬅'}
          </button>

          <Link to="/" style={{ textDecoration: 'none' }} onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}>
            <div style={{ padding: '30px 10px', textAlign: 'center', background: '#1a252f', overflow: 'hidden' }}>
              <h2 style={{ color: '#ecf0f1', margin: 0, fontSize: isCollapsed && window.innerWidth > 768 ? '0.8em' : '1.5em' }}>
                {isCollapsed && window.innerWidth > 768 ? 'TS' : 'TechSolutions'}
              </h2>
            </div>
          </Link>
          
          <div style={{ marginTop: '20px', flexGrow: 1, overflowY: 'auto' }}>
            <div style={separatorStyle}>{(isCollapsed && window.innerWidth > 768) ? '---' : 'GESTIÓN'}</div>
            <Link to="/clientes" style={{ ...linkStyle, ...activeLink('/clientes') }} onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}>
              {(isCollapsed && window.innerWidth > 768) ? '🏢' : 'Clientes'}
            </Link>
            <Link to="/proyectos" style={{ ...linkStyle, ...activeLink('/proyectos') }} onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}>
              {(isCollapsed && window.innerWidth > 768) ? '📁' : 'Proyectos'}
            </Link>
            <Link to="/tareas" style={{ ...linkStyle, ...activeLink('/tareas') }} onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}>
              {(isCollapsed && window.innerWidth > 768) ? '✅' : 'Tareas'}
            </Link>

            <div style={separatorStyle}>{(isCollapsed && window.innerWidth > 768) ? '---' : 'ANÁLISIS'}</div>
            <Link to="/estadisticas" style={{ ...linkStyle, ...activeLink('/estadisticas') }} onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}>
              {(isCollapsed && window.innerWidth > 768) ? '📊' : 'Estadísticas'}
            </Link>

            {isAdmin && (
              <>
                <div style={separatorStyle}>{(isCollapsed && window.innerWidth > 768) ? '---' : 'ADMIN'}</div>
                <Link to="/usuarios" style={{ ...linkStyle, ...activeLink('/usuarios') }} onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}>
                  {(isCollapsed && window.innerWidth > 768) ? '👥' : 'Usuarios'}
                </Link>
                <Link to="/bitacora" style={{ ...linkStyle, ...activeLink('/bitacora') }} onClick={() => window.innerWidth < 768 && setIsCollapsed(true)}>
                  {(isCollapsed && window.innerWidth > 768) ? '📜' : 'Bitácora'}
                </Link>
              </>
            )}
          </div>

          <button onClick={handleLogout} style={logoutButtonStyle}>
            {(isCollapsed && window.innerWidth > 768) ? '🚪' : 'Cerrar Sesión'}
          </button>
        </nav>
      )}

      <main 
        className="main-content-area"
        style={{ 
          flex: 1, 
          marginLeft: calculateMargin(),
          transition: 'margin-left 0.3s ease',
          padding: isLoginPage ? '0' : '20px',
          minHeight: '100vh',
          width: '100%',
          boxSizing: 'border-box'
        }}
      >
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
                dataIntegrantes={stats.rawIntegrantes}
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

// Estilos
const statsGridStyle = { 
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
  gap: '15px', 
  marginBottom: '30px' 
};

const statusInfoWrapper = { 
  display: 'flex', 
  flexDirection: 'row',
  flexWrap: 'wrap', 
  gap: '15px', 
  fontSize: '0.85em' 
};

const sidebarStyle = { background: '#2c3e50', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 10px rgba(0,0,0,0.1)', transition: 'all 0.3s ease', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 1000 };
const welcomeBannerStyle = { background: '#2c3e50', color: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px' };
const interactiveCardStyle = { padding: '20px', background: 'white', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const systemStatusStyle = { padding: '20px', background: 'white', borderRadius: '10px', border: '1px solid #e0e0e0' };
const roleBadgeStyle = { background: '#ecf0f1', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold', color: '#2980b9' };
const toggleButtonStyle = { position: 'absolute', top: '20px', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' };
const linkStyle = { color: '#bdc3c7', textDecoration: 'none', padding: '15px 20px', display: 'block', transition: 'all 0.2s ease', borderLeft: '4px solid transparent', fontSize: '0.95em' };
const separatorStyle = { padding: '20px 20px 5px', fontSize: '0.65em', color: '#5d6d7e', fontWeight: 'bold', letterSpacing: '1px' };
const logoutButtonStyle = { background: 'none', border: 'none', color: '#e74c3c', padding: '20px', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', borderTop: '1px solid #34495e', width: '100%' };

export default App;
