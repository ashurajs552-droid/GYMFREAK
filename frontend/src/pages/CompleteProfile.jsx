import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Save } from 'lucide-react';

const CompleteProfile = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        age: '',
        gender: 'male',
        height: '',
        weight: '',
        activity_level: 'moderate',
        goal: 'maintain'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // We use the same update endpoint
            await api.put('/user/profile', {
                ...formData,
                name: user?.user_metadata?.full_name || user?.email?.split('@')[0] // Fallback name
            });
            // Force a reload or re-fetch of user context would be ideal, 
            // but navigating to dashboard will trigger a fetch in Dashboard.jsx
            // Ideally AuthContext should update, let's assume we redirect and the app handles it.
            window.location.href = '/';
        } catch (err) {
            console.error(err);
            alert('Failed to save profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'radial-gradient(circle at center, #1a1d24 0%, #0f1115 100%)',
            padding: '20px'
        }}>
            <div className="card animate-fade-in" style={{ width: '600px', maxWidth: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Dumbbell size={40} color="var(--primary-color)" />
                    <h2 style={{ fontSize: '1.8rem', marginTop: '10px' }}>One Last Step!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        We need a few details to calculate your personalized nutrition plan.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid-2">
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

                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Activity Level</label>
                        <select name="activity_level" className="input-field" onChange={handleChange}>
                            <option value="sedentary">Sedentary (Office Job)</option>
                            <option value="moderate">Moderate (1-3 days/week)</option>
                            <option value="active">Active (3-5 days/week)</option>
                        </select>
                    </div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label className="input-label">Goal</label>
                        <select name="goal" className="input-field" onChange={handleChange}>
                            <option value="loss">Fat Loss</option>
                            <option value="maintain">Maintenance</option>
                            <option value="gain">Muscle Gain</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2', marginTop: '20px' }}>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Saving...' : 'Complete Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompleteProfile;
