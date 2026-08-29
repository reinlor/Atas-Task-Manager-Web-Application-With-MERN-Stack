import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

// Function for retrieving user logged in data and storing it as a context teehee~
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_BASE_URL}/api/account/me`,
                    { withCredentials: true }
                );
                setUser(response.data);
            } catch (err) {
                setUser(null); 
            } finally {
                setIsLoading(false);
            }
        };
        fetchMe();
    }, []);

    return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}