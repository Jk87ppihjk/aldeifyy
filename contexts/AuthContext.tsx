
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { User, AuthResponse, Role } from '../types';
import { apiFetch } from '../services';

interface AuthContextType {
    user: User | null;
    needsSetup: boolean;
    setupType: 'store_setup' | 'address_setup' | null;
    isLoading: boolean;
    login: (data: AuthResponse) => void;
    logout: () => void;
    checkToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [setupType, setSetupType] = useState<'store_setup' | 'address_setup' | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const checkToken = useCallback(async () => {
        setIsLoading(true);
        const token = localStorage.getItem('userToken');
        if (token) {
            const { ok, data } = await apiFetch<{ user: User }>('/user/me');
            if (ok) {
                const authUser = (data as { user: User }).user;
                const role = localStorage.getItem('userRole') as Role;
                // A needs_setup check would ideally come from the API, but we simulate it if the address is missing
                const setupNeeded = role === Role.BUYER && (!authUser.city_id || !authUser.whatsapp_number);

                login({ token, role, user: { ...authUser, role }, needs_setup: setupNeeded, setup_type: setupNeeded ? 'address_setup' : undefined });
            } else {
                logout(); // Invalid token
            }
        } else {
            logout(); // No token
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        checkToken();
    }, [checkToken]);

    const login = (data: AuthResponse) => {
        localStorage.setItem('userToken', data.token);
        localStorage.setItem('userRole', data.role);
        setUser({ ...data.user, role: data.role });

        if (data.needs_setup) {
            setNeedsSetup(true);
            setSetupType(data.setup_type || null);
        } else {
            setNeedsSetup(false);
            setSetupType(null);
        }
    };
    
    const logout = () => {
        localStorage.removeItem('userToken');
        localStorage.removeItem('userRole');
        setUser(null);
        setNeedsSetup(false);
        setSetupType(null);
    };

    return (
        <AuthContext.Provider value={{ user, needsSetup, setupType, isLoading, login, logout, checkToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
