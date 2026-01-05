import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Utensils, Dumbbell, User, LogOut, Calendar, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

const Layout = () => {
    const { logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
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
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="logo" onClick={() => navigate('/')}>
                    <Dumbbell color="var(--primary-color)" size={22} />
                    <span>GYM FREAK</span>
                </div>
                <button onClick={toggleTheme} style={{ padding: '8px', color: 'var(--text-primary)' }}>
                    {isLightMode ? <Moon size={22} /> : <Sun size={22} />}
                </button>
            </header>

            {/* Desktop Sidebar */}
            <aside className="sidebar">
                <div className="logo" onClick={() => navigate('/')}>
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
                    <button onClick={toggleTheme} className="nav-item" style={{ width: '100%', justifyContent: 'flex-start' }}>
                        {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
                        <span>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
                    </button>
                    <button onClick={logout} className="logout-btn">
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="mobile-bottom-nav">
                <NavLink to="/" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutDashboard size={22} />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/food" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <Utensils size={22} />
                    <span>Food</span>
                </NavLink>
                <NavLink to="/workout" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <Dumbbell size={22} />
                    <span>Gym</span>
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <Calendar size={22} />
                    <span>Log</span>
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
                    <User size={22} />
                    <span>Me</span>
                </NavLink>
            </nav>

            {/* Main Content */}
            <main className="main-content">
                <div className="container">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
