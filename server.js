require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'bioanalytica',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acces necesar' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token invalid' });
        }
        req.user = user;
        next();
    });
};


app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, role = 'researcher' } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
            [username, email, hashedPassword, role]
        );
        
        const token = jwt.sign(
            { id: result.rows[0].id, username: result.rows[0].username },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            user: result.rows[0],
            token: token
        });
    } catch (error) {
        console.error(error);
        if (error.code === '23505') {
            res.status(400).json({ error: 'Email-ul sau username-ul există deja' });
        } else {
            res.status(500).json({ error: 'Eroare la înregistrare' });
        }
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email sau parolă incorectă' });
        }
        
        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Email sau parolă incorectă' });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la autentificare' });
    }
});


app.post('/api/samples', authenticateToken, async (req, res) => {
    try {

        const { sample_name, sample_type, quantity, description } = req.body;

        if (!sample_name) {
            return res.status(400).json({ error: 'Numele probei este necesar' });
        }

        const result = await pool.query(
            `INSERT INTO samples1 (user_id, sample_name, sample_type, quantity, description)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                req.user.id, 
                sample_name, 
                sample_type, 
                quantity, 
                description
            ]
        );
        
        res.json({
            success: true,
            sample: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la adăugarea probei' });
    }
});

app.get('/api/samples', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 USER requesting samples:', req.user);
        
        const result = await pool.query(
            'SELECT * FROM samples1 WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        
        console.log('📊 Query result:', {
            rowCount: result.rowCount,
            rows: result.rows
        });
        
        res.json({
            success: true,
            samples: result.rows
        });
    } catch (error) {
        console.error('❌ Database error:', error);
        res.status(500).json({ error: 'Eroare la încărcarea probelor' });
    }
});

app.delete('/api/samples/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM samples1 WHERE id = $1 AND user_id = $2 RETURNING *',
            [req.params.id, req.user.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Proba nu a fost găsită' });
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Eroare la ștergerea probei' });
    }
});


app.get('/api/researchers', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, 
                username, 
                email, 
                role, 
                created_at,
                (SELECT COUNT(*) FROM samples1 WHERE user_id = users.id) as sample_count
            FROM users 
            ORDER BY created_at DESC
        `);
        
        res.json({
            success: true,
            researchers: result.rows
        });
    } catch (error) {
        console.error('Error fetching researchers:', error);
        res.status(500).json({ error: 'Eroare la încărcarea cercetătorilor' });
    }
});


app.get('/api/verify-token', authenticateToken, (req, res) => {
    res.json({ success: true, user: req.user });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`🌱 BioAnalytica server rulează pe portul ${port}`);
    console.log(`🔗 Acces: http://localhost:${port}`);
});