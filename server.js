var express = require('express');
var cors = require('cors');
var Pool = require('pg').Pool;

var app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

var db = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'nestfinder',
  user: 'postgres',
  password: 'sagar123'
});

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
    [req.body.title, req.body.location, req.body.price, req.body.type, req.body.bedrooms, req.body.landlord_id || 1, req.body.photo],
    function(err, r) {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true, property: r.rows[0] });
    }
  );
});

app.get('/properties/:id', function(req, res) {
  db.query('SELECT * FROM properties WHERE id=$1', [req.params.id],
    function(err, r) {
      if (err) return res.json({ success: false, error: err.message });
      if (r.rows.length === 0) return res.json({ success: false, message: 'Property not found!' });
      res.json({ success: true, property: r.rows[0] });
    }
  );
});

app.post('/bookings', function(req, res) {
  db.query(
    'INSERT INTO bookings(property_id,name,phone,date) VALUES($1,$2,$3,$4) RETURNING *',
    [req.body.property_id, req.body.name, req.body.phone, req.body.date],
    function(err, r) {
      if (err) return res.json({ success: false, error: err.message });
      res.json({ success: true, booking: r.rows[0] });
    }
  );
});

app.listen(5000, function() {
  console.log('Server started!');
});