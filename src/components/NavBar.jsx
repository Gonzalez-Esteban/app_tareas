import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({
  saludo, usuario, pedidoSeleccionado, tareaSeleccionada,
  abrirNuevoPedido, abrirModalProgramadas, abrirModalEditarTarea,
  borrarPedido, abrirModalEdicion, abrirModalNuevaTarea,
  setPedidoSeleccionado, setTareaSeleccionada,
  containerRef, sectores, setFiltroSector, setFiltroEstado,
  cargarPedidos, handleLogout
}) => {
  return (
    <nav className="navbar navbar-dark bg-dark fixed-top">
      <div className="container-fluid d-flex justify-content-between align-items-center" ref={containerRef}
        onClick={(e) => {
          if (e.target === e.currentTarget && pedidoSeleccionado) {
            setPedidoSeleccionado(null);
            setTareaSeleccionada(null);
          }
        }}
        style={{ borderWidth: '2px', fontWeight: '700', fontSize: '1rem', color: '#a0aec0' }}
      >
        <span className="navbar-brand mb-0 h2" style={{ color: '#a0aec0' }}>
          {saludo}, {usuario?.nombre || "Usuario"}!
        </span>

        <div className="d-flex align-items-center gap-2">
          {!pedidoSeleccionado ? (
            <>
              <button className="btn btn-outline-secondary me-1" onClick={abrirNuevoPedido}>
                <i className="bi bi-clipboard-plus me-2"></i> Pedido
              </button>
              <button className="btn btn-outline-secondary me-1" onClick={abrirModalProgramadas}>
                <i className="bi bi-calendar2-plus"></i> Programada
              </button>
              <button className="btn btn-outline-secondary me-1">
                <i className="bi bi-journal-plus"></i> Proyecto
              </button>
            </>
          ) : (
            <>
              {tareaSeleccionada ? (
                <>
                  <button className="btn btn-outline-danger me-2" onClick={() => abrirModalEditarTarea(pedidoSeleccionado.tareas.find(t => t.id === tareaSeleccionada))}>
                    <i className="bi bi-trash me-1"></i> Eliminar
                  </button>
                  <button className="btn btn-outline-warning me-2" onClick={() => abrirModalEditarTarea(pedidoSeleccionado.tareas.find(t => t.id === tareaSeleccionada))}>
                    <i className="bi bi-pencil me-1"></i> Editar
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-outline-danger me-2" onClick={() => borrarPedido(pedidoSeleccionado.id)}>
                    <i className="bi bi-trash me-1"></i> Eliminar
                  </button>
                  <button className="btn btn-outline-warning me-2" onClick={() => abrirModalEdicion(pedidoSeleccionado)}>
                    <i className="bi bi-pencil me-1"></i> Editar
                  </button>
                  <button className="btn btn-outline-primary" onClick={abrirModalNuevaTarea}>
                    <i className="bi bi-plus-circle me-1"></i> Agregar Tarea
                  </button>
                </>
              )}
            </>
          )}
          <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasNavbar">
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>

        <div className="offcanvas offcanvas-end text-bg-dark" id="offcanvasNavbar">
          <div className="offcanvas-header">
            <h5 className="offcanvas-title">Menú</h5>
            <button className="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
          </div>
          <div className="offcanvas-body d-flex flex-column justify-content-between">
            <ul className="navbar-nav flex-grow-1">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Filtrar por Sector</a>
                <ul className="dropdown-menu">
                  <li><button className="dropdown-item" onClick={() => { setFiltroSector(null); cargarPedidos(); }}>Todos</button></li>
                  {sectores.map(sector => (
                    <li key={sector.id}>
                      <button className="dropdown-item" onClick={() => { setFiltroSector(sector.id); cargarPedidos(); }}>
                        {sector.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="nav-item dropdown mt-2">
                <a className="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">Filtrar por Estado</a>
                <ul className="dropdown-menu">
                  <li><button className="dropdown-item" onClick={() => { setFiltroEstado(null); cargarPedidos(); }}>Todos</button></li>
                  <li><button className="dropdown-item" onClick={() => { setFiltroEstado('En proceso'); cargarPedidos(); }}>En proceso</button></li>
                  <li><button className="dropdown-item" onClick={() => { setFiltroEstado('Resuelto'); cargarPedidos(); }}>Resuelto</button></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/pedidos"><i className="bi bi-card-checklist me-2"></i>Pedidos</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link text-white" to="/proyectos"><i className="bi bi-kanban me-2"></i>Proyectos</Link>
              </li>
            </ul>
            <button className="btn btn-link text-danger mt-auto" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
