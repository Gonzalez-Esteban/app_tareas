import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [tareas, setTareas] = useState([])
  const [tipo, setTipo] = useState('')
  const [descripcion, setDescripcion] = useState('')

  useEffect(() => {
    fetchTareas()
  }, [])

  const fetchTareas = async () => {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error al cargar tareas:', error)
    else setTareas(data)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!tipo || !descripcion) return alert('Completa todos los campos')

    const { data, error } = await supabase.from('tareas').insert([
      {
        tipo,
        descripcion,
      },
    ])

    if (error) {
      console.error('Error al guardar tarea:', error)
    } else {
      setTipo('')
      setDescripcion('')
      fetchTareas()
    }
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>📋 Lista de Tareas</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="Descripción"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <button type="submit">Agregar</button>
      </form>

      {tareas.length === 0 ? (
        <p>No hay tareas</p>
      ) : (
        <ul>
          {tareas.map((t) => (
            <li key={t.id}>
              <strong>{t.tipo}</strong>: {t.descripcion}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
