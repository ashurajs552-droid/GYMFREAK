require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('./supabase'); // Init Supabase

const userRoutes = require('./routes/user');
const foodRoutes = require('./routes/food');
const workoutRoutes = require('./routes/workout');
const historyRoutes = require('./routes/history');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/user', userRoutes);
app.use('/api/foods', foodRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/history', historyRoutes);

app.get('/api/quotes/random', (req, res) => {
    try {
        const quotes = require('./data/quotes.json');
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        res.json({ quote: randomQuote });
    } catch (err) {
        res.json({ quote: "The only bad workout is the one that didn't happen." });
    }
});

app.get('/', (req, res) => {
    res.send('Gym Freak API (Supabase Edition) is running');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;
