const express = require('express');
const { supabase } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function calculateMetrics(user) {
    const defaultMetrics = {
        bmi: 0,
        bmr: 0,
        tdee: 0,
        targets: {
            calories: 2000,
            protein: 150,
            fat: 70,
            carbs: 200
        }
    };

    if (!user || !user.weight || !user.height || !user.age || !user.gender) return defaultMetrics;

    // BMR
    let bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age);
    if (user.gender === 'male') bmr += 5;
    else bmr -= 161;

    // TDEE
    const activityMultipliers = {
        'sedentary': 1.2,
        'moderate': 1.55,
        'active': 1.725
    };
    const tdee = bmr * (activityMultipliers[user.activity_level] || 1.2);

    // Goal Targets
    let targetCalories = tdee;
    if (user.goal === 'loss') targetCalories -= 500;
    else if (user.goal === 'gain') targetCalories += 300;

    // Macros
    const proteinGrams = user.weight * 2.0; // 2g per kg
    const fatGrams = user.weight * 0.8; // 0.8g per kg

    const proteinCals = proteinGrams * 4;
    const fatCals = fatGrams * 9;
    const remainingCals = targetCalories - (proteinCals + fatCals);
    const carbGrams = Math.max(0, remainingCals / 4);

    return {
        bmi: (user.weight / ((user.height / 100) ** 2)).toFixed(1),
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targets: {
            calories: Math.round(targetCalories),
            protein: Math.round(proteinGrams),
            fat: Math.round(fatGrams),
            carbs: Math.round(carbGrams)
        }
    };
}

router.get('/profile', authenticateToken, async (req, res) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });

    if (!user) {
        // Create default profile if not exists (first login)
        // Use metadata from auth user if available
        const metadata = req.user.user_metadata || {};
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                id: req.user.id,
                email: req.user.email,
                name: metadata.name || req.user.email.split('@')[0],
                age: metadata.age,
                gender: metadata.gender,
                height: metadata.height,
                weight: metadata.weight,
                activity_level: metadata.activity_level,
                goal: metadata.goal
            }])
            .select()
            .single();

        if (createError) return res.status(500).json({ error: createError.message });
        const metrics = calculateMetrics(newUser);
        return res.json({ user: newUser, metrics });
    }

    const metrics = calculateMetrics(user);
    res.json({ user, metrics });
});

router.put('/profile', authenticateToken, async (req, res) => {
    const { age, gender, height, weight, activity_level, goal, name } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .update({ age, gender, height, weight, activity_level, goal, name })
        .eq('id', req.user.id)
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });

    const metrics = calculateMetrics(user);
    res.json({ user, metrics });
});

module.exports = router;
