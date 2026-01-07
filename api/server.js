require('dotenv').config();
const express = require('express');
const cors = require('cors');
require('./supabase'); // Init Supabase

const userRoutes = require('./routes/user');
const foodRoutes = require('./routes/food');
const workoutRoutes = require('./routes/workout');
const historyRoutes = require('./routes/history');
const aiRoutes = require('./routes/ai');
const waterRoutes = require('./routes/water');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/user', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/water', waterRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Gym Freak API is healthy' });
});

app.get('/api/quotes/random', (req, res) => {
    try {
        const quotes = require('./data/quotes.json');
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        res.json({ quote: randomQuote });
    } catch (err) {
        res.json({ quote: "The only bad workout is the one that didn't happen." });
    }
});

app.get('/api', (req, res) => {
    res.send('Gym Freak API (Supabase Edition) is running');
});

app.get('/', (req, res) => {
    res.send('Gym Freak API is running');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
