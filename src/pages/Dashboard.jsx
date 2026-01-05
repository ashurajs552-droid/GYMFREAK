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
import { Flame, Target, ArrowRight, Info, TrendingUp, Activity } from 'lucide-react';

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

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState('');
    const [showDetails, setShowDetails] = useState(null);
    const [quote, setQuote] = useState('');

    const [aiInsight, setAiInsight] = useState('');

    const fetchStats = async () => {
        try {
            const { data: profileData } = await api.get('/user/profile');
            const date = new Date().toISOString().split('T')[0];
            const { data: foodData } = await api.get(`/foods/log/${date}`);
            const { data: workoutData } = await api.get(`/workouts/log/${date}`);

            // Fetch last 7 days for chart
            const endDate = date;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);
            const startDateStr = startDate.toISOString().split('T')[0];
            const { data: historyData } = await api.get(`/history/history?start_date=${startDateStr}&end_date=${endDate}`);

            // Fetch random quote
            const { data: quoteData } = await api.get('/quotes/random');
            setQuote(quoteData.quote);

            const currentStats = {
                user: profileData.user,
                targets: profileData.metrics.targets,
                consumed: foodData.totals,
                burned: workoutData.totalBurned
            };
            setStats(currentStats);
            setHistory(historyData.reverse()); // Chronological for chart

            // Fetch AI Insight
            try {
                const { data: insightData } = await api.post('/ai/coach-insight', { stats: currentStats });
                setAiInsight(insightData.insight);
            } catch (aiErr) {
                console.warn('AI Insight failed:', aiErr);
            }
        } catch (err) {
            console.error(err);
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

    if (loading || !stats) return (
        <div className="container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            color: 'var(--primary-color)',
            fontSize: '1.2rem',
            fontWeight: 'bold'
        }}>
            <div className="animate-pulse">Loading Your Dashboard...</div>
        </div>
    );

    const targets = stats.targets || { calories: 2000, protein: 150, carbs: 250, fat: 70 };
    const consumed = stats.consumed || { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const burned = stats.burned || 0;
    const user = stats.user || {};

    const netCalories = Math.round((consumed.calories || 0) - burned);
    const remaining = (targets.calories || 2000) - netCalories;
    const userName = user.name || user.email?.split('@')[0] || 'Athlete';

    const macroData = {
        labels: ['Protein', 'Carbs', 'Fat'],
        datasets: [{
            data: [consumed.protein, consumed.carbs, consumed.fat],
            backgroundColor: ['#00f0ff', '#ff4d4d', '#ffe600'],
            borderColor: ['#00f0ff', '#ff4d4d', '#ffe600'],
            borderWidth: 1,
        }]
    };

    // Chart Data
    const chartData = {
        labels: history.map(h => new Date(h.date).toLocaleDateString('en-US', { weekday: 'short' })),
        datasets: [
            {
                label: 'Consumed',
                data: history.map(h => h.totals.calories),
                borderColor: 'var(--primary-color)',
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: 'Burned',
                data: history.map(h => h.totals.burned),
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
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                    <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', marginBottom: '5px', lineHeight: '1.2' }}>
                        {greeting}, <span style={{ color: 'var(--primary-color)' }}>{userName}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'clamp(0.9rem, 3vw, 1rem)' }}>Ready to crush your goals today?</p>
                </div>
                <div style={{ textAlign: 'right', color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <div style={{ fontSize: 'clamp(1rem, 3vw, 1.2rem)', fontWeight: 'bold' }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid-3">
                {/* Calories Card */}
                <div className="card"
                    style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
                    onClick={() => setShowDetails(showDetails === 'calories' ? null : 'calories')}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>NET CALORIES</h3>
                        <Target color="var(--primary-color)" size={20} />
                    </div>
                    <div style={{ fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', fontWeight: '900', marginBottom: '5px' }}>
                        {netCalories} <span style={{ fontSize: 'clamp(0.8rem, 3vw, 1rem)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ {targets.calories}</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${Math.min((netCalories / targets.calories) * 100, 100)}%` }}></div>
                    </div>
                    <p style={{ marginTop: '10px', fontSize: '0.9rem', color: remaining > 0 ? 'var(--primary-color)' : '#ff4d4d', fontWeight: '600' }}>
                        {remaining > 0 ? `${remaining} kcal remaining` : `${Math.abs(remaining)} kcal over limit`}
                    </p>
                    {showDetails === 'calories' && (
                        <div style={{ marginTop: '15px', padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }}>
                            <strong>Detailed Breakdown:</strong><br />
                            Intake: {Math.round(consumed.calories)} kcal<br />
                            Burned: {Math.round(burned)} kcal<br />
                            Net: {netCalories} kcal
                        </div>
                    )}
                </div>

                {/* Burned Card */}
                <div className="card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowDetails(showDetails === 'burned' ? null : 'burned')}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>CALORIES BURNED</h3>
                        <Flame color="#ff4d4d" size={20} />
                    </div>
                    <div style={{ fontSize: 'clamp(1.8rem, 8vw, 2.5rem)', fontWeight: '900', color: '#ff4d4d' }}>
                        {burned} <span style={{ fontSize: 'clamp(0.8rem, 3vw, 1rem)', color: 'var(--text-secondary)', fontWeight: 'normal' }}>kcal</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>From workouts & activity</p>
                    <Link to="/workout" style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '15px', color: 'var(--primary-color)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}>
                        Log Workout <ArrowRight size={14} />
                    </Link>
                    {showDetails === 'burned' && (
                        <div style={{ marginTop: '15px', padding: '12px', background: 'var(--bg-color)', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }}>
                            <strong>Calculation:</strong><br />
                            Based on MET values for your weight ({user.weight}kg).
                        </div>
                    )}
                </div>

                {/* Macros Card */}
                <div className="card"
                    style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
                    onClick={() => setShowDetails(showDetails === 'macros' ? null : 'macros')}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>MACROS</h3>
                        <div style={{ width: '36px', height: '36px' }}>
                            <Doughnut data={macroData} options={{ plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: '70%', responsive: true, maintainAspectRatio: true }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>Protein</span>
                                <span>{Math.round(consumed.protein)}g / {targets.protein}g</span>
                            </div>
                            <div className="progress-bar" style={{ height: '6px', background: 'rgba(0, 240, 255, 0.1)' }}>
                                <div className="progress-fill" style={{ width: `${Math.min((consumed.protein / targets.protein) * 100, 100)}%`, background: '#00f0ff' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                <span style={{ color: '#ff4d4d', fontWeight: 'bold' }}>Carbs</span>
                                <span>{Math.round(consumed.carbs)}g / {targets.carbs}g</span>
                            </div>
                            <div className="progress-bar" style={{ height: '6px', background: 'rgba(255, 77, 77, 0.1)' }}>
                                <div className="progress-fill" style={{ width: `${Math.min((consumed.carbs / targets.carbs) * 100, 100)}%`, background: '#ff4d4d' }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                                <span style={{ color: '#ffe600', fontWeight: 'bold' }}>Fat</span>
                                <span>{Math.round(consumed.fat)}g / {targets.fat}g</span>
                            </div>
                            <div className="progress-bar" style={{ height: '6px', background: 'rgba(255, 230, 0, 0.1)' }}>
                                <div className="progress-fill" style={{ width: `${Math.min((consumed.fat / targets.fat) * 100, 100)}%`, background: '#ffe600' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid-2" style={{ marginTop: '20px' }}>
                {/* Weekly Progress Chart */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TrendingUp size={20} color="var(--primary-color)" /> Weekly Progress
                        </h3>
                    </div>
                    <div style={{ height: '250px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>

                {/* Coach's Insight */}
                <div className="card animate-fade-in" style={{
                    background: 'linear-gradient(135deg, rgba(204, 255, 0, 0.05), rgba(0, 240, 255, 0.05))',
                    border: '1px solid rgba(204, 255, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <div style={{ padding: '10px', background: 'var(--primary-color)', borderRadius: '12px' }}>
                            <User size={24} color="#000" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0 }}>Coach's Insight</h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI-Powered Guidance</p>
                        </div>
                    </div>
                    <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                        "{aiInsight || (remaining > 500
                            ? "You're well under your calorie goal. Make sure to fuel up properly to maintain muscle mass!"
                            : remaining < -200
                                ? "You've exceeded your target. Consider a light cardio session to balance it out."
                                : "You're right on track! Keep hitting those macros and stay consistent.")}"
                    </p>
                    <div style={{ marginTop: '20px', padding: '15px', background: 'var(--surface-hover)', borderRadius: '12px', fontSize: '0.9rem' }}>
                        <strong>Pro Tip:</strong> Consistency is key. Even on rest days, try to hit your protein targets to support recovery.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
