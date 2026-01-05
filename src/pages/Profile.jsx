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

    if (!profile || !metrics) return (
        <div className="container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            color: 'var(--primary-color)',
            fontSize: '1.2rem',
            fontWeight: 'bold'
        }}>
            <div className="animate-pulse">Loading Your Profile...</div>
        </div>
    );

    const targets = metrics.targets || { calories: 2000, protein: 150, carbs: 250, fat: 70 };

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
                    <div className="profile-header" style={{
                        background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                        padding: '30px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px'
                    }}>
                        <div className="profile-avatar" style={{
                            width: '80px', height: '80px',
                            borderRadius: '20px',
                            background: 'rgba(0,0,0,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: '900', color: '#000',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                            flexShrink: 0
                        }}>
                            {profile.name?.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h2 style={{ margin: 0, color: '#000', fontSize: '1.5rem', fontWeight: '800', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.name}</h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(0,0,0,0.6)', marginTop: '5px', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                                gap: '15px',
                                textAlign: 'center'
                            }}>
                                <div style={{ padding: '15px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)' }}>{metrics?.targets.calories}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Calories</div>
                                </div>
                                <div style={{ padding: '15px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--secondary-color)' }}>{metrics?.targets.protein}g</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Protein</div>
                                </div>
                                <div style={{ padding: '15px', background: 'var(--bg-color)', borderRadius: '12px' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--danger-color)' }}>{metrics?.targets.carbs}g</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '4px' }}>Carbs</div>
                                </div>
                                <div style={{ padding: '15px', background: 'var(--bg-color)', borderRadius: '12px' }}>
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

                        {/* Fitness Plan Section */}
                        <FitnessPlan profile={profile} metrics={metrics} />
                    </div>
                )}
            </div>
        </div>
    );
};

// Static Fitness Plan Generator - No AI needed
const FitnessPlan = ({ profile, metrics }) => {
    const [showPlan, setShowPlan] = useState(false);

    const getWorkoutPlan = () => {
        const plans = {
            loss: "Focus on a mix of strength training (3-4 days) and cardio (2-3 days). Circuit training and HIIT are excellent for maximizing calorie burn while preserving muscle mass. Include compound movements like squats, deadlifts, and bench press.",
            gain: "Prioritize progressive overload with heavy compound lifts 4-5 days per week. Focus on the big three: squats, deadlifts, and bench press. Limit cardio to 1-2 light sessions to preserve energy for lifting.",
            maintain: "A balanced approach with 3-4 strength sessions and 1-2 cardio sessions per week. Focus on maintaining your current lifts while enjoying varied workouts to stay engaged."
        };
        return plans[profile?.goal] || plans.maintain;
    };

    const getNutritionPlan = () => {
        const calories = metrics?.targets?.calories || 2000;
        const protein = metrics?.targets?.protein || 150;

        const plans = {
            loss: `Aim for ${calories} calories daily with high protein (${protein}g) to preserve muscle. Focus on whole foods, lean proteins, and vegetables. Drink plenty of water and consider intermittent fasting if it suits your lifestyle.`,
            gain: `Target ${calories} calories with ${protein}g protein spread across 4-6 meals. Include calorie-dense foods like nuts, avocados, and complex carbs. Time your largest meals around workouts.`,
            maintain: `Maintain ${calories} calories with balanced macros (${protein}g protein). Focus on nutrient-dense whole foods. Allow flexibility for treats while hitting your protein target daily.`
        };
        return plans[profile?.goal] || plans.maintain;
    };

    const getProTip = () => {
        const tips = {
            loss: "Don't cut calories too aggressively. A 500 calorie deficit is sustainable and helps prevent muscle loss.",
            gain: "Sleep 7-9 hours nightly. Muscle growth happens during recovery, not just in the gym.",
            maintain: "Track your weight weekly, not daily. Focus on performance improvements in the gym."
        };
        return tips[profile?.goal] || "Consistency beats perfection. Show up even on days you don't feel like it.";
    };

    return (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(204, 255, 0, 0.03), rgba(0, 240, 255, 0.03))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '6px', background: 'var(--primary-color)', borderRadius: '8px' }}>
                        <Activity size={16} color="#000" />
                    </div>
                    Your Fitness Plan
                </h3>
                {!showPlan && (
                    <button onClick={() => setShowPlan(true)} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                        View Plan
                    </button>
                )}
            </div>

            {showPlan ? (
                <div className="animate-fade-in">
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: 'var(--primary-color)', marginBottom: '6px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            🏋️ Workout Strategy
                        </h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{getWorkoutPlan()}</p>
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: 'var(--secondary-color)', marginBottom: '6px', fontSize: '0.85rem', textTransform: 'uppercase' }}>
                            🥗 Nutrition Strategy
                        </h4>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.6', margin: 0 }}>{getNutritionPlan()}</p>
                    </div>
                    <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: '10px', borderLeft: '3px solid var(--primary-color)' }}>
                        <strong style={{ fontSize: '0.85rem' }}>💡 Pro Tip:</strong>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', fontStyle: 'italic' }}>{getProTip()}</p>
                    </div>
                </div>
            ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Get a personalized workout and nutrition strategy based on your {profile?.goal === 'loss' ? 'fat loss' : profile?.goal === 'gain' ? 'muscle gain' : 'maintenance'} goal.
                </p>
            )}
        </div>
    );
};

export default Profile;

