require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials! Ensure SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) are set in Vercel Environment Variables.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

async function seedData() {
    if (!supabaseUrl) return;

    try {
        // --- SEED FOODS ---
        const { count: foodCount } = await supabase
            .from('foods')
            .select('*', { count: 'exact', head: true });

        if (foodCount === 0) {
            const foodsPath = path.join(__dirname, 'data', 'foods_vast.json');
            if (fs.existsSync(foodsPath)) {
                const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));
                console.log(`Seeding ${foods.length} foods...`);

                for (let i = 0; i < foods.length; i += 50) {
                    const chunk = foods.slice(i, i + 50);
                    const { error } = await supabase
                        .from('foods')
                        .upsert(chunk, { onConflict: 'name' });
                    if (error) console.error('Error upserting foods chunk:', error.message);
                }
                console.log('Foods seeding completed.');
            }
        }

        // --- SEED EXERCISES ---
        const { count: exerciseCount } = await supabase
            .from('exercises')
            .select('*', { count: 'exact', head: true });

        if (exerciseCount === 0) {
            const exercisesPath = path.join(__dirname, 'data', 'exercises.json');
            if (fs.existsSync(exercisesPath)) {
                const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));
                console.log(`Seeding ${exercises.length} exercises...`);

                for (let i = 0; i < exercises.length; i += 50) {
                    const chunk = exercises.slice(i, i + 50);
                    const { error } = await supabase
                        .from('exercises')
                        .upsert(chunk, { onConflict: 'name' });
                    if (error) console.error('Error upserting exercises chunk:', error.message);
                }
                console.log('Exercises seeding completed.');
            }
        }

    } catch (err) {
        console.error('Seeding check failed:', err.message);
    }
}

// Only run seeding in non-production or if explicitly triggered
if (process.env.NODE_ENV !== 'production' || process.env.FORCE_SEED === 'true') {
    seedData();
}

module.exports = { supabase };
