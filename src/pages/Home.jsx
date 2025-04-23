import { Link } from 'react-router-dom';

export default function Home({ usuario }) {
  const handleLogout = () => {
    localStorage.removeItem('usuario');
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#2d3748', color: 'white' }}>
      {/* Navbar con Offcanvas */}
      <nav className="navbar navbar-dark bg-dark fixed-top">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <span className="navbar-brand mb-0 h1">
            Bienvenido, {usuario?.Nombre || usuario?.Legajo}!
          </span>

          <div className="d-flex align-items-center gap-2">
            {/* Nuevo Pedido fuera del Offcanvas */}
            <Link to="/nuevo-pedido" className="btn btn-outline-light">
              <i className="bi bi-plus-circle me-2"></i>Pedido
            </Link>

            {/* Botón de menú Offcanvas */}
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="offcanvas"
              data-bs-target="#offcanvasNavbar"
              aria-controls="offcanvasNavbar"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
          </div>

          {/* Offcanvas */}
          <div
            className="offcanvas offcanvas-end text-bg-dark"
            tabIndex="-1"
            id="offcanvasNavbar"
            aria-labelledby="offcanvasNavbarLabel"
          >
            <div className="offcanvas-header">
              <h5 className="offcanvas-title" id="offcanvasNavbarLabel">Menú</h5>
              <button
                type="button"
                className="btn-close btn-close-white"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
              ></button>
            </div>

            <div className="offcanvas-body d-flex flex-column justify-content-between">
              <ul className="navbar-nav flex-grow-1">
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/pedidos">
                    <i className="bi bi-card-checklist me-2"></i>Pedidos
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/proyectos">
                    <i className="bi bi-kanban me-2"></i>Proyectos
                  </Link>
                </li>
              </ul>

              <div className="mt-auto">
                <button
                  className="btn btn-link text-danger"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <div style={{ paddingTop: '80px' }} className="container">
        <h2 className="text-white mb-4">Panel de navegación</h2>
        <p className="text-white">Seleccioná una opción del menú lateral.</p>
      </div>
    </div>
  );
}
