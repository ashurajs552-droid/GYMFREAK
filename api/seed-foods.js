// Seed script to add Indian foods to Supabase
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const indianFoods = require('./data/indian_foods.json');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedFoods() {
    console.log(`\n🍛 Seeding ${indianFoods.length} Indian foods to database...\n`);

    // Get existing foods to avoid duplicates
    const { data: existingFoods, error: fetchError } = await supabase
        .from('foods')
        .select('name');

    if (fetchError) {
        console.error('Error fetching existing foods:', fetchError.message);
        process.exit(1);
    }

    const existingNames = new Set(existingFoods.map(f => f.name.toLowerCase()));

    // Filter out duplicates
    const newFoods = indianFoods.filter(food => !existingNames.has(food.name.toLowerCase()));

    console.log(`📊 Found ${existingFoods.length} existing foods`);
    console.log(`➕ Adding ${newFoods.length} new foods (${indianFoods.length - newFoods.length} duplicates skipped)`);

    if (newFoods.length === 0) {
        console.log('\n✅ All foods already exist in database!');
        return;
    }

    // Insert in batches of 50
    const batchSize = 50;
    let added = 0;

    for (let i = 0; i < newFoods.length; i += batchSize) {
        const batch = newFoods.slice(i, i + batchSize);

        const { data, error } = await supabase
            .from('foods')
            .insert(batch)
            .select();

        if (error) {
            console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        } else {
            added += data.length;
            console.log(`   Batch ${Math.floor(i / batchSize) + 1}: Added ${data.length} foods`);
        }
    }

    console.log(`\n✅ Successfully added ${added} Indian foods to database!`);
}

seedFoods().catch(console.error);
