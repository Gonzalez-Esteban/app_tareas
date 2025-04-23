import { useState } from 'react';
import { supabase } from '../supabase/supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

export default function Registro() {
  const [form, setForm] = useState({ 
    Nombre: '', 
    Apellido: '', 
    Legajo: '', 
    Clave: '' 
  });

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.Nombre || !form.Apellido || !form.Legajo || !form.Clave) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      const { error } = await supabase
        .from('usuarios')
        .insert([form]);

      if (error) throw error;

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
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <div className="card shadow-lg border-0" style={{ backgroundColor: '#1a202c' }}>
          <div className="card-body p-4">
            <h2 className="text-center text-white mb-4">Registro de Usuario</h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label text-white">Nombre:</label>
                <input
                  type="text"
                  id="nombre"
                  name="Nombre"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Ej: Juan"
                  value={form.Nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="apellido" className="form-label text-white">Apellido:</label>
                <input
                  type="text"
                  id="apellido"
                  name="Apellido"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Ej: Pérez"
                  value={form.Apellido}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="legajo" className="form-label text-white">Legajo:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="legajo"
                  name="Legajo"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Ej: 12345"
                  value={form.Legajo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="clave" className="form-label text-white">Clave:</label>
                <input
                  type="password"
                  id="clave"
                  name="Clave"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Ingrese su clave"
                  value={form.Clave}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold"
              >
                Registrarse
              </button>
            </form>

            {error && (
              <div className="alert alert-danger mt-3 text-center py-2" role="alert">
                {error}
              </div>
            )}

            {mensaje && (
              <div className="alert alert-success mt-3 text-center py-2" role="alert">
                {mensaje}
              </div>
            )}

            <p className="text-center text-white mt-3">
              ¿Ya tenés cuenta?{' '}
              <Link to="/" className="text-primary text-decoration-none">
                Iniciá sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
