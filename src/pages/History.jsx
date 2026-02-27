import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Calendar, ChevronDown, ChevronUp, Download, ShieldCheck } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7days'); // 7days, month
    const [expandedDate, setExpandedDate] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

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
            setHistory(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [range]);

    const toggleExpand = (id) => {
        setExpandedDate(expandedDate === id ? null : id);
    };

    const downloadPDF = () => {
        // ... (existing download logic is fine, it uses the 'history' state which we filter locally for display but keep full for export if needed, 
        // or we can filter it for export too if preferred. Usually search is for view. 
        // Let's filter it for display first)
        try {
            const doc = new jsPDF();
            const primaryColor = [204, 255, 0];
            const secondaryColor = [0, 168, 255];
            const dangerColor = [255, 77, 77];

            doc.setFontSize(22);
            doc.setTextColor(0, 0, 0);
            doc.text('GYM FREAK - DETAILED REPORT', 14, 20);

            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
            let rangeLabel = 'Last 7 Days';
            if (range === 'month') rangeLabel = 'This Month';
            if (range === 'lifetime') rangeLabel = 'Lifetime Records';
            doc.text(`Range: ${rangeLabel}`, 14, 33);

            let currentY = 40;

            const dataToExport = isAdmin ? history.filter(h =>
                !searchTerm ||
                (h.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (h.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
            ) : history;

            dataToExport.forEach((day, index) => {
                // Check for new page
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text(`${format(new Date(day.date), 'EEEE, MMMM d, yyyy')}${isAdmin && day.user ? ` - ${day.user.name}` : ''}`, 14, currentY);
                currentY += 5;

                // Daily Summary Table
                autoTable(doc, {
                    head: [['Calories In', 'Calories Burned', 'Net', 'Water', 'Protein', 'Carbs', 'Fat']],
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

                // Details Row (Food, Workout, Water)
                const foodItems = day.foods.map(f => `${f.foods.name} (${f.quantity}${f.foods.unit}) - ${Math.round(f.calculated_calories)} kcal`).join('\n') || 'No food logged';
                const workoutItems = day.workouts.map(w => `${w.exercise_name} - ${w.calories_burned} kcal`).join('\n') || 'No workouts logged';
                const waterItems = day.water.map(w => `${format(new Date(w.created_at), 'HH:mm')}: ${w.amount} ml`).join('\n') || 'No water logged';

                autoTable(doc, {
                    head: [['Food Details', 'Workout Details', 'Water Details']],
                    body: [[foodItems, workoutItems, waterItems]],
                    startY: currentY,
                    styles: { fontSize: 7, cellPadding: 2 },
                    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
                    columnStyles: {
                        0: { cellWidth: 60 },
                        1: { cellWidth: 60 },
                        2: { cellWidth: 60 }
                    },
                    margin: { left: 14 }
                });

                currentY = doc.lastAutoTable.finalY + 15;
            });

            doc.save(`gym_freak_detailed_report_${range}.pdf`);
        } catch (err) {
            console.error('PDF Generation Error:', err);
            alert('Failed to generate PDF. Please try again.');
        }
    };

    const filteredHistory = isAdmin ? history.filter(day => {
        const term = searchTerm.toLowerCase().trim();
        return !term ||
            (day.user?.name || '').toLowerCase().includes(term) ||
            (day.user?.email || '').toLowerCase().includes(term);
    }) : history;

    const chartData = {
        labels: [...filteredHistory].reverse().map(h => format(new Date(h.date), 'MMM d')),
        datasets: [
            {
                label: 'Calories In',
                data: [...filteredHistory].reverse().map(h => h.totals.calories),
                borderColor: '#ccff00',
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Calories Burned',
                data: [...filteredHistory].reverse().map(h => h.totals.burned),
                borderColor: '#ff4d4d',
                backgroundColor: 'rgba(255, 77, 77, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Water (ml)',
                data: [...filteredHistory].reverse().map(h => h.totals.water),
                borderColor: '#00a8ff',
                backgroundColor: 'rgba(0, 168, 255, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y1',
            }
        ]
    };

    const chartOptions = {
        // ... (existing chart options are fine)
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: { display: true, text: 'Calories', color: 'var(--text-secondary)' },
                grid: { color: 'rgba(255,255,255,0.1)', drawOnChartArea: true },
                ticks: { color: 'var(--text-secondary)' },
                suggestedMin: 0,
                suggestedMax: 4500
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: { display: true, text: 'Water (ml)', color: '#00a8ff' },
                grid: { drawOnChartArea: false },
                ticks: { color: '#00a8ff' },
                suggestedMin: 0,
                suggestedMax: 4500
            },
            x: {
                grid: { color: 'rgba(255,255,255,0.1)', display: true },
                ticks: { color: 'var(--text-secondary)' }
            }
        },
        plugins: {
            legend: {
                labels: { color: 'var(--text-secondary)' }
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
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
                        <button onClick={downloadPDF} className="btn btn-secondary" title="Download PDF Report" style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '38px' }}>
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </div>

                {isAdmin && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <input
                                    type="text"
                                    placeholder="Search users by name or email..."
                                    className="input-field"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        height: '40px',
                                        marginTop: '0',
                                        paddingLeft: '15px'
                                    }}
                                />
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>

                        {!loading && history.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                <small style={{ color: 'var(--text-secondary)', marginRight: '5px' }}>Quick Select:</small>
                                {Array.from(new Set(history.map(h => h.user?.email))).filter(Boolean).map(email => {
                                    const user = history.find(h => h.user?.email === email)?.user;
                                    const isActive = searchTerm.toLowerCase() === (user?.name || '').toLowerCase() || searchTerm.toLowerCase() === (email || '').toLowerCase();
                                    return (
                                        <button
                                            key={email}
                                            onClick={() => setSearchTerm(isActive ? '' : user?.name || email)}
                                            style={{
                                                background: isActive ? 'var(--primary-color)' : 'rgba(255,255,255,0.05)',
                                                color: isActive ? '#000' : 'var(--text-secondary)',
                                                border: isActive ? 'none' : '1px solid var(--glass-border)',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.75rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: isActive ? 'bold' : '500',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            {user?.name || email}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!loading && filteredHistory.length > 0 && (
                <div className="card" style={{ marginBottom: '20px', height: '350px' }}>
                    <h3 style={{ marginBottom: '15px' }}>Progress Overview</h3>
                    <div style={{ height: '280px' }}>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                </div>
            )}

            {loading ? (
                <div>Loading history...</div>
            ) : (
                <div className="card">
                    {filteredHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                            {searchTerm ? `No users matching "${searchTerm}" found in this period.` : 'No history found for this period.'}
                        </div>
                    ) : (
                        filteredHistory.map(day => {
                            const itemKey = isAdmin ? `${day.date}_${day.user?.email}` : day.date;
                            return (
                                <div key={itemKey} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <div
                                        onClick={() => toggleExpand(itemKey)}
                                        style={{
                                            padding: '15px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            background: expandedDate === itemKey ? 'var(--surface-hover)' : 'transparent'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Calendar size={18} color="var(--primary-color)" />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 'bold' }}>{format(new Date(day.date), 'EEE, MMM d')}</span>
                                                {isAdmin && day.user && (
                                                    <small style={{ color: 'var(--primary-color)', fontSize: '0.7rem' }}>
                                                        User: {day.user.name} ({day.user.email})
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                            <div style={{ display: 'flex', gap: '15px' }} className="history-summary-stats">
                                                <span>In: <span style={{ color: '#fff' }}>{Math.round(day.totals.calories)}</span></span>
                                                <span>Burn: <span style={{ color: '#ff4d4d' }}>{Math.round(day.totals.burned)}</span></span>
                                                <span>Water: <span style={{ color: '#00a8ff' }}>{Math.round(day.totals.water)}ml</span></span>
                                            </div>
                                            {expandedDate === itemKey ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    {expandedDate === itemKey && (
                                        <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)' }}>
                                            <div className="grid-3">
                                                <div>
                                                    <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>Food Log</h4>
                                                    {day.foods.length === 0 ? <small>No food logged</small> : (
                                                        <ul style={{ listStyle: 'none', padding: 0 }}>
                                                            {day.foods.map(f => (
                                                                <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                        <span>{f.foods.name} ({f.quantity}{f.foods.unit})</span>
                                                                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                                                                            {format(new Date(f.created_at), 'HH:mm')} • {f.meal_type}
                                                                        </small>
                                                                    </div>
                                                                    <span>{Math.round(f.calculated_calories)} kcal</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 style={{ marginBottom: '10px', color: '#ff4d4d' }}>Workouts</h4>
                                                    {day.workouts.length === 0 ? <small>No workouts</small> : (
                                                        <ul style={{ listStyle: 'none', padding: 0 }}>
                                                            {day.workouts.map(w => {
                                                                let setsArr = [];
                                                                try {
                                                                    setsArr = w.sets_data ? JSON.parse(w.sets_data) : [];
                                                                } catch (e) { }

                                                                return (
                                                                    <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
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
                                                                                    )) : (w.reps && w.weight ? <span style={{ fontSize: '0.7rem' }}>{w.sets} sets × {w.reps} reps @ {w.weight}kg</span> : null)}
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
                                                <div>
                                                    <h4 style={{ marginBottom: '10px', color: '#00a8ff' }}>Water</h4>
                                                    {day.water.length === 0 ? <small>No water logged</small> : (
                                                        <ul style={{ listStyle: 'none', padding: 0 }}>
                                                            {day.water.map(w => (
                                                                <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                                                                    <span>Entry {format(new Date(w.created_at), 'HH:mm')}</span>
                                                                    <span>{w.amount} ml</span>
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
