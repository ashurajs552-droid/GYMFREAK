import { useState, useEffect } from 'react';
import api from '../api';
import { Dumbbell, Trash2, Timer, Flame, Search, Plus, CheckCircle2 } from 'lucide-react';

const WorkoutTracker = () => {
    const [workouts, setWorkouts] = useState([]);
    const [totalBurned, setTotalBurned] = useState(0);
    const [type, setType] = useState('strength');

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);

    const [formData, setFormData] = useState({
        duration: '', sets: '', reps: '', weight: ''
    });

    const date = new Date().toISOString().split('T')[0];

    const fetchWorkouts = async () => {
        try {
            const { data } = await api.get(`/workouts/log/${date}`);
            setWorkouts(data.workouts);
            setTotalBurned(data.totalBurned);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchWorkouts();
    }, []);

    // Search Exercises
    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            try {
                const { data } = await api.get(`/workouts/search?q=${query}`);
                setResults(data);
            } catch (err) {
                console.error(err);
            }
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    const handleSelect = (ex) => {
        setSelectedExercise(ex);
        setType(ex.type);
        setQuery(ex.name);
        setResults([]);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prepare data - convert empty strings to null or numbers to avoid DB errors
        const payload = {
            date,
            type,
            exercise_name: selectedExercise ? selectedExercise.name : query,
            duration: formData.duration ? parseInt(formData.duration) : null,
            sets: formData.sets ? parseInt(formData.sets) : null,
            reps: formData.reps ? parseInt(formData.reps) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            met: selectedExercise ? selectedExercise.met : null
        };

        try {
            await api.post('/workouts/log', payload);
            setFormData({ duration: '', sets: '', reps: '', weight: '' });
            setSelectedExercise(null);
            setQuery('');
            fetchWorkouts();
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to log workout';
            alert(msg);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete workout?')) return;
        try {
            await api.delete(`/workouts/log/${id}`);
            fetchWorkouts();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="animate-fade-in">
            <h1 className="page-title">Workout Tracker</h1>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Add Workout Form */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Log Workout</h3>
                        {selectedExercise && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--success-color)', fontSize: '0.8rem' }}>
                                <CheckCircle2 size={14} /> Verified Exercise (MET: {selectedExercise.met})
                            </div>
                        )}
                    </div>

                    {/* Exercise Search */}
                    <div className="input-group" style={{ position: 'relative' }}>
                        <label className="input-label">Exercise Name</label>
                        <Search style={{ position: 'absolute', left: '12px', top: '40px', color: 'var(--text-secondary)' }} size={20} />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '40px' }}
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setSelectedExercise(null); }}
                            placeholder="Search (e.g. Bench Press, Running)"
                            required
                        />
                        {query.length === 0 && (
                            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {['Bench Press', 'Squats', 'Deadlift', 'Running', 'Cycling'].map(ex => (
                                    <button
                                        key={ex}
                                        onClick={() => { setQuery(ex); }}
                                        style={{
                                            padding: '4px 10px',
                                            fontSize: '0.75rem',
                                            borderRadius: '20px',
                                            background: 'var(--surface-hover)',
                                            color: 'var(--text-secondary)',
                                            border: '1px solid var(--glass-border)'
                                        }}
                                    >
                                        + {ex}
                                    </button>
                                ))}
                            </div>
                        )}
                        {results.length > 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                background: 'var(--surface-color)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-md)',
                                zIndex: 10,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                            }}>
                                {results.map(ex => (
                                    <div key={ex.id} onClick={() => handleSelect(ex)} style={{
                                        padding: '12px 15px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid var(--glass-border)',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>{ex.name}</span>
                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--surface-hover)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{ex.type} (MET: {ex.met})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <button
                            type="button"
                            className={`btn ${type === 'strength' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setType('strength')}
                            style={{ flex: 1 }}
                        >
                            <Dumbbell size={18} /> Strength
                        </button>
                        <button
                            type="button"
                            className={`btn ${type === 'cardio' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setType('cardio')}
                            style={{ flex: 1 }}
                        >
                            <Timer size={18} /> Cardio
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {type === 'strength' ? (
                            <>
                                <div className="grid-3">
                                    <div className="input-group">
                                        <label className="input-label">Sets</label>
                                        <input name="sets" type="number" className="input-field" value={formData.sets} onChange={handleChange} placeholder="0" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Reps</label>
                                        <input name="reps" type="number" className="input-field" value={formData.reps} onChange={handleChange} placeholder="0" required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Weight (kg)</label>
                                        <input name="weight" type="number" className="input-field" value={formData.weight} onChange={handleChange} placeholder="0" required />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Time Consumed (minutes - optional)</label>
                                    <input name="duration" type="number" className="input-field" value={formData.duration} onChange={handleChange} placeholder="Estimated if empty" />
                                </div>
                            </>
                        ) : (
                            <div className="input-group">
                                <label className="input-label">Duration (minutes)</label>
                                <input name="duration" type="number" className="input-field" value={formData.duration} onChange={handleChange} placeholder="0" required />
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                            <Plus size={18} /> Log Exercise
                        </button>
                    </form>
                </div>

                {/* Workout Log */}
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Today's Session</h3>

                    <div style={{ marginBottom: '20px', padding: '20px', background: 'linear-gradient(135deg, var(--surface-hover), var(--bg-color))', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ background: 'rgba(255, 77, 77, 0.1)', padding: '12px', borderRadius: '12px' }}>
                            <Flame color="#ff4d4d" size={24} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Burned</div>
                            <div style={{ fontWeight: '800', fontSize: '1.5rem', color: 'var(--text-primary)' }}>{totalBurned} <span style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>kcal</span></div>
                        </div>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {workouts.map(w => (
                            <div key={w.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '15px',
                                borderBottom: '1px solid var(--glass-border)',
                                transition: 'background 0.2s'
                            }} className="workout-item-row">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ background: 'var(--surface-hover)', padding: '10px', borderRadius: '12px' }}>
                                        {w.type === 'strength' ? <Dumbbell size={20} color="var(--primary-color)" /> : <Timer size={20} color="#00f0ff" />}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{w.exercise_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {w.type === 'strength'
                                                ? `${w.sets} sets × ${w.reps} reps @ ${w.weight}kg ${w.duration ? `(${w.duration}m)` : ''}`
                                                : `${w.duration} mins`}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 'bold', color: '#ff4d4d' }}>{w.calories_burned} kcal</div>
                                    <button onClick={() => handleDelete(w.id)} style={{ background: 'none', color: 'var(--text-secondary)', marginTop: '5px', opacity: 0.5 }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {workouts.length === 0 && (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <Dumbbell size={40} style={{ opacity: 0.2, marginBottom: '10px' }} />
                                <div>No workouts logged yet.</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorkoutTracker;
