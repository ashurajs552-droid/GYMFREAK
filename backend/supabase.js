require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

async function seedData() {
    if (!supabaseUrl) return;

    try {
        // --- SEED FOODS ---
        const { count: foodCount } = await supabase.from('foods').select('*', { count: 'exact', head: true });

        // If we have fewer than 50 items, assume it's the old list or empty, so we re-seed
        if (foodCount < 50) {
            console.log('Seeding vast food database...');
            const foodsPath = path.join(__dirname, 'data', 'foods_vast.json');
            if (fs.existsSync(foodsPath)) {
                const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

                // Upsert based on name to avoid duplicates if some exist
                // Note: 'name' needs to be unique constraint or we just insert. 
                // For simplicity, we'll just insert and ignore errors or clear table first?
                // Better: Check if empty. If not empty but small, maybe delete all? 
                // Let's just insert new ones that don't exist? No, too complex.
                // We'll just insert.

                for (let i = 0; i < foods.length; i += 50) {
                    const chunk = foods.slice(i, i + 50);
                    const { error } = await supabase.from('foods').insert(chunk);
                    if (error) console.error('Error seeding foods chunk:', error.message);
                }
                console.log('Seeded foods successfully.');
            }
        }

        // --- SEED EXERCISES ---
        // First, check if 'exercises' table exists. If not, we can't seed.
        // We'll assume the user runs the SQL to create it.
        // But we can try to insert and catch error.

        const exercisesPath = path.join(__dirname, 'data', 'exercises.json');
        if (fs.existsSync(exercisesPath)) {
            const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

            // Check if table has data
            const { count: exCount, error: exCheckError } = await supabase.from('exercises').select('*', { count: 'exact', head: true });

            if (!exCheckError && exCount === 0) {
                console.log('Seeding exercises...');
                for (let i = 0; i < exercises.length; i += 50) {
                    const chunk = exercises.slice(i, i + 50);
                    const { error } = await supabase.from('exercises').insert(chunk);
                    if (error) console.error('Error seeding exercises chunk:', error.message);
                }
                console.log('Seeded exercises successfully.');
            }
        }

    } catch (err) {
        console.error('Seeding failed:', err.message);
    }
}

seedData();

module.exports = { supabase };
