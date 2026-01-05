const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { SECRET_KEY } = require('../middleware/auth');

const router = express.Router();

router.post('/register', (req, res) => {
    const { email, password, name, age, gender, height, weight, activity_level, goal } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const hashedPassword = bcrypt.hashSync(password, 10);
        const stmt = db.prepare(`
            INSERT INTO users (email, password, name, age, gender, height, weight, activity_level, goal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(email, hashedPassword, name, age, gender, height, weight, activity_level, goal);

        const token = jwt.sign({ id: info.lastInsertRowid, email }, SECRET_KEY, { expiresIn: '24h' });
        res.json({ token, user: { id: info.lastInsertRowid, email, name } });
    } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

module.exports = router;
