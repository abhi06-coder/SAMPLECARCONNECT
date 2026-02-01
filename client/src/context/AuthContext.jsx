import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            try {
                const userInfo = localStorage.getItem('userInfo');
                if (userInfo) {
                    const parsedUser = JSON.parse(userInfo);
                    setUser(parsedUser); // Set initial state from local storage for speed

                    // Verify token and get fresh data from server
                    try {
                        const { data } = await api.get('/users/profile');
                        setUser(data);
                        localStorage.setItem('userInfo', JSON.stringify(data));
                    } catch (apiError) {
                        console.error("Token invalid or expired", apiError);
                        logout(); // Clear invalid session
                    }
                }
            } catch (error) {
                console.error("Auth check failed", error);
                localStorage.removeItem('userInfo');
            } finally {
                setLoading(false);
            }
        };

        checkUserLoggedIn();
    }, []);

    const login = async (email, password) => {
        try {
            const { data } = await api.post('/auth/login', { email, password });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const { data } = await api.post('/auth/register', userData);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error("Logout API call failed", error);
        } finally {
            // Always clear local state to prevent being stuck
            setUser(null);
            localStorage.removeItem('userInfo');
            window.location.href = '/login';
        }
    };

    const updateProfile = async (userData) => {
        try {
            const { data } = await api.put('/users/profile', userData);
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Update failed'
            };
        }
    };

    const loginWithGoogle = async (idToken) => {
        try {
            const { data } = await api.post('/auth/social-login', { idToken });
            setUser(data);
            localStorage.setItem('userInfo', JSON.stringify(data));
            return { success: true, isNewUser: data.isNewUser };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Google Login failed' };
        }
    };

    const uploadProfilePicture = async (formData) => {
        try {
            const { data } = await api.post('/users/profile/upload-photo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return { success: true, url: data.url };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Upload failed' };
        }
    };

    const uploadQrCode = async (formData) => {
        try {
            const { data } = await api.post('/users/profile/upload-qr', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return { success: true, url: data.url };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Upload failed' };
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, updateProfile, loginWithGoogle, uploadProfilePicture, uploadQrCode, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
