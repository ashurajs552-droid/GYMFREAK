const { supabase } = require('../supabase');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Missing token' });

    // Hardcoded admin bypass
    if (token === 'admin-bypass-token-789') {
        req.user = { id: 'admin-bypass-uuid', email: 'ashu@gmail.com' };
        return next();
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(403).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Auth error' });
    }
}

module.exports = { authenticateToken };
