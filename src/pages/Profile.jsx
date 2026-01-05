import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Activity, Target, Ruler, Weight, Download, Edit2, Save, X, Mail, Calendar, Info } from 'lucide-react';
import jsPDF from 'jspdf';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/user/profile');
            setProfile(data.user);
            setMetrics(data.metrics);
            setFormData(data.user);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put('/user/profile', formData);
            setProfile(data.user);
            setMetrics(data.metrics);
            setIsEditing(false);
            alert('Profile updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update profile');
        }
    };

    const downloadReport = () => {
        const doc = new jsPDF();
        doc.setFontSize(22);
        doc.setTextColor(204, 255, 0); // Primary color
        doc.text('GYM FREAK - HEALTH REPORT', 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

        doc.line(14, 35, 196, 35);

        doc.setFontSize(14);
        doc.text('User Information', 14, 45);
        doc.setFontSize(11);
        doc.text(`Name: ${profile.name}`, 14, 55);
        doc.text(`Email: ${profile.email}`, 14, 62);
        doc.text(`Age: ${profile.age}`, 14, 69);
        doc.text(`Gender: ${profile.gender}`, 14, 76);
        doc.text(`Height: ${profile.height} cm`, 14, 83);
        doc.text(`Weight: ${profile.weight} kg`, 14, 90);
        doc.text(`Goal: ${profile.goal}`, 14, 97);

        if (metrics) {
            doc.setFontSize(14);
            doc.text('Health Metrics', 14, 115);
            doc.setFontSize(11);
            doc.text(`BMI: ${metrics.bmi}`, 14, 125);
            doc.text(`BMR: ${metrics.bmr} kcal (Basal Metabolic Rate)`, 14, 132);
            doc.text(`TDEE: ${metrics.tdee} kcal (Total Daily Energy Expenditure)`, 14, 139);

            doc.setFontSize(14);
            doc.text('Daily Nutritional Targets', 14, 155);
            doc.setFontSize(11);
            doc.text(`Calories: ${metrics.targets.calories} kcal`, 14, 165);
            doc.text(`Protein: ${metrics.targets.protein}g`, 14, 172);
            doc.text(`Carbohydrates: ${metrics.targets.carbs}g`, 14, 179);
            doc.text(`Fats: ${metrics.targets.fat}g`, 14, 186);
        }

        doc.save(`${profile.name}_gym_freak_report.pdf`);
    };

    if (!profile) return <div className="container" style={{ paddingTop: '50px' }}>Loading Profile...</div>;

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                <h1 className="page-title" style={{ marginBottom: 0 }}>My Profile</h1>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {!isEditing && (
                        <button onClick={() => setIsEditing(true)} className="btn btn-primary" style={{ flex: '1 1 auto' }}>
                            <Edit2 size={18} /> Edit Details
                        </button>
                    )}
                    <button onClick={downloadReport} className="btn btn-secondary" style={{ flex: '1 1 auto' }}>
                        <Download size={18} /> Download Report
                    </button>
                </div>
            </div>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Left Column: Stats Display */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                        padding: '40px 30px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '25px'
                    }}>
                        <div style={{
                            width: '100px', height: '100px',
                            borderRadius: '24px',
                            background: 'rgba(0,0,0,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2.5rem', fontWeight: '900', color: '#000',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                        }}>
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#000', fontSize: '2rem', fontWeight: '800' }}>{profile.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(0,0,0,0.6)', marginTop: '5px' }}>
                                <Mail size={14} /> {profile.email}
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '30px' }}>
                        <div className="grid-2" style={{ gap: '15px' }}>
                            <div className="stat-item">
                                <span className="label">Age</span>
                                <span className="value">{profile.age} years</span>
                            </div>
                            <div className="stat-item">
                                <span className="label">Gender</span>
                                <span className="value" style={{ textTransform: 'capitalize' }}>{profile.gender}</span>
                            </div>
                            <div className="stat-item">
                                <span className="label">Height</span>
                                <span className="value">{profile.height} cm</span>
                            </div>
                            <div className="stat-item">
                                <span className="label">Weight</span>
                                <span className="value">{profile.weight} kg</span>
                            </div>
                            <div className="stat-item">
                                <span className="label">BMI</span>
                                <span className="value" style={{ color: metrics?.bmi > 25 ? 'var(--danger-color)' : 'var(--primary-color)' }}>{metrics?.bmi}</span>
                            </div>
                            <div className="stat-item">
                                <span className="label">Goal</span>
                                <span className="value" style={{ textTransform: 'capitalize' }}>{profile.goal === 'loss' ? 'Fat Loss' : profile.goal === 'gain' ? 'Muscle Gain' : 'Maintenance'}</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', padding: '25px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Target size={20} color="var(--primary-color)" /> Daily Targets
                                </h3>
                                <Info size={16} color="var(--text-secondary)" title="Calculated based on your BMR and activity level" />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', textAlign: 'center' }}>
                                <div style={{ flex: '1 1 100px' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{metrics?.targets.calories}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Calories</div>
                                </div>
                                <div style={{ flex: '1 1 100px' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--secondary-color)' }}>{metrics?.targets.protein}g</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Protein</div>
                                </div>
                                <div style={{ flex: '1 1 100px' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--danger-color)' }}>{metrics?.targets.carbs}g</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Carbs</div>
                                </div>
                                <div style={{ flex: '1 1 100px' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffe600' }}>{metrics?.targets.fat}g</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Fat</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form or AI Plan */}
                {isEditing ? (
                    <div className="card animate-fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h3 style={{ margin: 0 }}>Update Profile</h3>
                            <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="grid-2">
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-label">Full Name</label>
                                <input name="name" className="input-field" value={formData.name || ''} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Age</label>
                                <input name="age" type="number" className="input-field" value={formData.age || ''} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Gender</label>
                                <select name="gender" className="input-field" value={formData.gender || 'male'} onChange={handleChange}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Height (cm)</label>
                                <input name="height" type="number" className="input-field" value={formData.height || ''} onChange={handleChange} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Weight (kg)</label>
                                <input name="weight" type="number" className="input-field" value={formData.weight || ''} onChange={handleChange} required />
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-label">Activity Level</label>
                                <select name="activity_level" className="input-field" value={formData.activity_level || 'moderate'} onChange={handleChange}>
                                    <option value="sedentary">Sedentary (Office Job)</option>
                                    <option value="moderate">Moderate (1-3 days/week)</option>
                                    <option value="active">Active (3-5 days/week)</option>
                                </select>
                            </div>
                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-label">Goal</label>
                                <select name="goal" className="input-field" value={formData.goal || 'maintain'} onChange={handleChange}>
                                    <option value="loss">Fat Loss</option>
                                    <option value="maintain">Maintenance</option>
                                    <option value="gain">Muscle Gain</option>
                                </select>
                            </div>

                            <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="card" style={{ background: 'var(--surface-hover)', borderStyle: 'dashed' }}>
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <Activity size={48} color="var(--primary-color)" style={{ opacity: 0.3, marginBottom: '20px' }} />
                                <h3 style={{ marginBottom: '10px' }}>Health Overview</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                                    Your metrics are calculated using the Mifflin-St Jeor Equation, which is considered the most accurate for estimating BMR.
                                </p>
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                                        <span>BMR</span>
                                        <span style={{ fontWeight: 'bold' }}>{metrics?.bmr} kcal</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                                        <span>TDEE</span>
                                        <span style={{ fontWeight: 'bold' }}>{metrics?.tdee} kcal</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Fitness Plan Section */}
                        <AIFitnessPlan profile={profile} metrics={metrics} />
                    </div>
                )}
            </div>
        </div>
    );
};

const AIFitnessPlan = ({ profile, metrics }) => {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    const generatePlan = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/ai/fitness-plan', { profile, metrics });
            setPlan(data);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.error || 'Failed to generate AI plan. Check your API key.';
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ border: '1px solid var(--primary-color)', background: 'rgba(204, 255, 0, 0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                    ✨ AI Fitness Plan
                </h3>
                {!plan && !loading && (
                    <button onClick={generatePlan} className="btn btn-primary" style={{ padding: '8px 15px', fontSize: '0.85rem' }}>
                        Generate Plan
                    </button>
                )}
            </div>

            {loading && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>Crafting your personalized plan...</div>}

            {plan && (
                <div className="animate-fade-in">
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '5px', fontSize: '0.9rem' }}>WORKOUT STRATEGY</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{plan.workout_plan}</p>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <h4 style={{ color: 'var(--secondary-color)', marginBottom: '5px', fontSize: '0.9rem' }}>NUTRITION STRATEGY</h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>{plan.nutrition_plan}</p>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                        <strong>💡 Pro Tip:</strong> {plan.pro_tip}
                    </div>
                    <button onClick={generatePlan} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline' }}>
                        Regenerate Plan
                    </button>
                </div>
            )}

            {!plan && !loading && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                    Get a personalized workout and nutrition strategy based on your profile and goals.
                </p>
            )}
        </div>
    );
};

export default Profile;
