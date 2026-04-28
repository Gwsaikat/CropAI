const supabase = require('../config/supabase');

/**
 * Shared auth middleware — verifies the Supabase JWT and attaches userId to req.
 * Replaces the repeated jwt.verify() blocks that were in every route.
 */
const protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Unauthorized — no token provided' });

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) {
            return res.status(401).json({ message: 'Unauthorized — invalid or expired token' });
        }

        req.userId = data.user.id;
        req.user = data.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Unauthorized — token verification failed' });
    }
};

module.exports = { protect };
