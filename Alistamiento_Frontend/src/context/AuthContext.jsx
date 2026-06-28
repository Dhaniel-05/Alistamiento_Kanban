import { createContext, useContext } from "react";
import { useAuth } from "../hooks/useAuth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const auth = useAuth();
    
    // ✅ Asegurar que siempre haya un objeto válido
    const authValue = auth || {
        user: null,
        token: null,
        login: async () => false,
        logout: () => {}
    };

    return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);