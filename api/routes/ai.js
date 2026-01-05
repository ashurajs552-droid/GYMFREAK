const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
    console.warn('⚠️ GEMINI_API_KEY is missing! AI features will not work.');
} else {
    console.log('✅ GEMINI_API_KEY detected. AI features enabled.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

router.post('/estimate-food', authenticateToken, async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI Estimation is not configured. Please add GEMINI_API_KEY to environment variables.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Estimate the nutritional values for "${query}". 
        Return ONLY a JSON object with the following fields: 
        name (string), calories (number), protein (number), carbs (number), fat (number), serving_size (number), unit (string).
        Example: {"name": "Chicken Breast", "calories": 165, "protein": 31, "carbs": 0, "fat": 3.6, "serving_size": 100, "unit": "g"}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response (sometimes Gemini adds markdown code blocks)
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonStr);

        res.json(data);
    } catch (err) {
        console.error('AI Estimation Error:', err);
        res.status(500).json({ error: 'Failed to estimate with AI' });
    }
});

router.post('/estimate-workout', authenticateToken, async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Query is required' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI Estimation is not configured. Please add GEMINI_API_KEY to environment variables.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `Estimate the MET (Metabolic Equivalent of Task) value and muscle group for the exercise "${query}". 
        Return ONLY a JSON object with the following fields: 
        name (string), met (number), type (string: 'strength' or 'cardio'), muscle_group (string: 'Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Abs', 'Cardio', 'Full Body', or 'Other').
        Example: {"name": "Bench Press", "met": 6.0, "type": "strength", "muscle_group": "Chest"}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonStr);

        res.json(data);
    } catch (err) {
        console.error('AI Estimation Error:', err);
        res.status(500).json({ error: 'Failed to estimate with AI' });
    }
});

router.post('/coach-insight', authenticateToken, async (req, res) => {
    const { stats } = req.body;
    if (!stats) return res.status(400).json({ error: 'Stats are required' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI Insight is not configured.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `As a professional fitness coach, provide a short, motivating, and personalized insight (max 3 sentences) based on today's stats:
        User Goal: ${stats.user.goal}
        Calories Consumed: ${Math.round(stats.consumed.calories)} kcal
        Calories Burned: ${Math.round(stats.burned)} kcal
        Net Calories: ${Math.round(stats.consumed.calories - stats.burned)} kcal
        Target Calories: ${stats.targets.calories} kcal
        Protein: ${Math.round(stats.consumed.protein)}g / ${stats.targets.protein}g
        Carbs: ${Math.round(stats.consumed.carbs)}g / ${stats.targets.carbs}g
        Fat: ${Math.round(stats.consumed.fat)}g / ${stats.targets.fat}g
        
        Provide a specific tip or encouragement.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();

        res.json({ insight: text });
    } catch (err) {
        console.error('AI Insight Error:', err);
        res.status(500).json({ error: 'Failed to generate insight' });
    }
});

router.post('/fitness-plan', authenticateToken, async (req, res) => {
    const { profile, metrics } = req.body;
    if (!profile || !metrics) return res.status(400).json({ error: 'Profile and metrics are required' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'AI Fitness Plan is not configured.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `As a professional fitness coach, create a personalized fitness plan for a user with the following profile:
        Name: ${profile.name}
        Age: ${profile.age}
        Gender: ${profile.gender}
        Height: ${profile.height} cm
        Weight: ${profile.weight} kg
        Goal: ${profile.goal}
        Activity Level: ${profile.activity_level}
        Daily Calorie Target: ${metrics.targets.calories} kcal
        Protein Target: ${metrics.targets.protein}g
        
        Return a JSON object with the following structure:
        {
            "workout_plan": "A concise 3-4 sentence workout strategy",
            "nutrition_plan": "A concise 3-4 sentence nutrition strategy",
            "pro_tip": "One high-impact tip for success"
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonStr);

        res.json(data);
    } catch (err) {
        console.error('AI Fitness Plan Error:', err);
        res.status(500).json({ error: 'Failed to generate fitness plan' });
    }
});

module.exports = router;
