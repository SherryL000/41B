const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Middleware: 驗證登入
const requireAuth = (req, res, next) => {
  if (!req.session.userId) return res.redirect('/auth/login');
  next();
};

// ----------------------
// 任務列表頁
// ----------------------
router.get('/', requireAuth, async (req, res) => {
  try {
    const { keyword, priority } = req.query;
    let query = { user: req.session.userId };
    
    if (keyword) query.title = { $regex: keyword, $options: 'i' };
    if (priority) query.priority = priority;
    
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    
    res.render('tasks', { 
      tasks, 
      title: 'My Tasks - Todo App',
      query: req.query
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// ----------------------
// 新增任務頁
// ----------------------
router.get('/new', requireAuth, (req, res) => {
  res.render('new-task', { title: 'New Task - Todo App' });
});

// 處理新增任務
router.post('/new', requireAuth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;
    console.log('Creating task with data:', req.body);
    
    await Task.create({ 
      title, 
      description, 
      dueDate,
      priority,
      status,
      user: req.session.userId 
    });
    
    console.log('Task created successfully');
    res.redirect('/tasks');
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).send('Failed to create task');
  }
});

// ----------------------
// 編輯任務頁 - 修正路徑
// ----------------------
router.get('/:id/edit', requireAuth, async (req, res) => {
  try {
    console.log('Editing task ID:', req.params.id);
    
    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.session.userId 
    });
    
    if (!task) {
      console.log('Task not found or access denied');
      return res.redirect('/tasks');
    }
    
    console.log('Task found:', task);
    res.render('edit-task', { 
      task, 
      title: 'Edit Task - Todo App' 
    });
  } catch (err) {
    console.error('Error loading edit page:', err);
    res.redirect('/tasks');
  }
});

// 處理編輯任務 - 修正路徑
router.post('/:id/edit', requireAuth, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;
    const taskId = req.params.id;
    
    console.log('Updating task ID:', taskId);
    console.log('Update data:', req.body);
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, user: req.session.userId },
      { 
        title, 
        description, 
        dueDate: dueDate || null,
        priority,
        status 
      },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      console.log('Task not found or access denied for update');
      return res.redirect('/tasks');
    }
    
    console.log('Task updated successfully:', task);
    res.redirect('/tasks');
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).send('Failed to update task');
  }
});

// 刪除任務
router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    const taskId = req.params.id;
    console.log('Deleting task ID:', taskId);
    
    const result = await Task.findOneAndDelete({ 
      _id: taskId, 
      user: req.session.userId 
    });
    
    if (!result) {
      console.log('Task not found or access denied for deletion');
    } else {
      console.log('Task deleted successfully');
    }
    
    res.redirect('/tasks');
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).send('Failed to delete task');
  }
});

module.exports = router;
