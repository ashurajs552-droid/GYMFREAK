import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, ChevronDown, ChevronUp, Download, ShieldCheck, Users } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const History = () => {
    const { isAdmin } = useAuth();
    const [history, setHistory] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7days');
    const [expandedDate, setExpandedDate] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null); // null = all users

    // Fetch all users from database (admin only)
    useEffect(() => {
        if (!isAdmin) return;
        const loadUsers = async () => {
            try {
                const { data } = await api.get('/user/all');
                setAllUsers(data || []);
            } catch (err) {
                console.error('Failed to load users:', err);
            }
        };
        loadUsers();
    }, [isAdmin]);

    // Fetch history data
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                let url = '/history/history';
                if (range !== 'lifetime') {
                    const today = new Date();
                    let startDate, endDate;
                    if (range === '7days') {
                        startDate = subDays(today, 7).toISOString().split('T')[0];
                        endDate = today.toISOString().split('T')[0];
                    } else if (range === 'month') {
                        startDate = startOfMonth(today).toISOString().split('T')[0];
                        endDate = endOfMonth(today).toISOString().split('T')[0];
                    }
                    url += `?start_date=${startDate}&end_date=${endDate}`;
                }
                const { data } = await api.get(url);
                setHistory(data || []);
            } catch (err) {
                console.error('Failed to load history:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [range]);

    // Filter history by selected user
    const filteredHistory = selectedUserId
        ? history.filter(day => day.user_id === selectedUserId || day.user?.id === selectedUserId)
        : history;

    const toggleExpand = (id) => {
        setExpandedDate(expandedDate === id ? null : id);
    };

    const handleUserSelect = (userId) => {
        setSelectedUserId(selectedUserId === userId ? null : userId);
        setExpandedDate(null);
    };

    // PDF Download
    const downloadPDF = () => {
        try {
            const doc = new jsPDF();
            const primaryColor = [204, 255, 0];

            doc.setFontSize(22);
            doc.setTextColor(0, 0, 0);
            doc.text('GYM FREAK - DETAILED REPORT', 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

            const rangeLabel = range === 'month' ? 'This Month' : range === 'lifetime' ? 'Lifetime' : 'Last 7 Days';
            doc.text(`Period: ${rangeLabel}`, 14, 33);

            if (isAdmin && selectedUserId) {
                const u = allUsers.find(u => u.id === selectedUserId);
                if (u) doc.text(`User: ${u.name} (${u.email})`, 14, 38);
            }

            let currentY = selectedUserId ? 45 : 40;

            filteredHistory.forEach((day) => {
                if (currentY > 250) { doc.addPage(); currentY = 20; }

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                const dateStr = format(new Date(day.date), 'EEEE, MMMM d, yyyy');
                const userStr = isAdmin && day.user ? ` - ${day.user.name}` : '';
                doc.text(`${dateStr}${userStr}`, 14, currentY);
                currentY += 5;

                autoTable(doc, {
                    head: [['Calories In', 'Burned', 'Net', 'Water', 'Protein', 'Carbs', 'Fat']],
                    body: [[
                        Math.round(day.totals.calories) + ' kcal',
                        Math.round(day.totals.burned) + ' kcal',
                        Math.round(day.totals.calories - day.totals.burned) + ' kcal',
                        Math.round(day.totals.water) + ' ml',
                        Math.round(day.totals.protein) + 'g',
                        Math.round(day.totals.carbs) + 'g',
                        Math.round(day.totals.fat) + 'g'
                    ]],
                    startY: currentY,
                    styles: { fontSize: 8 },
                    headStyles: { fillColor: primaryColor, textColor: [0, 0, 0] },
                    margin: { left: 14 }
                });
                currentY = doc.lastAutoTable.finalY + 5;

                const foodItems = day.foods.map(f => `${f.foods.name} (${f.quantity}${f.foods.unit}) - ${Math.round(f.calculated_calories)} kcal`).join('\n') || 'No food logged';
                const workoutItems = day.workouts.map(w => `${w.exercise_name} - ${w.calories_burned} kcal`).join('\n') || 'No workouts';
                const waterItems = day.water.map(w => `${format(new Date(w.created_at), 'HH:mm')}: ${w.amount} ml`).join('\n') || 'No water logged';

                autoTable(doc, {
                    head: [['Food', 'Workouts', 'Water']],
                    body: [[foodItems, workoutItems, waterItems]],
                    startY: currentY,
                    styles: { fontSize: 7, cellPadding: 2 },
                    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
                    columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 60 }, 2: { cellWidth: 60 } },
                    margin: { left: 14 }
                });
                currentY = doc.lastAutoTable.finalY + 15;
            });

            doc.save(`gym_freak_report_${range}.pdf`);
        } catch (err) {
            console.error('PDF error:', err);
            alert('Failed to generate PDF.');
        }
    };

    // Chart
    const reversedHistory = [...filteredHistory].reverse();
    const chartData = {
        labels: reversedHistory.map(h => format(new Date(h.date), 'MMM d')),
        datasets: [
            {
                label: 'Calories In',
                data: reversedHistory.map(h => h.totals.calories),
                borderColor: '#ccff00',
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                fill: true, tension: 0.4, yAxisID: 'y',
            },
            {
                label: 'Calories Burned',
                data: reversedHistory.map(h => h.totals.burned),
                borderColor: '#ff4d4d',
                backgroundColor: 'rgba(255, 77, 77, 0.1)',
                fill: true, tension: 0.4, yAxisID: 'y',
            },
            {
                label: 'Water (ml)',
                data: reversedHistory.map(h => h.totals.water),
                borderColor: '#00a8ff',
                backgroundColor: 'rgba(0, 168, 255, 0.1)',
                fill: true, tension: 0.4, yAxisID: 'y1',
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
            y: {
                type: 'linear', display: true, position: 'left',
                title: { display: true, text: 'Calories', color: 'var(--text-secondary)' },
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: 'var(--text-secondary)' },
                suggestedMin: 0, suggestedMax: 4500
            },
            y1: {
                type: 'linear', display: true, position: 'right',
                title: { display: true, text: 'Water (ml)', color: '#00a8ff' },
                grid: { drawOnChartArea: false },
                ticks: { color: '#00a8ff' },
                suggestedMin: 0, suggestedMax: 4500
            },
            x: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: 'var(--text-secondary)' }
            }
        },
        plugins: { legend: { labels: { color: 'var(--text-secondary)' } } }
    };

    // Render
    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <h1 className="page-title" style={{ margin: 0 }}>History Log</h1>
                    {isAdmin && (
                        <span style={{
                            background: 'rgba(204, 255, 0, 0.1)',
                            color: 'var(--primary-color)',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            border: '1px solid var(--primary-color)'
                        }}>
                            <ShieldCheck size={14} /> Admin View
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        className="input-field"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        style={{ width: 'auto', height: '38px', marginTop: '0' }}
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="lifetime">Lifetime</option>
                    </select>
                    <button onClick={downloadPDF} className="btn btn-secondary" title="Download PDF" style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '38px' }}>
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {/* Admin: User Selection List */}
            {isAdmin && (
                <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Users size={16} color="var(--primary-color)" />
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Select User</span>
                        {selectedUserId && (
                            <button
                                onClick={() => { setSelectedUserId(null); setExpandedDate(null); }}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'rgba(255,77,77,0.15)',
                                    color: '#ff4d4d',
                                    border: '1px solid rgba(255,77,77,0.3)',
                                    padding: '3px 10px',
                                    borderRadius: '12px',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer'
                                }}
                            >
                                Show All
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {allUsers.length === 0 ? (
                            <small style={{ color: 'var(--text-secondary)' }}>Loading users...</small>
                        ) : (
                            allUsers.map(user => {
                                const active = selectedUserId === user.id;
                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => handleUserSelect(user.id)}
                                        style={{
                                            background: active ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                            color: active ? '#000' : 'var(--text-secondary)',
                                            border: active ? '2px solid var(--primary-color)' : '1px solid var(--glass-border)',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            fontWeight: active ? 'bold' : '500'
                                        }}
                                    >
                                        {user.name || user.email}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Chart */}
            {!loading && filteredHistory.length > 0 && (
                <div className="card" style={{ marginBottom: '20px', height: '350px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Progress Overview</h3>
                    <div style={{ height: '280px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}

            {/* History List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading history...</div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    {filteredHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
                            No history found for this period.
                        </div>
                    ) : (
                        filteredHistory.map(day => {
                            const itemKey = isAdmin ? `${day.date}_${day.user_id || day.user?.email}` : day.date;
                            return (
                                <div key={itemKey} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    {/* Row Header */}
                                    <div
                                        onClick={() => toggleExpand(itemKey)}
                                        style={{
                                            padding: '15px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            background: expandedDate === itemKey ? 'rgba(255,255,255,0.03)' : 'transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Calendar size={18} color="var(--primary-color)" />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 'bold' }}>{format(new Date(day.date), 'EEE, MMM d, yyyy')}</span>
                                                {isAdmin && day.user && (
                                                    <small style={{ color: 'var(--primary-color)', fontSize: '0.75rem' }}>
                                                        {day.user.name} ({day.user.email})
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '15px' }} className="history-summary-stats">
                                                <span>In: <span style={{ color: '#fff' }}>{Math.round(day.totals.calories)}</span></span>
                                                <span>Burn: <span style={{ color: '#ff4d4d' }}>{Math.round(day.totals.burned)}</span></span>
                                                <span>Water: <span style={{ color: '#00a8ff' }}>{Math.round(day.totals.water)}ml</span></span>
                                            </div>
                                            {expandedDate === itemKey ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {expandedDate === itemKey && (
                                        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.15)', borderTop: '1px solid var(--glass-border)' }}>
                                            <div className="grid-3">
                                                {/* Food */}
                                                <div>
                                                    <h4 style={{ marginBottom: '12px', color: 'var(--primary-color)', fontSize: '0.9rem' }}>🍽️ Food Log</h4>
                                                    {day.foods.length === 0 ? (
                                                        <small style={{ color: 'var(--text-secondary)' }}>No food logged</small>
                                                    ) : (
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                            {day.foods.map(f => (
                                                                <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span>{f.foods.name} ({f.quantity}{f.foods.unit})</span>
                                                                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                                                            {format(new Date(f.created_at), 'HH:mm')} • {f.meal_type}
                                                                        </small>
                                                                    </div>
                                                                    <span style={{ fontWeight: '600' }}>{Math.round(f.calculated_calories)} kcal</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {/* Workouts */}
                                                <div>
                                                    <h4 style={{ marginBottom: '12px', color: '#ff4d4d', fontSize: '0.9rem' }}>💪 Workouts</h4>
                                                    {day.workouts.length === 0 ? (
                                                        <small style={{ color: 'var(--text-secondary)' }}>No workouts</small>
                                                    ) : (
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                            {day.workouts.map(w => {
                                                                let setsArr = [];
                                                                try { setsArr = w.sets_data ? JSON.parse(w.sets_data) : []; } catch (e) { }
                                                                return (
                                                                    <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <span style={{ fontWeight: '500' }}>{w.exercise_name}</span>
                                                                            <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                                                                {format(new Date(w.created_at), 'HH:mm')}
                                                                            </small>
                                                                            {w.type === 'strength' && (
                                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                                                                                    {setsArr.length > 0 ? setsArr.map((s, i) => (
                                                                                        <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: '3px', fontSize: '0.65rem' }}>
                                                                                            {s.weight}kg×{s.reps}
                                                                                        </span>
                                                                                    )) : (w.reps && w.weight ? (
                                                                                        <span style={{ fontSize: '0.7rem' }}>{w.sets} sets × {w.reps} reps @ {w.weight}kg</span>
                                                                                    ) : null)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span style={{ fontWeight: 'bold' }}>{w.calories_burned} kcal</span>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    )}
                                                </div>

                                                {/* Water */}
                                                <div>
                                                    <h4 style={{ marginBottom: '12px', color: '#00a8ff', fontSize: '0.9rem' }}>💧 Water</h4>
                                                    {day.water.length === 0 ? (
                                                        <small style={{ color: 'var(--text-secondary)' }}>No water logged</small>
                                                    ) : (
                                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                                            {day.water.map(w => (
                                                                <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.85rem' }}>
                                                                    <span style={{ color: 'var(--text-secondary)' }}>{format(new Date(w.created_at), 'HH:mm')}</span>
                                                                    <span style={{ fontWeight: '600' }}>{w.amount} ml</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
