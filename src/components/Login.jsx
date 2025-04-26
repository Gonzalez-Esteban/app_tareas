import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [Clave, setClave] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      // 1. Autenticación con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(), // 👈 acá, la clave es email en minúscula
        password: Clave.trim()
      });
  
      if (authError) throw authError;
      const userId = authData?.user?.id;
      console.log('Usuario autenticado:', authData?.user);
      if (!userId) throw new Error('No se pudo obtener el usuario');
  
      // 2. Buscar info adicional en tu tabla `usuarios`
      const { data: usuario, error: userError } = await supabase
        .from('usuarios')
        .select('id_uuid, Nombre, Apellido, Legajo, email')
        .eq('id_uuid', userId)
        .single();
  
      if (userError) throw userError;
      console.log(usuario);
  
      // 3. Guardar en localStorage
      localStorage.setItem('usuario', JSON.stringify(usuario));
  
      // 4. Notificar e ir a /home
      onLogin(usuario);
      
      setTimeout(() => navigate('/home', { replace: true }), 100);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="container-fluid d-flex min-vh-100 w-100 justify-content-center align-items-center bg-dark">
      <div className="w-100" style={{ maxWidth: '500px' }}>
        <div className="card shadow-lg border-0" style={{ backgroundColor: '#1a202c' }}>
          <div className="card-body p-4">
            <h2 className="text-center text-white mb-4">Iniciar Sesión</h2>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label htmlFor="Email" className="form-label text-white">Correo Electrónico:</label>
                <input
                  type="Email"
                  id="Email"
                  name="Email"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="Clave" className="form-label text-white">Contraseña:</label>
                <input
                  type="password"
                  id="clave"
                  name="Clave"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Ingrese su contraseña"
                  value={Clave}
                  onChange={(e) => setClave(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold"
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>
            </form>
            {error && (
              <div className="alert alert-danger mt-3 text-center py-2" role="alert">
                {error}
              </div>
            )}
            <p className="text-center text-white mt-3">
              ¿No tenés cuenta?{' '}
              <Link to="/registro" className="text-primary text-decoration-none">
                Registrate acá
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
