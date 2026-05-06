import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { registrarLog } from '../logger'; 

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0); // 0: Login, 1: Buscar Usuario, 2: Reset
  const navigate = useNavigate();

  // Estados para recuperación
  const [recoveryData, setRecoveryData] = useState({
    username: '',
    question: '',
    answer: '',
    newPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/users/login', credentials);
      
      // EXPLICACIÓN: response.data.user ahora trae el { ..., token: '...' } 
      // que configuramos en el userController.js
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // REGISTRO EN BITÁCORA
      await registrarLog('ACCESO', 'SISTEMA', `Inicio de sesión exitoso para el usuario: ${credentials.username}`);
      
      navigate('/'); 
    } catch (err) {
      alert("Error: " + (err.response?.data?.error || "Credenciales incorrectas"));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchQuestion = async () => {
    if (!recoveryData.username) return alert("Ingresa un usuario");
    setLoading(true);
    try {
      const res = await api.get(`/users/security-question/${recoveryData.username}`);
      setRecoveryData({ ...recoveryData, question: res.data.security_question });
      setStep(2);
    } catch (err) {
      alert("Usuario no encontrado");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (recoveryData.newPassword.length < 6) return alert("La clave debe tener 6+ caracteres");
    setLoading(true);
    try {
      await api.post('/users/reset-password', {
        username: recoveryData.username,
        security_answer: recoveryData.answer,
        new_password: recoveryData.newPassword
      });

      await registrarLog('ACTUALIZAR', 'SEGURIDAD', `El usuario ${recoveryData.username} restableció su contraseña mediante pregunta de seguridad`);

      alert("Contraseña actualizada. Ya puedes iniciar sesión.");
      setStep(0);
    } catch (err) {
      alert(err.response?.data?.error || "Error al restablecer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={fullPageBackground}>
      <div style={loginCard}>
        <div style={logoContainer}>
          <div style={logoPlaceholder}>
            <span style={{ fontSize: '40px' }}>{step === 0 ? "🏢" : "🔐"}</span>
          </div>
        </div>

        <div style={headerStyle}>
          <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0', fontSize: '1.8em' }}>
            {step === 0 ? "TechSolutions S.A." : "RECUPERAR"}
          </h2>
          <p style={{ color: '#7f8c8d', fontSize: '0.9em', margin: 0 }}>Prestación de servicios tecnológicos y consultoría empresarial</p>
        </div>

        {step === 0 && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Nombre de Usuario</label>
              <input 
                type="text" 
                placeholder="Ej: FernandoH" 
                value={credentials.username}
                onChange={e => setCredentials({...credentials, username: e.target.value})} 
                style={inputStyle}
                required
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Contraseña</label>
              {/* CORRECCIÓN AQUÍ: Se añadió inline style position relative */}
              <div style={{ position: 'relative', width: '100%' }}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  value={credentials.password}
                  onChange={e => setCredentials({...credentials, password: e.target.value})} 
                  style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', paddingRight: '45px' }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} style={{ ...buttonStyle, backgroundColor: loading ? '#bdc3c7' : '#27ae60' }}>
              {loading ? "VERIFICANDO..." : "INGRESAR AL SISTEMA"}
            </button>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button type="button" onClick={() => {
                setStep(1);
                setRecoveryData({...recoveryData, username: credentials.username}); 
              }} style={linkBtnStyle}>¿Olvidaste tu contraseña?</button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Ingresa tu usuario para comenzar</label>
              <input 
                type="text" 
                value={recoveryData.username}
                onChange={e => setRecoveryData({...recoveryData, username: e.target.value})}
                style={inputStyle}
                placeholder="Usuario..."
              />
            </div>
            <button onClick={handleFetchQuestion} disabled={loading} style={buttonStyle}>
              {loading ? "BUSCANDO..." : "CONTINUAR"}
            </button>
            <button onClick={() => setStep(0)} style={backBtnStyle}>Volver al Login</button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #3498db' }}>
              <small style={{ color: '#7f8c8d' }}>Pregunta de seguridad:</small>
              <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#2c3e50' }}>{recoveryData.question}</p>
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Tu respuesta</label>
              <input 
                type="text" 
                value={recoveryData.answer}
                onChange={e => setRecoveryData({...recoveryData, answer: e.target.value})}
                style={inputStyle}
                required
              />
            </div>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Nueva Contraseña</label>
              <input 
                type="password" 
                value={recoveryData.newPassword}
                onChange={e => setRecoveryData({...recoveryData, newPassword: e.target.value})}
                style={inputStyle}
                required
              />
            </div>
            <button type="submit" disabled={loading} style={{ ...buttonStyle, backgroundColor: '#3498db' }}>
              {loading ? "PROCESANDO..." : "CAMBIAR CONTRASEÑA"}
            </button>
            <button type="button" onClick={() => setStep(1)} style={backBtnStyle}>Atrás</button>
          </form>
        )}

        <div style={footerStyle}>
          © 2026 Todos los derechos reservados
        </div>
      </div>
    </div>
  );
}

// --- ESTILOS ---
const linkBtnStyle = { background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '0.85em', textDecoration: 'underline' };
const backBtnStyle = { background: 'none', border: 'none', color: '#7f8c8d', cursor: 'pointer', fontSize: '0.9em', marginTop: '10px' };
const fullPageBackground = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)', margin: 0, padding: 0 };
const loginCard = { width: '90%', maxWidth: '420px', padding: '40px 30px', background: '#ffffff', borderRadius: '8px', boxShadow: '0 15px 35px rgba(0,0,0,0.3)', position: 'relative', boxSizing: 'border-box' };
const logoContainer = { display: 'flex', justifyContent: 'center', marginBottom: '20px' };
const logoPlaceholder = { width: '80px', height: '80px', borderRadius: '50%', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: '1px solid #eee' };
const headerStyle = { textAlign: 'center', marginBottom: '25px' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '0.9em', fontWeight: '600', color: '#34495e' };
const inputStyle = { padding: '12px 15px', borderRadius: '4px', border: '1px solid #ced4da', fontSize: '1em', backgroundColor: '#fdfdfd', transition: 'border-color 0.3s ease' };
const buttonStyle = { marginTop: '10px', padding: '14px', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1em', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s ease', letterSpacing: '1px', backgroundColor: '#27ae60' };
const eyeButtonStyle = { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2em', display: 'flex', alignItems: 'center', height: '100%', padding: 0 };
const footerStyle = { textAlign: 'center', marginTop: '30px', fontSize: '0.75em', color: '#bdc3c7' };

export default Login;
