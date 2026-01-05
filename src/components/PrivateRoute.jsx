import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';

const PrivateRoute = () => {
    const { user, loading } = useAuth();
    const [profileChecked, setProfileChecked] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const checkProfile = async () => {
            if (user) {
                try {
                    const { data } = await api.get('/user/profile');
                    // Check if critical fields are missing
                    if (!data.user.height || !data.user.weight || !data.user.age) {
                        setIsProfileComplete(false);
                    } else {
                        setIsProfileComplete(true);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setProfileChecked(true);
                }
            } else {
                setProfileChecked(true);
            }
        };
        checkProfile();
    }, [user]);

    if (loading || !profileChecked) return <div className="container" style={{ paddingTop: '50px' }}>Loading...</div>;

    if (!user) return <Navigate to="/login" />;

    // If profile is incomplete and we are not already on the completion page, redirect
    if (!isProfileComplete && location.pathname !== '/complete-profile') {
        return <Navigate to="/complete-profile" />;
    }

    // If profile is complete but we try to access completion page, go to dashboard
    if (isProfileComplete && location.pathname === '/complete-profile') {
        return <Navigate to="/" />;
    }

    return <Outlet />;
};

export default PrivateRoute;
