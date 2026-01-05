import { useState, useEffect } from 'react';
import api from '../api';
import { Dumbbell, Trash2, Timer, Flame, Search, Plus, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const WorkoutTracker = () => {
    const [workouts, setWorkouts] = useState([]);
    const [totalBurned, setTotalBurned] = useState(0);
    const [type, setType] = useState('strength');

    // Search State
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);

    const [formData, setFormData] = useState({
        duration: '', sets: 1, reps: '', weight: ''
    });

    // Dynamic Sets State
    const [setsData, setSetsData] = useState([{ weight: '', reps: '' }]);

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

    const handleSetChange = (index, field, value) => {
        const newSets = [...setsData];
        newSets[index][field] = value;
        setSetsData(newSets);
    };

    const addSet = () => setSetsData([...setsData, { weight: '', reps: '' }]);
    const removeSet = (index) => {
        if (setsData.length > 1) {
            setSetsData(setsData.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            date,
            type,
            exercise_name: selectedExercise ? selectedExercise.name : query,
            muscle_group: selectedExercise ? selectedExercise.muscle_group : 'Other',
            duration: formData.duration ? parseInt(formData.duration) : null,
            sets: type === 'strength' ? setsData.length : null,
            reps: type === 'strength' ? parseInt(setsData[0].reps) : null, // Fallback for legacy
            weight: type === 'strength' ? parseFloat(setsData[0].weight) : null, // Fallback for legacy
            sets_data: type === 'strength' ? setsData : null,
            met: selectedExercise ? selectedExercise.met : null
        };

        try {
            await api.post('/workouts/log', payload);
            setFormData({ duration: '', sets: 1, reps: '', weight: '' });
            setSetsData([{ weight: '', reps: '' }]);
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

    // Group workouts by muscle group
    const groupedWorkouts = workouts.reduce((acc, w) => {
        const group = w.muscle_group || 'Other';
        if (!acc[group]) acc[group] = [];
        acc[group].push(w);
        return acc;
    }, {});

    const muscleGroups = ['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Cardio', 'Full Body', 'Other'];

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
                                <CheckCircle2 size={14} /> {selectedExercise.muscle_group} • MET: {selectedExercise.met}
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
                                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: 'var(--surface-hover)', borderRadius: '4px', color: 'var(--text-secondary)' }}>{ex.muscle_group}</span>
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
                            <div style={{ marginBottom: '20px' }}>
                                <label className="input-label">Sets Configuration</label>
                                {setsData.map((set, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                        <div style={{ width: '30px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{index + 1}</div>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Weight (kg)"
                                            value={set.weight}
                                            onChange={(e) => handleSetChange(index, 'weight', e.target.value)}
                                            required
                                            style={{ flex: 1 }}
                                        />
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="Reps"
                                            value={set.reps}
                                            onChange={(e) => handleSetChange(index, 'reps', e.target.value)}
                                            required
                                            style={{ flex: 1 }}
                                        />
                                        {setsData.length > 1 && (
                                            <button type="button" onClick={() => removeSet(index)} style={{ background: 'none', color: 'var(--danger-color)' }}>
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={addSet} className="btn btn-secondary" style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}>
                                    + Add Set
                                </button>
                            </div>
                        ) : (
                            <div className="input-group">
                                <label className="input-label">Duration (minutes)</label>
                                <input
                                    name="duration"
                                    type="number"
                                    className="input-field"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                    placeholder="0"
                                    required
                                />
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                            <Plus size={18} /> Log Exercise
                        </button>
                    </form>
                </div>

                {/* Workout Log Grouped by Muscle Group */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Today's Session</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Flame color="#ff4d4d" size={20} />
                            <span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{totalBurned} kcal</span>
                        </div>
                    </div>

                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {muscleGroups.map(group => {
                            const groupWorkouts = groupedWorkouts[group];
                            if (!groupWorkouts || groupWorkouts.length === 0) return null;

                            return (
                                <div key={group} style={{ marginBottom: '25px' }}>
                                    <div style={{
                                        padding: '8px 15px',
                                        background: 'rgba(204, 255, 0, 0.1)',
                                        borderRadius: '8px',
                                        color: 'var(--primary-color)',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between'
                                    }}>
                                        <span>{group.toUpperCase()}</span>
                                        <span>{groupWorkouts.length} Exercises</span>
                                    </div>
                                    {groupWorkouts.map(w => {
                                        let setsArr = [];
                                        try {
                                            setsArr = w.sets_data ? JSON.parse(w.sets_data) : [];
                                        } catch (e) { }

                                        return (
                                            <div key={w.id} style={{
                                                padding: '12px 15px',
                                                borderBottom: '1px solid var(--glass-border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start'
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{w.exercise_name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                        {w.type === 'strength' ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                                {setsArr.length > 0 ? setsArr.map((s, i) => (
                                                                    <span key={i} style={{ background: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px' }}>
                                                                        S{i + 1}: {s.weight}kg × {s.reps}
                                                                    </span>
                                                                )) : `${w.sets} sets × ${w.reps} reps @ ${w.weight}kg`}
                                                            </div>
                                                        ) : `${w.duration} mins`}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', marginLeft: '15px' }}>
                                                    <div style={{ fontWeight: 'bold', color: '#ff4d4d', fontSize: '0.9rem' }}>{w.calories_burned} kcal</div>
                                                    <button onClick={() => handleDelete(w.id)} style={{ background: 'none', color: 'var(--text-secondary)', marginTop: '5px', opacity: 0.5 }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
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
