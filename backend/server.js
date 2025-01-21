const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();

app.use(cors());
app.use(express.json());


const db = mysql.createConnection({
    host: "127.0.0.1",
    user: 'root',
    password: '',
    database: 'validacekouba'
});

db.connect((err) => {
    if (err) {
        console.error('Chyba při připojování k databázi:', err);
        return;
    }
    console.log('Připojeno k databázi MySQL');
});

// Middleware pro ověřování tokenu
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ error: 'Token nebyl poskytnut' });
    }
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Neplatný token' });
        }
        req.user = decoded;
        next();
    });
};

// Registrace uživatele
app.post('/register', (req, res) => {
    const { name, email, password, country_id } = req.body;

    if (!name.match(/^[a-zA-Z0-9]+$/)) {
        return res.status(400).json({ error: 'Uživatelské jméno musí obsahovat pouze alfanumerické znaky' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Neplatný formát emailu' });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[!@#$%^&*()_+=\-{};:'\",.<>?]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'Heslo nesplňuje bezpečnostní požadavky' });
    }

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Chyba při hledání uživatele:', err);
            return res.status(500).json({ error: 'Chyba serveru' });
        }
        if (results.length > 0) {
            return res.status(400).json({ error: 'Email již existuje' });
        }

        db.query('SELECT * FROM countries WHERE id = ? AND active = 1', [country_id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(400).json({ error: 'Neplatná nebo deaktivovaná země' });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);
            db.query(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [name, email, hashedPassword],
                (err) => {
                    if (err) {
                        console.error('Chyba při registraci:', err);
                        return res.status(500).json({ error: 'Chyba serveru' });
                    }
                    res.status(201).json({ message: 'Registrace úspěšná' });
                }
            );
        });
    });
});

// Přihlášení uživatele
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Chyba při přihlášení:', err);
            return res.status(500).json({ error: 'Chyba serveru' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Uživatel nenalezen' });
        }

        const user = results[0];
        if (!bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Neplatné heslo' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: 'Přihlášení úspěšné', token });
    });
});

// Načtení seznamu aktivních zemí
app.get('/countries', (req, res) => {
    db.query('SELECT id, name FROM countries WHERE active = 1', (err, results) => {
        if (err) {
            console.error('Chyba při získávání zemí:', err);
            return res.status(500).json({ error: 'Chyba serveru' });
        }
        res.json(results);
    });
});

app.listen(8081, () => {
    console.log("Listening on port 8081");
});
