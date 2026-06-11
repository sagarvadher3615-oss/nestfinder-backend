var express = require('express');
var cors = require('cors');
var Pool = require('pg').Pool;

var app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

var db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

db.query(`
  CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name VARCHAR(100), phone VARCHAR(15), password VARCHAR(200), role VARCHAR(20), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS properties (id SERIAL PRIMARY KEY, title VARCHAR(200), location VARCHAR(300), price VARCHAR(50), type VARCHAR(50), bedrooms VARCHAR(20), landlord_id INTEGER, photo TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
  CREATE TABLE IF NOT EXISTS bookings (id SERIAL PRIMARY KEY, property_id INTEGER, name VARCHAR(100), phone VARCHAR(15), date VARCHAR(50), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
`).then(() => console.log('Tables ready!')).catch(e => console.log('DB Error:', e.message));

app.get('/', function(req, res) {
  res.json({ message: 'NestFinder is running!' });
});

app.post('/register', function(req, res) {
  db.query(
    'SELECT * FROM users WHERE phone=$1', [req.body.phone],
    function(err, r) {
      if (err) return res.json({ success: false, error: err.message });
      if (r.rows.length > 0) return res.json({ success: false, error: 'Phone already registered!' });
      db.query(
        'INSERT INTO users(name,phone,password,role) VALUES($1,$2,$3,$4) RETURNING *',
        [req.body.name, req.body.phone, req.body.password, req.body.role],
        function(err2, r2) {
          if (err2) return res.json({ success: false, error: err2.message });
          res.json({ success: true, message: 'Account created successfully!', user: r2.rows[0] });
        }
      );
    }
  );
});

app.post('/login', function(req, res) {
  db.query(
    'SELECT * FROM users WHERE phone=$1 AND password=$2',
    [req.body.phone, req.body.password],
    function(err, r) {
      if (err) return res.json({ success: false, error: err.message });
      if (r.rows.length === 0) return res.json({ success: false, message: 'Wrong phone or password!' });
      res.json({ success: true, user: r.rows[0] });
    }
  );
});

app.get('/properties', function(req, res) {
  db.query('SELECT * FROM properties ORDER BY created_at DESC',
    function(err, r) {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true, properties: r.rows });
    }
  );
});

app.post('/properties', function(req, res) {
  db.query(
    'INSERT INTO properties(title,location,price,type,bedrooms,landlord_id,photo) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *',
    [req.body.title, req.body.location, req.body.price, req.body.type, re