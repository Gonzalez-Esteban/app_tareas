import { Link } from 'react-router-dom';

export default function Home({ usuario }) {
  const handleLogout = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2d3748', color: 'white' }}>
      {/* Navbar Bootstrap oscuro */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-4">
        <span className="navbar-brand">
          Bienvenido, {usuario?.Nombre || usuario?.Legajo}!
        </span>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/pedidos">Pedidos</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/proyectos">Proyectos</Link>
            </li>
            <li className="nav-item">
              <button
                className="nav-link btn btn-link text-danger"
                style={{ textDecoration: 'none' }}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="container py-5">
        <h2 className="text-white">Esta es tu página de inicio</h2>
        {/* Agregá más contenido acá */}
      </div>
    </div>
  );
}
