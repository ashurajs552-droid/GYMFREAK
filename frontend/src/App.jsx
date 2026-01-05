import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FoodTracker from './pages/FoodTracker';
import WorkoutTracker from './pages/WorkoutTracker';
import History from './pages/History';
import Profile from './pages/Profile';
import CompleteProfile from './pages/CompleteProfile';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Private Routes Wrapper */}
                    <Route element={<PrivateRoute />}>
                        {/* Complete Profile Page (No Layout) */}
                        <Route path="/complete-profile" element={<CompleteProfile />} />

                        {/* Main App with Layout */}
                        <Route element={<Layout />}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/food" element={<FoodTracker />} />
                            <Route path="/workout" element={<WorkoutTracker />} />
                            <Route path="/history" element={<History />} />
                            <Route path="/profile" element={<Profile />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
