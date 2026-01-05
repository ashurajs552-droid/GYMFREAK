import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '', email: '', password: '',
        age: '', gender: 'male', height: '', weight: '',
        activity_level: 'moderate', goal: 'maintain'
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await register(formData.email, formData.password, {
                name: formData.name,
                age: formData.age,
                gender: formData.gender,
                height: formData.height,
                weight: formData.weight,
                activity_level: formData.activity_level,
                goal: formData.goal
            });
            alert('Registration successful! Please check your email to confirm.');
            navigate('/login');
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
            padding: '40px 0',
            background: 'radial-gradient(circle at center, #1a1d24 0%, #0f1115 100%)'
        }}>
            <div className="card animate-fade-in" style={{ width: '600px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Dumbbell size={40} color="var(--primary-color)" />
                    <h2 style={{ fontSize: '1.8rem' }}>Join the Club</h2>
                </div>

                {error && <div style={{ color: 'var(--danger-color)', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="grid-2">
                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input name="name" className="input-field" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Email</label>
                        <input name="email" type="email" className="input-field" onChange={handleChange} required />
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Password</label>
                        <input name="password" type="password" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Age</label>
                        <input name="age" type="number" className="input-field" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Gender</label>
                        <select name="gender" className="input-field" onChange={handleChange}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Height (cm)</label>
                        <input name="height" type="number" className="input-field" onChange={handleChange} required />
                    </div>
                    <div className="input-group">
                        <label className="input-label">Weight (kg)</label>
                        <input name="weight" type="number" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Activity Level</label>
                        <select name="activity_level" className="input-field" onChange={handleChange}>
                            <option value="sedentary">Sedentary (Office Job)</option>
                            <option value="moderate">Moderate (1-3 days/week)</option>
                            <option value="active">Active (3-5 days/week)</option>
                        </select>
                    </div>
                    <div className="input-group">
                        <label className="input-label">Goal</label>
                        <select name="goal" className="input-field" onChange={handleChange}>
                            <option value="loss">Fat Loss</option>
                            <option value="maintain">Maintenance</option>
                            <option value="gain">Muscle Gain</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                    </div>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Already a member? <Link to="/login" style={{ color: 'var(--primary-color)' }}>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
