import React from "react";
import dayjs from 'dayjs';
import TarjetaPedidos from "../components/TarjetaPedidos";
import ModalTareas from '../components/ModalTareas';
import Pedidos from '../components/Pedidos';
import ModalTareasProgramadas from '../components/ModalTareasProgramadas';
import Sidebar from '../components/sidebar';

export default function Body({
  usuario,
  sectores,
  pedidos,
  loading,
  error,
  pedidoSeleccionado,
  tareaSeleccionada,
  showPedidosModal,
  showTareasModal,
  showProgramadasModal,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  tareasProgramadas,
  mostrarSoloPendientes,
  setMostrarSoloPendientes,
  timeRefresh,
  localRefresh,
  
  // Funciones
  obtenerNombreSector,
  borrarPedido,
  abrirModalEdicion,
  cambiarEstadoPedido,
  calcularTiempoTranscurrido,
  cerrarModalPedidos,
  cargarPedidos,
  cargarProgramadas,
  abrirModalProgramadas,
  abrirModalNuevaTarea,
  abrirModalEditarTarea,
  setPedidoSeleccionado,
  setTareaSeleccionada,
  setShowProgramadasModal,
  modalTareasProgramadasRef,
  pedidoEditando,
  tareaEditando,
  modoTarea
}) {
  return (
    <div className="d-flex" style={{ paddingTop: "56px" }}>
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
        tareasProgramadas={tareasProgramadas}
        tareaSeleccionada={tareaSeleccionada}
        setTareaSeleccionada={setTareaSeleccionada}
        abrirModalProgramadas={abrirModalProgramadas}
        cargarProgramadas={cargarProgramadas}
        mostrarSoloPendientes={mostrarSoloPendientes}
        setMostrarSoloPendientes={setMostrarSoloPendientes}
        loading={loading}
      />

      {/* Contenido principal */}
      <div style={{
        flexGrow: 1,
        overflowY: 'auto',
        padding: '20px',
        marginLeft: isSidebarCollapsed ? '50px' : '390px',
        transition: 'margin-left 0.3s ease'
      }}>
        <h4 style={{ fontSize: '1.2rem', color: '#a0aec0', marginBottom: '20px' }}>Diarios</h4>

        {/* Modal de Pedidos */}
        <Pedidos
          showModal={showPedidosModal}
          pedidoEditando={pedidoEditando}
          onClose={cerrarModalPedidos}
          sectores={sectores}
          usuario={usuario}
          onGuardarSuccess={() => {
            cargarPedidos();
            cerrarModalPedidos();
          }}
        />

        <ModalTareasProgramadas
          ref={modalTareasProgramadasRef}
          showModal={showProgramadasModal}
          onClose={() => setShowProgramadasModal(false)}
          onTareaGuardada={() => {
            cargarProgramadas();
            setShowProgramadasModal(false);
          }}
          tarea={null}
        />

        {/* Modal de Tareas */}
        <ModalTareas
          showModal={showTareasModal}
          pedido={pedidoSeleccionado}
          tarea={modoTarea === 'editar' ? tareaEditando : null}
          onClose={() => {
            setShowTareasModal(false);
            setTareaEditando(null);
            setTareaSeleccionada(null);
          }}
          onTareaGuardada={() => {
            cargarPedidos();
            setTareaEditando(null);
            setTareaSeleccionada(null);
          }}
          cambiarEstadoPedido={cambiarEstadoPedido}
        />

        {/* Estados de carga y error */}
        {loading && (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
            <p className="text-secondary mt-2">Cargando pedidos...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {/* Tarjetas de pedidos agrupadas por fecha */}
        {!loading && !error && (
          <div className="row mt-3">
            {(() => {
              const hoy = dayjs().startOf('day');
              const ayer = hoy.subtract(1, 'day');
              const limiteAntiguedad = dayjs().subtract(4, 'day').startOf('day');

              const pedidosHoy = pedidos.filter(p => dayjs(p.created_at).isAfter(hoy));
              const pedidosAyer = pedidos.filter(p => dayjs(p.created_at).isAfter(ayer) && dayjs(p.created_at).isBefore(hoy));
              const pedidosAntiguos = pedidos.filter(p => {
                const fechaPedido = dayjs(p.created_at);
                return fechaPedido.isBefore(ayer) && fechaPedido.isAfter(limiteAntiguedad);
              });

              return (
                <>
                  {/* HOY */}
                  {pedidosHoy.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h5 className="text" style={{ color: '#a0aec0' }}>Hoy</h5>
                      <div
                        style={{
                          display: "grid",
                          gap: "16px",
                          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 360px))",
                          justifyContent: "flex-start",
                        }}
                      >
                        {pedidosHoy.map(pedido => (
                          <TarjetaPedidos
                            key={pedido.id}
                            pedido={pedido}
                            usuario={usuario}
                            sectores={sectores}
                            obtenerNombreSector={obtenerNombreSector}
                            borrarPedido={borrarPedido}
                            abrirModalEdicion={abrirModalEdicion}
                            cambiarEstadoPedido={cambiarEstadoPedido}
                            timeRefresh={timeRefresh}
                            calcularTiempoTranscurrido={() => calcularTiempoTranscurrido(pedido.created_at)}
                            onSelectPedido={(id) => {
                              setPedidoSeleccionado(id === pedidoSeleccionado?.id ? null : pedidos.find(p => p.id === id));
                              setTareaSeleccionada(null);
                            }}
                            onSelectTarea={(pedidoId, tareaId) => {
                              setPedidoSeleccionado(pedidos.find(p => p.id === pedidoId));
                              setTareaSeleccionada(tareaId);
                            }}
                            selectedPedidoId={pedidoSeleccionado?.id}
                            selectedTareaId={tareaSeleccionada}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AYER */}
                  {pedidosAyer.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h5 className="text" style={{ color: '#a0aec0' }}>Ayer</h5>
                      <div
                        style={{
                          display: "grid",
                          flexWrap: "wrap",
                          gap: "12px",
                          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 360px))",
                          justifyContent: "flex-start",
                        }}
                      >
                        {pedidosAyer.map(pedido => (
                          <TarjetaPedidos
                            key={pedido.id}
                            pedido={pedido}
                            usuario={usuario}
                            sectores={sectores}
                            obtenerNombreSector={obtenerNombreSector}
                            borrarPedido={borrarPedido}
                            abrirModalEdicion={abrirModalEdicion}
                            cambiarEstadoPedido={cambiarEstadoPedido}
                            timeRefresh={timeRefresh}
                            calcularTiempoTranscurrido={() => calcularTiempoTranscurrido(pedido.created_at)}
                            onSelectPedido={(id) => {
                              setPedidoSeleccionado(id === pedidoSeleccionado?.id ? null : pedidos.find(p => p.id === id));
                              setTareaSeleccionada(null);
                            }}
                            onSelectTarea={(pedidoId, tareaId) => {
                              setPedidoSeleccionado(pedidos.find(p => p.id === pedidoId));
                              setTareaSeleccionada(tareaId);
                            }}
                            selectedPedidoId={pedidoSeleccionado?.id}
                            selectedTareaId={tareaSeleccionada}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MÁS ANTIGUOS */}
                  {pedidosAntiguos.length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h5 className="text" style={{ color: '#a0aec0' }}>Más antiguos</h5>
                      <div
                        style={{
                          display: "grid",
                          flexWrap: "wrap",
                          gridTemplateColumns: "repeat(auto-fit, minmax(310px, 360px))",
                          gap: "16px",
                          justifyContent: "flex-start",
                        }}
                      >
                        {pedidosAntiguos.map(pedido => (
                          <TarjetaPedidos
                            key={pedido.id}
                            pedido={pedido}
                            usuario={usuario}
                            sectores={sectores}
                            obtenerNombreSector={obtenerNombreSector}
                            borrarPedido={borrarPedido}
                            abrirModalEdicion={abrirModalEdicion}
                            cambiarEstadoPedido={cambiarEstadoPedido}
                            timeRefresh={timeRefresh}
                            calcularTiempoTranscurrido={() => calcularTiempoTranscurrido(pedido.created_at)}
                            onSelectPedido={(id) => {
                              setPedidoSeleccionado(id === pedidoSeleccionado?.id ? null : pedidos.find(p => p.id === id));
                              setTareaSeleccionada(null);
                            }}
                            onSelectTarea={(pedidoId, tareaId) => {
                              setPedidoSeleccionado(pedidos.find(p => p.id === pedidoId));
                              setTareaSeleccionada(tareaId);
                            }}
                            selectedPedidoId={pedidoSeleccionado?.id}
                            selectedTareaId={tareaSeleccionada}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}