import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, ChevronDown, ChevronUp, Download } from 'lucide-react';
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
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7days'); // 7days, month
    const [expandedDate, setExpandedDate] = useState(null);

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

    const toggleExpand = (date) => {
        setExpandedDate(expandedDate === date ? null : date);
    };

    const downloadPDF = () => {
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

            history.forEach((day, index) => {
                // Check for new page
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(0, 0, 0);
                doc.text(format(new Date(day.date), 'EEEE, MMMM d, yyyy'), 14, currentY);
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

    const chartData = {
        labels: [...history].reverse().map(h => format(new Date(h.date), 'MMM d')),
        datasets: [
            {
                label: 'Calories In',
                data: [...history].reverse().map(h => h.totals.calories),
                borderColor: '#ccff00',
                backgroundColor: 'rgba(204, 255, 0, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Calories Burned',
                data: [...history].reverse().map(h => h.totals.burned),
                borderColor: '#ff4d4d',
                backgroundColor: 'rgba(255, 77, 77, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Water (ml)',
                data: [...history].reverse().map(h => h.totals.water),
                borderColor: '#00a8ff',
                backgroundColor: 'rgba(0, 168, 255, 0.1)',
                fill: true,
                tension: 0.4,
                yAxisID: 'y1',
            }
        ]
    };

    const chartOptions = {
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
                suggestedMax: 4500 // Match max to align grid lines
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="page-title">History Log</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        className="input-field"
                        value={range}
                        onChange={(e) => setRange(e.target.value)}
                        style={{ width: 'auto' }}
                    >
                        <option value="7days">Last 7 Days</option>
                        <option value="month">This Month</option>
                        <option value="lifetime">Lifetime</option>
                    </select>
                    <button onClick={downloadPDF} className="btn btn-secondary" title="Download PDF Report" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            {!loading && history.length > 0 && (
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
                    {history.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>No history found for this period.</div>
                    ) : (
                        history.map(day => (
                            <div key={day.date} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <div
                                    onClick={() => toggleExpand(day.date)}
                                    style={{
                                        padding: '15px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: expandedDate === day.date ? 'var(--surface-hover)' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Calendar size={18} color="var(--primary-color)" />
                                        <span style={{ fontWeight: 'bold' }}>{format(new Date(day.date), 'EEE, MMM d')}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span>In: <span style={{ color: '#fff' }}>{Math.round(day.totals.calories)}</span></span>
                                        <span>Burn: <span style={{ color: '#ff4d4d' }}>{Math.round(day.totals.burned)}</span></span>
                                        <span>Water: <span style={{ color: '#00a8ff' }}>{Math.round(day.totals.water)}ml</span></span>
                                        {expandedDate === day.date ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {expandedDate === day.date && (
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
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default History;
