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
    const { date, type, exercise_name, duration, sets, reps, weight } = req.body;

    // Get user weight and ensure profile exists
    let { data: user, error: userError } = await supabase
        .from('users')
        .select('weight')
        .eq('id', req.user.id)
        .single();

    if (userError && userError.code === 'PGRST116') {
        // Profile doesn't exist, create it
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
    let met = req.body.met || 4.0; // Use provided MET or default

    if (!req.body.met) {
        try {
            const { data: exercise, error: exerciseError } = await supabase
                .from('exercises')
                .select('met')
                .ilike('name', exercise_name)
                .limit(1)
                .single();

            if (exercise) {
                met = exercise.met;
            } else {
                // Fallback logic
                if (type === 'strength') met = 3.5;
                if (type === 'cardio') met = 7.0;
            }
        } catch (err) {
            console.error('Unexpected error fetching MET:', err);
            if (type === 'strength') met = 3.5;
            if (type === 'cardio') met = 7.0;
        }
    }

    // For strength, if duration is not provided, estimate it more accurately
    // 1 set = ~2 mins (including rest)
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
            weight,
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
