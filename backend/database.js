const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const db = new Database('gymfreak.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

function initDb() {
    // Users Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            name TEXT NOT NULL,
            age INTEGER,
            gender TEXT,
            height REAL, -- cm
            weight REAL, -- kg
            activity_level TEXT,
            goal TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Foods Table
    db.exec(`
        CREATE TABLE IF NOT EXISTS foods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            calories REAL NOT NULL,
            protein REAL NOT NULL,
            carbs REAL NOT NULL,
            fat REAL NOT NULL,
            serving_size REAL NOT NULL,
            unit TEXT NOT NULL
        )
    `);

    // Food Entries
    db.exec(`
        CREATE TABLE IF NOT EXISTS food_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            food_id INTEGER NOT NULL,
            date TEXT NOT NULL, -- YYYY-MM-DD
            quantity REAL NOT NULL,
            meal_type TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (food_id) REFERENCES foods(id)
        )
    `);

    // Workouts
    db.exec(`
        CREATE TABLE IF NOT EXISTS workouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            date TEXT NOT NULL, -- YYYY-MM-DD
            type TEXT NOT NULL, -- 'cardio' or 'strength'
            exercise_name TEXT NOT NULL,
            duration INTEGER, -- minutes
            sets INTEGER,
            reps INTEGER,
            weight REAL,
            calories_burned REAL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `);

    // Seed Foods if empty
    const stmt = db.prepare('SELECT count(*) as count FROM foods');
    const { count } = stmt.get();
    
    if (count === 0) {
        console.log('Seeding food database...');
        const insertFood = db.prepare('INSERT INTO foods (name, calories, protein, carbs, fat, serving_size, unit) VALUES (?, ?, ?, ?, ?, ?, ?)');
        
        const foods = [
            ['Chicken Breast (Cooked)', 165, 31, 0, 3.6, 100, 'g'],
            ['Rice (White, Cooked)', 130, 2.7, 28, 0.3, 100, 'g'],
            ['Broccoli (Steamed)', 34, 2.8, 7, 0.4, 100, 'g'],
            ['Egg (Large)', 78, 6, 0.6, 5, 1, 'piece'],
            ['Oats (Rolled)', 389, 16.9, 66, 6.9, 100, 'g'],
            ['Banana', 89, 1.1, 22.8, 0.3, 100, 'g'],
            ['Apple', 52, 0.3, 14, 0.2, 100, 'g'],
            ['Almonds', 579, 21, 22, 50, 100, 'g'],
            ['Salmon (Cooked)', 208, 20, 0, 13, 100, 'g'],
            ['Greek Yogurt (Plain)', 59, 10, 3.6, 0.4, 100, 'g'],
            ['Milk (Whole)', 61, 3.2, 4.8, 3.3, 100, 'ml'],
            ['Whey Protein Scoop', 120, 24, 3, 1, 30, 'g'],
            ['Avocado', 160, 2, 8.5, 14.7, 100, 'g'],
            ['Sweet Potato (Cooked)', 86, 1.6, 20, 0.1, 100, 'g'],
            ['Olive Oil', 884, 0, 0, 100, 100, 'ml']
        ];

        const transaction = db.transaction((items) => {
            for (const item of items) insertFood.run(...item);
        });
        
        transaction(foods);
        console.log('Seeded foods.');
    }
}

module.exports = { db, initDb };
