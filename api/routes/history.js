const express = require('express');
const { supabase } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get History (Food & Workouts & Water)
router.get('/history', authenticateToken, async (req, res) => {
    const { start_date, end_date } = req.query;
    const isAdmin = req.user.email === 'ashu@gmail.com';

    // Get Food Logs
    let foodQuery = supabase
        .from('food_entries')
        .select(`
            id, date, quantity, meal_type, created_at, user_id,
            foods (name, calories, protein, carbs, fat, unit, serving_size),
            users (id, name, email)
        `);

    if (!isAdmin) {
        foodQuery = foodQuery.eq('user_id', req.user.id);
    }
    if (start_date) foodQuery = foodQuery.gte('date', start_date);
    if (end_date) foodQuery = foodQuery.lte('date', end_date);

    const { data: foodLogs, error: foodError } = await foodQuery.order('date', { ascending: false });
    if (foodError) return res.status(500).json({ error: foodError.message });

    // Get Workout Logs
    let workoutQuery = supabase
        .from('workouts')
        .select('*, users (id, name, email)');

    if (!isAdmin) {
        workoutQuery = workoutQuery.eq('user_id', req.user.id);
    }
    if (start_date) workoutQuery = workoutQuery.gte('date', start_date);
    if (end_date) workoutQuery = workoutQuery.lte('date', end_date);

    const { data: workoutLogs, error: workoutError } = await workoutQuery.order('date', { ascending: false });
    if (workoutError) return res.status(500).json({ error: workoutError.message });

    // Get Water Logs
    let waterQuery = supabase
        .from('water_entries')
        .select('*, users (id, name, email)');

    if (!isAdmin) {
        waterQuery = waterQuery.eq('user_id', req.user.id);
    }
    if (start_date) waterQuery = waterQuery.gte('date', start_date);
    if (end_date) waterQuery = waterQuery.lte('date', end_date);

    const { data: waterLogs, error: waterError } = await waterQuery.order('date', { ascending: false });
    if (waterError) return res.status(500).json({ error: waterError.message });

    // Group by Date + User (if admin)
    const history = {};

    const getGroupKey = (entry) => {
        return isAdmin ? `${entry.date}_${entry.user_id}` : entry.date;
    };

    const createGroup = (entry) => ({
        date: entry.date,
        user_id: entry.user_id,
        user: entry.users ? { id: entry.users.id, name: entry.users.name, email: entry.users.email } : null,
        foods: [],
        workouts: [],
        water: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0, burned: 0, water: 0 }
    });

    // Process Foods
    foodLogs.forEach(entry => {
        const key = getGroupKey(entry);
        if (!history[key]) history[key] = createGroup(entry);

        const ratio = entry.quantity / entry.foods.serving_size;
        const calories = entry.foods.calories * ratio;

        history[key].foods.push({ ...entry, calculated_calories: calories });
        history[key].totals.calories += calories;
        history[key].totals.protein += entry.foods.protein * ratio;
        history[key].totals.carbs += entry.foods.carbs * ratio;
        history[key].totals.fat += entry.foods.fat * ratio;
    });

    // Process Workouts
    workoutLogs.forEach(entry => {
        const key = getGroupKey(entry);
        if (!history[key]) history[key] = createGroup(entry);

        history[key].workouts.push(entry);
        history[key].totals.burned += entry.calories_burned;
    });

    // Process Water
    waterLogs.forEach(entry => {
        const key = getGroupKey(entry);
        if (!history[key]) history[key] = createGroup(entry);

        history[key].water.push(entry);
        history[key].totals.water += entry.amount;
    });

    // Convert to array and sort
    const historyArray = Object.values(history).sort((a, b) => {
        const dateDiff = new Date(b.date) - new Date(a.date);
        if (dateDiff !== 0) return dateDiff;
        return (a.user?.name || '').localeCompare(b.user?.name || '');
    });

    res.json(historyArray);
});

module.exports = router;
