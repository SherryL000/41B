require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://1111:1111@cluster0.gkijine.mongodb.net/todo?retryWrites=true&w=majority';
const PORT = process.env.PORT || 5000;

console.log('🔗 使用的连接字符串:', MONGODB_URI);

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const bcrypt = require('bcryptjs');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const User = require('./models/User');

const app = express();

// ----------------------
// Connect to MongoDB
// ----------------------
mongoose.connect(MONGODB_URI)  // 使用 Atlas 连接字符串
  .then(() => console.log('✅ MongoDB connected to Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ----------------------
// Middleware
// ----------------------
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ----------------------
// Session setup
// ----------------------
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ 
    client: mongoose.connection.getClient() // Mongoose 9.x 推荐方式
  }),
  cookie: { 
    maxAge: 1000 * 60 * 60 * 24 // 24小时
  }
}));

// ----------------------
// Make user available in all views
// ----------------------
const requireAuth = (req, res, next) => {
  if (req.session.userId) return next();
  res.redirect('/auth/login');
};
app.use(async (req, res, next) => {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      res.locals.user = user;
    } catch (err) {
      console.error('User lookup error:', err);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});
// ----------------------
// Routes
// ----------------------
app.use('/auth', authRoutes);
app.use('/tasks', requireAuth, taskRoutes);


// Home page
app.get('/', (req, res) => {
  res.render('home', { title: 'Home - Todo App' });
});

app.get('/time', (req, res) => {
    res.render('time', {
        initialTime: '10:00', // Display value
        initialTimeSeconds: 600 // Actual seconds (10 minutes)
    });
});
// ----------------------
// 调试路由
// ----------------------
app.get('/debug', (req, res) => {
  res.json({
    session: req.session,
    username: req.session.username,
    locals: res.locals
  });
});

// ----------------------
// 错误处理中间件
// ----------------------
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).render('error', { 
    error: 'Something went wrong!',
    title: 'Error - Todo App'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).render('error', {
    error: 'Page not found',
    title: '404 - Todo App'
  });
});

// ----------------------
// Start server
// ----------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
