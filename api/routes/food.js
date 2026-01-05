const express = require('express');
const { supabase } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Search Foods
router.get('/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);

    const { data, error } = await supabase
        .from('foods')
        .select('*')
        .ilike('name', `%${q}%`)
        .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Get Daily Log
router.get('/log/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;

    const { data: entries, error } = await supabase
        .from('food_entries')
        .select(`
            id, date, quantity, meal_type,
            foods (name, calories, protein, carbs, fat, unit, serving_size)
        `)
        .eq('user_id', req.user.id)
        .eq('date', date);

    if (error) return res.status(500).json({ error: error.message });

    // Transform and calculate totals
    const formattedEntries = entries.map(e => ({
        id: e.id,
        date: e.date,
        quantity: e.quantity,
        meal_type: e.meal_type,
        ...e.foods
    }));

    const totals = formattedEntries.reduce((acc, item) => {
        const ratio = item.quantity / item.serving_size;
        acc.calories += item.calories * ratio;
        acc.protein += item.protein * ratio;
        acc.carbs += item.carbs * ratio;
        acc.fat += item.fat * ratio;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    res.json({ entries: formattedEntries, totals });
});

// Add Entry
router.post('/log', authenticateToken, async (req, res) => {
    let { food_id, date, quantity, meal_type, food_data } = req.body;

    // Ensure profile exists
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', req.user.id)
        .single();

    if (userError && userError.code === 'PGRST116') {
        const metadata = req.user.user_metadata || {};
        const { error: createError } = await supabase
            .from('users')
            .insert([{
                id: req.user.id,
                email: req.user.email,
                name: metadata.name || req.user.email.split('@')[0]
            }]);
        if (createError) return res.status(500).json({ error: 'Failed to create user profile: ' + createError.message });
    }

    // If food_data is provided (from AI), upsert it first
    if (!food_id && food_data) {
        const { data: newFood, error: foodError } = await supabase
            .from('foods')
            .upsert([food_data], { onConflict: 'name' })
            .select()
            .single();

        if (foodError) return res.status(500).json({ error: 'Failed to save new food: ' + foodError.message });
        food_id = newFood.id;
    }

    if (!food_id) return res.status(400).json({ error: 'food_id or food_data is required' });

    const { data, error } = await supabase
        .from('food_entries')
        .insert([{
            user_id: req.user.id,
            food_id,
            date,
            quantity,
            meal_type
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Delete Entry
router.delete('/log/:id', authenticateToken, async (req, res) => {
    const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

module.exports = router;
