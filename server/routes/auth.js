const express = require('express');
const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, region, state, farmSize, crops } = req.body;
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Name, email, and password are required' });

        // 1. Create the user in Supabase Auth (Triggers confirmation email)
        // CRITICAL: We create a locally scoped client for auth operations so we don't 
        // mutate the global admin client's session state and lose service_role privileges.
        const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        const { data: authData, error: authError } = await authClient.auth.signUp({
            email,
            password,
        });

        if (authError) {
            return res.status(400).json({ message: authError.message });
        }

        // Supabase returns an empty identities array if the email is already in use
        if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
            return res.status(409).json({ message: 'Email already registered. Please log in.' });
        }

        const userId = authData.user.id;

        // 2. Insert the profile into public.users
        const { error: profileError } = await supabase.from('users').insert({
            id: userId,
            name,
            region: region || 'Unknown',
            state: state || '',
            farm_size: farmSize || 0,
            crops: crops || [],
            role: 'farmer',
        });

        if (profileError) {
            // Rollback auth user if profile creation fails
            await supabase.auth.admin.deleteUser(userId);
            return res.status(500).json({ message: profileError.message });
        }

        // 3. Return success and instruct user to check email
        return res.status(201).json({
            message: 'Registration successful! Please check your email to confirm your account before logging in.',
            requireEmailConfirmation: true
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: 'Email and password required' });

        const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false }
        });

        const { data, error } = await authClient.auth.signInWithPassword({ email, password });

        if (error) return res.status(401).json({ message: 'Invalid credentials' });

        const userId = data.user.id;

        // Fetch profile from public.users
        const { data: profile } = await supabase
            .from('users')
            .select('name, region, state, crops, role, federated_rounds_participated')
            .eq('id', userId)
            .single();

        return res.json({
            token: data.session.access_token,
            user: {
                id: userId,
                name: profile?.name || data.user.email,
                email: data.user.email,
                region: profile?.region || 'Unknown',
                state: profile?.state || '',
                crops: profile?.crops || [],
                role: profile?.role || 'farmer',
                federatedRoundsParticipated: profile?.federated_rounds_participated || 0,
            },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: err.message });
    }
});

// GET /api/auth/me — verify token & return profile
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'No token provided' });

        const { data, error } = await supabase.auth.getUser(token);
        if (error || !data?.user) return res.status(401).json({ message: 'Invalid token' });

        const userId = data.user.id;

        const { data: profile } = await supabase
            .from('users')
            .select('name, region, state, crops, role, federated_rounds_participated, created_at')
            .eq('id', userId)
            .single();

        return res.json({
            user: {
                id: userId,
                name: profile?.name || data.user.email,
                email: data.user.email,
                region: profile?.region || 'Unknown',
                state: profile?.state || '',
                crops: profile?.crops || [],
                role: profile?.role || 'farmer',
                federatedRoundsParticipated: profile?.federated_rounds_participated || 0,
                createdAt: profile?.created_at,
            },
        });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router;
