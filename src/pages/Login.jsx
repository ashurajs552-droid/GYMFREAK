import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            padding: '20px',
            background: 'radial-gradient(circle at center, #1a1d24 0%, #0f1115 100%)'
        }}>
            <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                <Dumbbell size={48} color="var(--primary-color)" style={{ marginBottom: '20px' }} />
                <h2 style={{ marginBottom: '20px', fontSize: '1.8rem' }}>Welcome Back</h2>

                {error && <div style={{ color: 'var(--danger-color)', marginBottom: '15px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <input
                            type="email"
                            className="input-field"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            className="input-field"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
                </form>

                <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary-color)' }}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
