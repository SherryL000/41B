const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Login page
router.get('/login', (req, res) => {
  res.render('login', { 
    error: null, 
    title: 'Login - Todo App',
    formData: {}
  });
});

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    req.session.userId = user._id;
    res.redirect('/tasks');
  } catch (err) {
    res.render('login', { error: 'Server error' });
  }
});

// Logout - support both GET and POST for compatibility
router.get('/logout', (req, res) => {
  console.log('=== LOGOUT PROCESS (GET) ===');
  console.log('Logging out user:', req.session.username);
  
  req.session.destroy((err) => {
    if (err) {
      console.error('💥 Logout error:', err);
    } else {
      console.log('✅ Logout successful');
    }
    res.redirect('/auth/login');
  });
});

router.post('/logout', (req, res) => {
  console.log('=== LOGOUT PROCESS (POST) ===');
  console.log('Logging out user:', req.session.username);
  
  req.session.destroy((err) => {
    if (err) {
      console.error('💥 Logout error:', err);
    } else {
      console.log('✅ Logout successful');
    }
    res.redirect('/');
  });
});

// Register page
router.get('/register', (req, res) => {
  res.render('register', { 
    error: null, 
    title: 'Register - Todo App',
    formData: {} // 添加 formData 來保存輸入的數據
  });
});

// Handle registration
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword } = req.body;
    
    console.log('=== REGISTRATION PROCESS START ===');
    console.log('Registration attempt:', { 
      username, 
      passwordLength: password ? password.length : 0, 
      confirmPasswordLength: confirmPassword ? confirmPassword.length : 0 
    });

    // 保存表單數據以便在錯誤時顯示
    const formData = { username };

    // 驗證輸入 - 檢查是否為空
    if (!username || !password || !confirmPassword) {
      console.log('❌ Missing fields');
      return res.render('register', { 
        error: 'All fields are required', 
        title: 'Register - Todo App',
        formData
      });
    }

    // 去除前後空白
    const trimmedUsername = username.trim();

    // 檢查用戶名長度
    if (trimmedUsername.length < 3) {
      console.log('❌ Username too short');
      return res.render('register', { 
        error: 'Username must be at least 3 characters long', 
        title: 'Register - Todo App',
        formData
      });
    }

    if (trimmedUsername.length > 30) {
      console.log('❌ Username too long');
      return res.render('register', { 
        error: 'Username cannot exceed 30 characters', 
        title: 'Register - Todo App',
        formData
      });
    }

    // 檢查密碼長度
    if (password.length < 6) {
      console.log('❌ Password too short');
      return res.render('register', { 
        error: 'Password must be at least 6 characters long', 
        title: 'Register - Todo App',
        formData
      });
    }

    // 檢查密碼確認
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      return res.render('register', { 
        error: 'Passwords do not match', 
        title: 'Register - Todo App',
        formData
      });
    }

    // 檢查用戶名是否已存在
    console.log('🔍 Checking if username exists:', trimmedUsername);
    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      console.log('❌ Username already exists:', trimmedUsername);
      return res.render('register', { 
        error: 'Username already exists', 
        title: 'Register - Todo App',
        formData
      });
    }

    // 創建新用戶
    console.log('✅ Creating new user:', trimmedUsername);
    const user = new User({ 
      username: trimmedUsername, 
      password: password 
    });
    
    console.log('💾 Saving user to database...');
    await user.save();
    console.log('✅ User created successfully. User ID:', user._id);

    // 設置 session
    req.session.userId = user._id;
    req.session.username = user.username;
    
    console.log('✅ Session set:', {
      userId: req.session.userId,
      username: req.session.username
    });
    
    console.log('🔄 Redirecting to /tasks');
    console.log('=== REGISTRATION PROCESS COMPLETED SUCCESSFULLY ===');
    
    // 成功註冊，跳轉到任務頁面
    res.redirect('/tasks');
    
  } catch (err) {
    console.error('💥 REGISTRATION ERROR:', err);
    
    let errorMessage = 'Registration failed due to server error';
    const formData = { username: req.body.username };
    
    // 處理不同的錯誤類型
    if (err.code === 11000) {
      errorMessage = 'Username already exists';
      console.log('❌ Duplicate username error');
    } else if (err.name === 'ValidationError') {
      // 處理 Mongoose 驗證錯誤
      if (err.errors.username) {
        errorMessage = err.errors.username.message;
      } else if (err.errors.password) {
        errorMessage = err.errors.password.message;
      }
      console.log('❌ Validation error:', errorMessage);
    } else if (err.message.includes('password')) {
      errorMessage = 'Password error: ' + err.message;
    }
    
    console.log('❌ Registration failed with error:', errorMessage);
    console.log('=== REGISTRATION PROCESS FAILED ===');
    
    res.render('register', { 
      error: errorMessage, 
      title: 'Register - Todo App',
      formData
    });
  }
});

// 測試路由 - 用於除錯
router.get('/debug', async (req, res) => {
  try {
    const users = await User.find({}, 'username createdAt');
    res.json({
      session: req.session,
      users: users,
      totalUsers: users.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
