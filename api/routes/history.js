const express = require('express');
const { supabase } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get History (Food & Workouts)
router.get('/history', authenticateToken, async (req, res) => {
    const { start_date, end_date } = req.query;

    // Get Food Logs
    const { data: foodLogs, error: foodError } = await supabase
        .from('food_entries')
        .select(`
            id, date, quantity, meal_type,
            foods (name, calories, protein, carbs, fat, unit, serving_size)
        `)
        .eq('user_id', req.user.id)
        .gte('date', start_date)
        .lte('date', end_date)
        .order('date', { ascending: false });

    if (foodError) return res.status(500).json({ error: foodError.message });

    // Get Workout Logs
    const { data: workoutLogs, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', req.user.id)
        .gte('date', start_date)
        .lte('date', end_date)
        .order('date', { ascending: false });

    if (workoutError) return res.status(500).json({ error: workoutError.message });

    // Group by Date
    const history = {};

    // Process Foods
    foodLogs.forEach(entry => {
        const date = entry.date;
        if (!history[date]) history[date] = { date, foods: [], workouts: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0 } };

        const ratio = entry.quantity / entry.foods.serving_size;
        const calories = entry.foods.calories * ratio;

        history[date].foods.push({
            ...entry,
            calculated_calories: calories
        });

        history[date].totals.calories += calories;
        history[date].totals.protein += entry.foods.protein * ratio;
        history[date].totals.carbs += entry.foods.carbs * ratio;
        history[date].totals.fat += entry.foods.fat * ratio;
    });

    // Process Workouts
    workoutLogs.forEach(entry => {
        const date = entry.date;
        if (!history[date]) history[date] = { date, foods: [], workouts: [], totals: { calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0 } };

        history[date].workouts.push(entry);
        history[date].totals.burned += entry.calories_burned;
    });

    // Convert to array and sort
    const historyArray = Object.values(history).sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(historyArray);
});

module.exports = router;
