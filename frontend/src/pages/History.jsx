import { useState, useEffect } from 'react';
import api from '../api';
import { Calendar, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const History = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState('7days'); // 7days, month
    const [expandedDate, setExpandedDate] = useState(null);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            let startDate, endDate;
            const today = new Date();

            if (range === '7days') {
                startDate = subDays(today, 7).toISOString().split('T')[0];
                endDate = today.toISOString().split('T')[0];
            } else {
                startDate = startOfMonth(today).toISOString().split('T')[0];
                endDate = endOfMonth(today).toISOString().split('T')[0];
            }

            const { data } = await api.get(`/history/history?start_date=${startDate}&end_date=${endDate}`);
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
        const doc = new jsPDF();
        doc.text('Gym Freak - History Report', 14, 15);

        const tableData = history.map(day => [
            day.date,
            Math.round(day.totals.calories),
            Math.round(day.totals.protein) + 'g',
            Math.round(day.totals.carbs) + 'g',
            Math.round(day.totals.fat) + 'g',
            Math.round(day.totals.burned) + ' kcal'
        ]);

        doc.autoTable({
            head: [['Date', 'Calories In', 'Protein', 'Carbs', 'Fat', 'Calories Burned']],
            body: tableData,
            startY: 20
        });

        doc.save('gym_freak_history.pdf');
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
                    </select>
                    <button onClick={downloadPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

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
                                        {expandedDate === day.date ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>

                                {expandedDate === day.date && (
                                    <div style={{ padding: '15px', background: 'rgba(0,0,0,0.2)' }}>
                                        <div className="grid-2">
                                            <div>
                                                <h4 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>Food Log</h4>
                                                {day.foods.length === 0 ? <small>No food logged</small> : (
                                                    <ul style={{ listStyle: 'none', padding: 0 }}>
                                                        {day.foods.map(f => (
                                                            <li key={f.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                                                                <span>{f.foods.name} ({f.quantity}{f.foods.unit})</span>
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
                                                        {day.workouts.map(w => (
                                                            <li key={w.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                                                                <span>{w.exercise_name}</span>
                                                                <span>{w.calories_burned} kcal</span>
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
