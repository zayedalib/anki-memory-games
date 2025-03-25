const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config(); // Load environment variables from .env file

const app = express();
const port = 5500;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Set the views folder

// Create a new pool instance with the connection string from the .env file
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to parse request bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Route to render the login page
app.get('/login', (req, res) => {
  res.render('login', { message: req.session.message || '' });  // Pass message to the view
  req.session.message = '';  // Clear message after displaying it
});

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Route to handle login logic
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        req.session.user = user;  // Store the user data in the session
        return res.redirect(user.is_admin ? '/admin' : '/home');  // Redirect based on role
      }
    }

    req.session.message = 'Invalid login credentials';  // Set the error message
    res.redirect('/login');  // Redirect back to login if credentials are invalid
  } catch (error) {
    console.error(error);
    req.session.message = 'Error logging in.';
    res.redirect('/login');
  }
});

// Route to render the signup page
app.get('/signup', (req, res) => {
  res.render('signup', { message: req.session.message || '' });  // Pass message to the view
  req.session.message = '';  // Clear message after displaying it
});

// Route to handle signup logic
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);  // Hash the password before storing it
    await pool.query('INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4)', [name, email, hash, false]);

    req.session.message = 'Successfully signed up! Please log in.';  // Success message
    res.redirect('/login');  // Redirect to login after successful signup
  } catch (error) {
    console.error(error);
    req.session.message = 'Error signing up. Please try again.';
    res.redirect('/signup');  // Redirect back to signup if error occurs
  }
});

// Home page route for regular users
app.get('/home', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');  // Redirect to login if user is not logged in
  }

  res.render('home', { user: req.session.user });  // Render home page with user data
});

// Admin page route for admins only
app.get('/admin', (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.redirect('/home');  // Redirect to home if user is not admin
  }

  // Fetch users from the database and render the admin page, including email
  pool.query('SELECT id, name, email FROM users', (err, result) => {  // Include email in the query
    if (err) {
      console.error(err);
      return res.status(500).send('Error fetching users');
    }
    res.render('admin', { users: result.rows });  // Render admin page with users data
  });
});

// Route to handle logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.redirect('/login');  // Redirect to login after logging out
  });
});

// **API endpoint to get users data** - NEW ROUTE
app.get('/api/users', async (req, res) => {
  if (!req.session.user || !req.session.user.is_admin) {
    return res.status(403).send('Forbidden');  // Only allow admins to access the user data
  }

  try {
    const result = await pool.query('SELECT id, name, email FROM users');  // Include email in the query
    res.json(result.rows);  // Send users data as a JSON response
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching users');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
