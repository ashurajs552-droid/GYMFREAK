// Seed script to add workouts to Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const workouts = require('./data/workouts.json');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedWorkouts() {
    console.log(`\n🏋️ Seeding ${workouts.length} workouts to database...\n`);

    // Get existing exercises to avoid duplicates
    const { data: existingExercises, error: fetchError } = await supabase
        .from('exercises')
        .select('name');

    if (fetchError) {
        console.error('Error fetching existing exercises:', fetchError.message);
        process.exit(1);
    }

    const existingNames = new Set(existingExercises.map(e => e.name.toLowerCase()));

    // Filter out duplicates
    const newWorkouts = workouts.filter(w => !existingNames.has(w.name.toLowerCase()));

    console.log(`📊 Found ${existingExercises.length} existing exercises`);
    console.log(`➕ Adding ${newWorkouts.length} new exercises (${workouts.length - newWorkouts.length} duplicates skipped)`);

    if (newWorkouts.length === 0) {
        console.log('\n✅ All exercises already exist in database!');
        return;
    }

    // Insert in batches of 50
    const batchSize = 50;
    let added = 0;

    for (let i = 0; i < newWorkouts.length; i += batchSize) {
        const batch = newWorkouts.slice(i, i + batchSize);

        const { data, error } = await supabase
            .from('exercises')
            .insert(batch)
            .select();

        if (error) {
            console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        } else {
            added += data.length;
            console.log(`   Batch ${Math.floor(i / batchSize) + 1}: Added ${data.length} exercises`);
        }
    }

    console.log(`\n✅ Successfully added ${added} workouts to database!`);
}

seedWorkouts().catch(console.error);
