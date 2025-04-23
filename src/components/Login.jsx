import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';

export default function Login({ onLogin }) {
  const [legajo, setLegajo] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('Legajo', legajo.trim())
        .eq('Clave', clave.trim())
        .single();

      if (supabaseError) throw supabaseError;
      if (!data) throw new Error('No se encontró usuario con esas credenciales');

      localStorage.setItem('usuario', JSON.stringify(data));
      onLogin(data);
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
                <label htmlFor="legajo" className="form-label text-white">Legajo:</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="legajo"
                  name="legajo"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Ej: 12345"
                  value={legajo}
                  onChange={(e) => setLegajo(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label htmlFor="clave" className="form-label text-white">Clave:</label>
                <input
                  type="password"
                  id="clave"
                  name="clave"
                  className="form-control bg-secondary text-white border-0"
                  placeholder="Ingrese su clave"
                  value={clave}
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
