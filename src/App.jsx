// src/App.jsx
import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Registro from './components/Registro';
import Home from './pages/Home';
import NuevoPedido from './components/NuevoPedido'; // Asegúrate de importar el componente
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

  const handleLogin = (userData) => {
    const userInfo = {
      email: userData.Email,    // 👈 ¡Ahora sí!
      nombre: userData.Nombre,
      legajo: userData.Legajo
    };
    setUsuario(userInfo);
    localStorage.setItem('usuario', JSON.stringify(userInfo));
    navigate('/home');
  };

  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/home" element={usuario ? (<Home usuario={usuario} />) : (<Login onLogin={handleLogin} />)}/>
      <Route path="/nuevo-pedido" element={<NuevoPedido />} />
    </Routes>
  );
}

export default App;