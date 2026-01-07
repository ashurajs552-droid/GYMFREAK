const express = require('express');
const { supabase } = require('../supabase');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get Daily Water Log
router.get('/log/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;

    const { data, error } = await supabase
        .from('water_entries')
        .select('*')
        .eq('user_id', req.user.id)
        .eq('date', date);

    if (error) return res.status(500).json({ error: error.message });

    const total = data.reduce((sum, entry) => sum + entry.amount, 0);
    res.json({ entries: data, total });
});

// Add Water Entry
router.post('/log', authenticateToken, async (req, res) => {
    const { date, amount } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const { data, error } = await supabase
        .from('water_entries')
        .insert([{
            user_id: req.user.id,
            date,
            amount
        }])
        .select()
        .single();

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Delete Water Entry
router.delete('/log/:id', authenticateToken, async (req, res) => {
    const { error } = await supabase
        .from('water_entries')
        .delete()
        .eq('id', req.params.id)
        .eq('user_id', req.user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

module.exports = router;
