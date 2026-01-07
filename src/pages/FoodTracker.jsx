import { useState, useEffect } from 'react';
import api from '../api';
import { Search, Plus, Trash2, Utensils, Coffee, Sun, Moon, Sunset, Droplets } from 'lucide-react';

const FoodTracker = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [log, setLog] = useState([]);
    const [totals, setTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const [waterLog, setWaterLog] = useState([]);
    const [waterTotal, setWaterTotal] = useState(0);

    // Meal Type State
    const [mealType, setMealType] = useState('breakfast');

    const date = new Date().toISOString().split('T')[0];

    const fetchLog = async () => {
        try {
            const { data } = await api.get(`/foods/log/${date}`);
            setLog(data.entries);
            setTotals(data.totals);

            const { data: waterData } = await api.get(`/water/log/${date}`);
            setWaterLog(waterData.entries);
            setWaterTotal(waterData.total);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchLog();
    }, []);

    // Search Logic
    useEffect(() => {
        const search = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }
            try {
                const { data } = await api.get(`/foods/search?q=${query}`);
                setResults(data);
            } catch (err) {
                console.error(err);
            }
        };
        const timeout = setTimeout(search, 300);
        return () => clearTimeout(timeout);
    }, [query]);

    const handleAdd = async (food, isAI = false) => {
        const quantity = prompt(`Enter quantity for ${food.name} (${food.unit}):`, food.serving_size);
        if (!quantity) return;

        try {
            const payload = {
                date,
                quantity: parseFloat(quantity),
                meal_type: mealType
            };

            if (isAI) {
                payload.food_data = food;
            } else {
                payload.food_id = food.id;
            }

            await api.post('/foods/log', payload);
            setQuery('');
            setResults([]);
            fetchLog();
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to add food';
            alert(msg);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete entry?')) return;
        try {
            await api.delete(`/foods/log/${id}`);
            fetchLog();
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddWater = async () => {
        const amount = prompt('Enter water amount in ml:', '250');
        if (!amount) return;

        try {
            await api.post('/water/log', {
                date,
                amount: parseFloat(amount)
            });
            fetchLog();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add water');
        }
    };

    const handleDeleteWater = async (id) => {
        if (!confirm('Delete water entry?')) return;
        try {
            await api.delete(`/water/log/${id}`);
            fetchLog();
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to filter log by meal type
    const getLogByMeal = (type) => log.filter(entry => entry.meal_type === type);

    const MealSection = ({ title, icon, type }) => {
        const entries = getLogByMeal(type);
        const sectionCalories = entries.reduce((sum, e) => sum + (e.calories * (e.quantity / e.serving_size)), 0);

        return (
            <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '5px', borderBottom: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {icon}
                        <h4 style={{ margin: 0, textTransform: 'capitalize' }}>{title}</h4>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{Math.round(sectionCalories)} kcal</span>
                </div>

                {entries.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', paddingLeft: '34px' }}>No food logged</div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {entries.map(entry => (
                            <li key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', paddingLeft: '34px' }}>
                                <div>
                                    <div style={{ fontWeight: '500' }}>{entry.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {entry.quantity} {entry.unit} • {Math.round(entry.calories * (entry.quantity / entry.serving_size))} kcal
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <Trash2 size={14} />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        );
    };

    return (
        <div className="animate-fade-in">
            <h1 className="page-title">Food Tracker</h1>

            <div className="grid-2" style={{ alignItems: 'start' }}>
                {/* Search Column */}
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Add Food</h3>

                    {/* Meal Type Selector */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '20px',
                        overflowX: 'auto',
                        paddingBottom: '5px',
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none'
                    }}>
                        {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                            <button
                                key={type}
                                onClick={() => setMealType(type)}
                                className={`btn ${mealType === type ? 'btn-primary' : 'btn-secondary'}`}
                                style={{
                                    flex: '0 0 auto',
                                    padding: '10px 20px',
                                    fontSize: '0.9rem',
                                    textTransform: 'capitalize',
                                    borderRadius: '20px'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <div className="input-group" style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-secondary)' }} size={20} />
                        <input
                            className="input-field"
                            style={{ paddingLeft: '40px' }}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search food for ${mealType}...`}
                        />
                    </div>

                    <div style={{ marginTop: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                        {query.length > 2 && results.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <div style={{ color: 'var(--text-secondary)', marginBottom: '15px' }}>No foods found in database</div>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        try {
                                            const { data } = await api.post('/ai/estimate-food', { query });
                                            handleAdd(data, true);
                                        } catch (err) {
                                            alert(err.response?.data?.error || 'AI Estimation failed. Check your API key.');
                                        }
                                    }}
                                    className="btn btn-primary"
                                    style={{ width: '100%', border: '2px dashed rgba(0,0,0,0.2)', background: 'rgba(204, 255, 0, 0.1)', color: 'var(--primary-color)' }}
                                >
                                    ✨ Use AI Smart Estimate for "{query}"
                                </button>
                            </div>
                        )}
                        {results.map(food => (
                            <div key={food.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '15px',
                                borderBottom: '1px solid var(--glass-border)',
                                animation: 'fadeIn 0.3s ease'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold' }}>{food.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {food.calories} kcal • {food.protein}p • {food.carbs}c • {food.fat}f
                                    </div>
                                </div>
                                <button onClick={() => handleAdd(food)} className="btn btn-secondary" style={{ padding: '8px' }}>
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Log Column */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Today's Log</h3>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{Math.round(totals.calories)} kcal</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Intake</div>
                        </div>
                    </div>

                    <MealSection title="Breakfast" type="breakfast" icon={<Coffee size={18} color="#ffe600" />} />
                    <MealSection title="Lunch" type="lunch" icon={<Sun size={18} color="#ff9f43" />} />
                    <MealSection title="Snacks" type="snack" icon={<Utensils size={18} color="#00d2d3" />} />
                    <MealSection title="Dinner" type="dinner" icon={<Moon size={18} color="#5f27cd" />} />

                    {/* Water Section */}
                    <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Droplets size={20} color="#00a8ff" />
                                <h3 style={{ margin: 0 }}>Water Intake</h3>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00a8ff' }}>{waterTotal} ml</div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Daily Total</div>
                            </div>
                        </div>

                        <button onClick={handleAddWater} className="btn btn-secondary" style={{ width: '100%', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'rgba(0, 168, 255, 0.1)', color: '#00a8ff', border: '1px solid rgba(0, 168, 255, 0.2)' }}>
                            <Plus size={16} /> Add Water
                        </button>

                        {waterLog.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {waterLog.map(entry => (
                                    <li key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', paddingLeft: '30px' }}>
                                        <div style={{ fontSize: '0.9rem' }}>{entry.amount} ml</div>
                                        <button onClick={() => handleDeleteWater(entry.id)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FoodTracker;
