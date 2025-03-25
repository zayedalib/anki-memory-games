const express = require('express');
const router = express.Router();
const pool = require('../db'); // Use your existing PostgreSQL connection

// API: Get all users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name FROM users');
        res.json(result.rows); // Send user data as JSON
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get a single user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, name FROM users WHERE id = $1', [id]);
        res.json(result.rows[0] || { error: 'User not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
