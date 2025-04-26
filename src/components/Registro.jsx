import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Registro() {
  const [form, setForm] = useState({
    Nombre: '',
    Apellido: '',
    Legajo: '',
    email: '',
    Clave: '',
    ConfirmarClave: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!form.Nombre || !form.Apellido || !form.Legajo || !form.email || !form.Clave) {
      setError('Todos los campos son obligatorios');
      return;
    }
  
    if (form.Clave !== form.ConfirmarClave) {
      setError('Las contraseñas no coinciden');
      return;
    }
  
    try {
      // 1. Crear el usuario en Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.Clave
      });
  
      if (signUpError) throw signUpError;
  
      // 2. Forzar refresco de sesión
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
  
      const userId = sessionData?.session?.user?.id;
      console.log(userId);
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');
      //console.log(userId)
      // 3. Insertar en la tabla usuarios
      const { error: insertError } = await supabase.from('usuarios').insert([
        {
          id_uuid: userId,
          Nombre: form.Nombre,
          Apellido: form.Apellido,
          Legajo: form.Legajo,
          email: form.email
        }
      ]);
  
      if (insertError) throw insertError;
  
      setError('');
      setMensaje('Usuario registrado con éxito. Redirigiendo...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError('Error al registrar: ' + err.message);
      setMensaje('');
    }
  };

  return (
    <div className="container-fluid d-flex min-vh-100 w-100 justify-content-center align-items-center bg-dark">
      <div className="w-100" style={{ maxWidth: '600px' }}>
        <div className="card shadow-lg border-0" style={{ backgroundColor: '#1a202c' }}>
          <div className="card-body p-4">
            <h2 className="text-center text-white mb-4">Registro de Usuario</h2>
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white">Nombre:</label>
                  <input type="text" name="Nombre" className="form-control bg-secondary text-white border-0"
                    value={form.Nombre} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white">Apellido:</label>
                  <input type="text" name="Apellido" className="form-control bg-secondary text-white border-0"
                    value={form.Apellido} onChange={handleChange} required />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-white">Legajo:</label>
                <input type="text" name="Legajo" className="form-control bg-secondary text-white border-0"
                  value={form.Legajo} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label className="form-label text-white">Correo Electrónico:</label>
                <input type="Email" name="Email" className="form-control bg-secondary text-white border-0"
                  value={form.email} onChange={handleChange} required />
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white">Contraseña:</label>
                  <input type="password" name="Clave" className="form-control bg-secondary text-white border-0"
                    value={form.Clave} onChange={handleChange} required />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-white">Confirmar Contraseña:</label>
                  <input type="password" name="ConfirmarClave" className="form-control bg-secondary text-white border-0"
                    value={form.ConfirmarClave} onChange={handleChange} required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 fw-semibold">Registrarse</button>
            </form>
            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
            <p className="text-center text-white mt-3">
              ¿Ya tenés cuenta?{' '}
              <Link to="/" className="text-primary text-decoration-none">Iniciá sesión</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
