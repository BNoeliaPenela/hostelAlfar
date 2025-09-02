//logica de autenticacion.
//simula llamada a API y maneja estado en sessionStorage
//facilita cambiar a backend real en el futuro sin afectar la UI.
interface UserCredentials {
    username: string;
    password: string;
}
const fakeUsers = [
    { username: "noe", password: "1234" },
    { username: "shei", password: "abcd" },
];
export const authService = {
    login: async ({ username, password }: UserCredentials): Promise<boolean> => {
        // Simula una llamada a API
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = fakeUsers.find(
                    (u) => u.username === username && u.password === password
                );
                if (user) {
                    sessionStorage.setItem("authed", "true");
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 500); // Simula un retardo de red
        });
    },
    logout: () => {
        sessionStorage.removeItem("authed");
    },
    isAuthenticated: () => {
        return sessionStorage.getItem("authed") === "true";
    }
};