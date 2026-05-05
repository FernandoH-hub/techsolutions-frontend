import api from './api';

export const registrarLog = async (accion, entidad, detalle) => {
  try {
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Desconocido' };
    await api.post('/logs', {
      usuario: user.username,
      accion,
      entidad,
      detalle,
      fecha: new Date().toISOString()
    });
  } catch (err) {
    console.error("Error al guardar en bitácora:", err);
  }
};