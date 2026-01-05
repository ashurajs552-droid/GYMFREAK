const express = require('express');
const { supabase } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search Exercises
router.get('/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .ilike('name', `%${q}%`)
        .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Get Daily Workouts
router.get('/log/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;

    const { data: workouts, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('date', date);

    if (error) return res.status(500).json({ error: error.message });

    const totalBurned = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);

    res.json({ workouts, totalBurned });
});

// Add Workout
router.post('/log', authenticateToken, async (req, res) => {
    const { date, type, exercise_name, duration, sets, reps, weight, muscle_group, sets_data } = req.body;

    // Get user weight and ensure profile exists
    let { data: user, error: userError } = await supabase
        .from('users')
        .select('weight')
        .eq('id', req.user.id)
        .single();

    if (userError && userError.code === 'PGRST116') {
        const metadata = req.user.user_metadata || {};
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                id: req.user.id,
                email: req.user.email,
                name: metadata.name || req.user.email.split('@')[0],
                weight: 70 // Default
            }])
            .select()
            .single();

        if (createError) return res.status(500).json({ error: 'Failed to create user profile: ' + createError.message });
        user = newUser;
    }

    const userWeight = user?.weight || 70;

    // Calculate Calories
    let calories_burned = 0;
    let met = req.body.met || 4.0;

    if (!req.body.met) {
        try {
            const { data: exercise } = await supabase
                .from('exercises')
                .select('met, muscle_group')
                .ilike('name', exercise_name)
                .limit(1)
                .single();

            if (exercise) {
                met = exercise.met;
            } else {
                if (type === 'strength') met = 3.5;
                if (type === 'cardio') met = 7.0;
            }
        } catch (err) {
            if (type === 'strength') met = 3.5;
            if (type === 'cardio') met = 7.0;
        }
    }

    // Adjust MET based on intensity (weight)
    // If we have sets_data, use the average weight
    let avgWeight = weight || 0;
    if (sets_data && sets_data.length > 0) {
        avgWeight = sets_data.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0) / sets_data.length;
    }

    if (type === 'strength' && avgWeight > 0) {
        // Increase MET if lifting heavy (relative to body weight)
        const intensityRatio = avgWeight / userWeight;
        if (intensityRatio > 1) met *= 1.5;
        else if (intensityRatio > 0.5) met *= 1.2;
    }

    const finalDuration = duration || (type === 'strength' ? (sets * 2) : 30);
    calories_burned = met * userWeight * (finalDuration / 60);
    calories_burned = Math.round(calories_burned);

    const { data, error } = await supabase
        .from('workouts')
        .insert([{
            user_id: req.user.id,
            date,
            type,
            exercise_name,
            duration,
            sets,
            reps,
            weight: avgWeight,
            muscle_group,
            sets_data: sets_data ? JSON.stringify(sets_data) : null,
            calories_burned
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Delete Workout
router.delete('/log/:id', authenticateToken, async (req, res) => {
    const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

module.exports = router;
