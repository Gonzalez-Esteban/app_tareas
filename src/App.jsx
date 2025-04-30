import { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './components/Login';
import Registro from './components/Registro';
import Home from './pages/Home';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const navigate = useNavigate();

  const handleLogin = (userData) => {
    const userInfo = {
      email: userData.Email,
      nombre: userData.Nombre,
      legajo: userData.Legajo
    };
    setUsuario(userInfo);
    localStorage.setItem('usuario', JSON.stringify(userInfo));
    navigate('/home');
  };

  return (
    <>
      {/* Contenedor de notificaciones - debe estar en el nivel superior */}
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      {/* Rutas de tu aplicación */}
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/registro" element={<Registro />} />
        <Route 
          path="/home" 
          element={usuario ? (<Home usuario={usuario} />) : (<Login onLogin={handleLogin} />)} 
        />
      </Routes>
    </>
  );
}

export default App;