import { useState } from 'react'
import './App.css'
//import { Building2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/Card"
import {Label} from "./components/ui/Label"
import { Input } from "./components/ui/Input"
import { Button } from "./components/ui/Button"

//creacion de usuarios falsos para el login
const fakeUsers = [
  { username: "noe", password: "1234" },
  { username: "shei", password: "abcd" },
]

function App() {
  //se crea un estado para manejar el login
  //y otro para manejar las credenciales del usuario
  //se usa el hook useState de React para manejar el estado
  //isLoggedIn indica si el usuario esta logueado o no
  //credentials es un objeto que contiene el nombre de usuario y la contraseña
  //setIsLoggedIn y setCredentials son funciones para actualizar el estado
  
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [error, setError] = useState("")
  const [credentials, setCredentials] = useState({ username: '', password: '' })

  //handleLogin es una funcion que se ejecuta cuando el usuario intenta loguearse
  //previene el comportamiento por defecto del formulario
  //verifica si el nombre de usuario y la contraseña son correctos
  //si son correctos, actualiza el estado isLoggedIn a true
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()

     // Buscar si existe el usuario
    const user = fakeUsers.find(
      (u) => u.username === credentials.username && u.password === credentials.password
    )

    if (user) {
      setIsLoggedIn(true)
      setError("")
    } else {
      setError("Usuario o contraseña incorrectos")
    }
    /*if (credentials.username && credentials.password) {
      setIsLoggedIn(true)
    }*/
    
  }

  if (isLoggedIn) {
    return ( //aca deberia retornar el dashboard.
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <h1 className="text-2xl font-bold">Bienvenido al Hostel Alfar</h1>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-200 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center">          
          <CardTitle className="text-2xl">Hostel Alfar</CardTitle>
          <CardDescription>Sistema de Gestión</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default App
