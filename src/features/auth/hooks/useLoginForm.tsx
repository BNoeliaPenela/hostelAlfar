//Logica del formulario de login (estado de los campos, manejo de errores, envio)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService"; // Importar el servicio de auth
export const useLoginForm = () => {
    const [error, setError] = useState("");
    const [credentials, setCredentials] = useState({ username: "", password: "" });
    const navigate = useNavigate();
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(""); // Limpiar errores previos
        const success = await authService.login(credentials);
        if (success) {
            navigate("/home");
        } else {
            setError("Usuario o contraseña incorrectos");
        }
    };
    return {
        error,
        credentials,
        setCredentials,
        handleLogin,
    };
};