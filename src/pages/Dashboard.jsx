import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Doughnut, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Filler
} from 'chart.js';
import { Flame, Target, ArrowRight, TrendingUp, Activity, Zap } from 'lucide-react';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Filler
);

// Static coach insights based on progress
const getCoachInsight = (remaining, proteinPercent, goal) => {
    const insights = [];

    if (remaining > 500) {
        insights.push("You're well under your calorie goal. Make sure to fuel up properly to maintain muscle mass!");
    } else if (remaining < -200) {
        insights.push("You've exceeded your target. Consider a light cardio session or plan better for tomorrow.");
    } else if (remaining >= 0 && remaining <= 200) {
        insights.push("You're right on track! Keep hitting those macros and stay consistent.");
    } else {
        insights.push("Good progress today! Keep pushing towards your goals.");
    }

    if (proteinPercent < 50) {
        insights.push("Focus on getting more protein in your next meal.");
    } else if (proteinPercent >= 80) {
        insights.push("Great job hitting your protein target!");
    }

    return insights[0];
};

const proTips = [
    "Consistency is key. Even on rest days, try to hit your protein targets to support recovery.",
    "Stay hydrated! Aim for at least 8 glasses of water daily.",
    "Sleep 7-9 hours for optimal muscle recovery and fat loss.",
    "Progressive overload is crucial - try to increase weight or reps each week.",
    "Don't skip warm-ups - they prevent injuries and improve performance.",
    "Meal prep on weekends to stay on track during busy weekdays."
];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [greeting, setGreeting] = useState('');
    const [showDetails, setShowDetails] = useState(null);
    const [proTip] = useState(proTips[Math.floor(Math.random() * proTips.length)]);

    const fetchStats = async () => {
        try {
            setError(null);
            const { data: profileData } = await api.get('/user/profile');
            const date = new Date().toISOString().split('T')[0];
            const { data: foodData } = await api.get(`/foods/log/${date}`);
            const { data: workoutData } = await api.get(`/workouts/log/${date}`);

            // Fetch last 7 days for chart
            const endDate = date;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);
            const startDateStr = startDate.toISOString().split('T')[0];

            let historyData = [];
            try {
                const { data } = await api.get(`/history/history?start_date=${startDateStr}&end_date=${endDate}`);
                historyData = data || [];
            } catch (histErr) {
                console.warn('History fetch failed:', histErr);
            }

            const currentStats = {
                user: profileData.user || {},
                targets: profileData.metrics?.targets || { calories: 2000, protein: 150, carbs: 250, fat: 70 },
                consumed: foodData.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 },
                burned: workoutData.totalBurned || 0
            };

            setStats(currentStats);
            setHistory(Array.isArray(historyData) ? historyData.reverse() : []);
        } catch (err) {
            console.error('Dashboard error:', err);
            setError('Failed to load dashboard. Please refresh.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning');
        else if (hour < 18) setGreeting('Good Afternoon');
        else setGreeting('Good Evening');

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                color: 'var(--primary-color)',
                fontSize: '1rem',
                fontWeight: 'bold'
            }}>
                <div className="animate-pulse">Loading Dashboard...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <p style={{ color: 'var(--danger-color)', marginBottom: '20px' }}>{error}</p>
                <button onClick={() => { setLoading(true); fetchStats(); }} className="btn btn-primary">
                    Retry
                </button>
            </div>
        );
    }

    if (!stats) {
        return (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                Unable to load data. Please try again.
            </div>
        );
    }

    const targets = stats.targets;
    const consumed = stats.consumed;
    const burned = stats.burned;
    const user = stats.user;

    const netCalories = Math.round((consumed.calories || 0) - burned);
    const remaining = (targets.calories || 2000) - netCalories;
    const userName = user.name || user.email?.split('@')[0] || 'Athlete';
    const proteinPercent = targets.protein ? Math.round((consumed.protein / targets.protein) * 100) : 0;

    const coachInsight = getCoachInsight(remaining, proteinPercent, user.goal);

    const macroData = {
        labels: ['Protein', 'Carbs', 'Fat'],
        datasets: [{
            data: [consumed.protein || 0, consumed.carbs || 0, consumed.fat || 0],
            backgroundColor: ['#00f0ff', '#ff4d4d', '#ffe600'],
            borderColor: ['#00f0ff', '#ff4d4d', '#ffe600'],
            borderWidth: 1,
        }]
    };

    // Chart Data
    const chartData = {
        labels: history.length > 0
            ? history.map(h => new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' }))
            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Consumed',
                data: history.length > 0 ? history.map(h => h.totals?.calories || 0) : [0, 0, 0, 0, 0, 0, 0],
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Burned',
                data: history.length > 0 ? history.map(h => h.totals?.burned || 0) : [0, 0, 0, 0, 0, 0, 0],
                borderColor: '#ff4d4d',
                backgroundColor: 'rgba(255, 77, 77, 0.1)',
                fill: true,
                tension: 0.4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: { color: 'var(--text-secondary)', font: { size: 10 } }
            },
            tooltip: { mode: 'index', intersect: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: 'var(--text-secondary)', font: { size: 10 } }
            },
            x: {
                grid: { display: false },
                ticks: { color: 'var(--text-secondary)', font: { size: 10 } }
            }
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Welcome Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', marginBottom: '4px', lineHeight: '1.3' }}>
                    {greeting}, <span style={{ color: 'var(--primary-color)' }}>{userName}</span>
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            {/* Main Stats */}
            <div className="grid-3">
                {/* Calories Card */}
                <div className="card" onClick={() => setShowDetails(showDetails === 'calories' ? null : 'calories')}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>NET CALORIES</span>
                        <Target color="var(--primary-color)" size={18} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', marginBottom: '4px' }}>
                        {netCalories}
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> / {targets.calories}</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min((netCalories / targets.calories) * 100, 100)}%` }}></div>
                    </div>
                    <p style={{ marginTop: '8px', fontSize: '0.85rem', color: remaining > 0 ? 'var(--primary-color)' : '#ff4d4d', fontWeight: '600' }}>
                        {remaining > 0 ? `${remaining} kcal left` : `${Math.abs(remaining)} over`}
                    </p>
                </div>

                {/* Burned Card */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>BURNED</span>
                        <Flame color="#ff4d4d" size={18} />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ff4d4d' }}>
                        {burned}
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}> kcal</span>
                    </div>
                    <Link to="/workout" style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '12px', color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: '600' }}>
                        Log Workout <ArrowRight size={14} />
                    </Link>
                </div>

                {/* Macros Card */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>MACROS</span>
                        <div style={{ width: '28px', height: '28px' }}>
                            <Doughnut data={macroData} options={{ plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: '70%' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                                <span style={{ color: '#00f0ff', fontWeight: '600' }}>Protein</span>
                                <span>{Math.round(consumed.protein)}g / {targets.protein}g</span>
                            </div>
                            <div className="progress-bar" style={{ height: '5px' }}>
                                <div className="progress-fill" style={{ width: `${Math.min((consumed.protein / targets.protein) * 100, 100)}%`, background: '#00f0ff' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                                <span style={{ color: '#ff4d4d', fontWeight: '600' }}>Carbs</span>
                                <span>{Math.round(consumed.carbs)}g / {targets.carbs}g</span>
                            </div>
                            <div className="progress-bar" style={{ height: '5px' }}>
                                <div className="progress-fill" style={{ width: `${Math.min((consumed.carbs / targets.carbs) * 100, 100)}%`, background: '#ff4d4d' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '3px' }}>
                                <span style={{ color: '#ffe600', fontWeight: '600' }}>Fat</span>
                                <span>{Math.round(consumed.fat)}g / {targets.fat}g</span>
                            </div>
                            <div className="progress-bar" style={{ height: '5px' }}>
                                <div className="progress-fill" style={{ width: `${Math.min((consumed.fat / targets.fat) * 100, 100)}%`, background: '#ffe600' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart & Coach Section */}
            <div className="grid-2" style={{ marginTop: '20px' }}>
                {/* Weekly Progress Chart */}
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <TrendingUp size={18} color="var(--primary-color)" />
                        <h3 style={{ margin: 0, fontSize: '1rem' }}>Weekly Progress</h3>
                    </div>
                    <div style={{ height: '200px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Coach's Insight - No AI */}
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(204, 255, 0, 0.03), rgba(0, 240, 255, 0.03))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                        <div style={{ padding: '8px', background: 'var(--primary-color)', borderRadius: '10px' }}>
                            <Zap size={18} color="#000" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1rem' }}>Coach's Insight</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily Motivation</span>
                        </div>
                    </div>
                    <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: '16px' }}>
                        "{coachInsight}"
                    </p>
                    <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: '10px', fontSize: '0.85rem' }}>
                        <strong>💡 Pro Tip:</strong> {proTip}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
