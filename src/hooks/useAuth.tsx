//logica de autenticación y cierre de sesión
//reutilizable en toda la app
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
    const nav = useNavigate();

    const logout = () => {
        sessionStorage.removeItem("authed");
        nav("/login");
    };
    //lógica para verificar si está autenticado, etc.
    /*const isAuthenticated = () => sessionStorage.getItem("authed") === "true";
    return { logout, isAuthenticated };*/
    return { logout };
    };
