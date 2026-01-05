import { Link, NavLink, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Utensils, Dumbbell, User, LogOut, Calendar, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
    const { logout } = useAuth();
    const [isLightMode, setIsLightMode] = useState(localStorage.getItem('theme') === 'light');

    useEffect(() => {
        if (isLightMode) {
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        }
    }, [isLightMode]);

    const toggleTheme = () => setIsLightMode(!isLightMode);

    return (
        <div className="layout">
            <aside className="sidebar">
                <div className="logo" onClick={() => window.location.href = '/'}>
                    <Dumbbell color="var(--primary-color)" size={28} />
                    <span>GYM FREAK</span>
                </div>

                <nav className="nav-menu">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/food" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Utensils size={20} />
                        <span>Food Log</span>
                    </NavLink>
                    <NavLink to="/workout" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Dumbbell size={20} />
                        <span>Workouts</span>
                    </NavLink>
                    <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Calendar size={20} />
                        <span>History</span>
                    </NavLink>
                    <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <User size={20} />
                        <span>Profile</span>
                    </NavLink>
                </nav>

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <button onClick={toggleTheme} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', justifyContent: 'flex-start', cursor: 'pointer' }}>
                        {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                        <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
