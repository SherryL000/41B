const express = require('express');
const Task = require('../models/Task');
const router = express.Router();

// Middleware: 驗證登入 (API 版本)


// GET /api/tasks (Read: all or search)
router.get('/tasks', requireAuthApi, async (req, res) => {
  try {
    const { keyword, priority, status } = req.query;
    let query = { user: req.session.userId };
    
    if (keyword) query.title = { $regex: keyword, $options: 'i' };
    if (priority) query.priority = priority;
    if (status) query.status = status;
    
    const tasks = await Task.find(query).sort({ createdAt: -1 });
    res.json({ 
      success: true,
      data: tasks 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// GET /api/tasks/:id (Get single task)
router.get('/tasks/:id', requireAuthApi, async (req, res) => {
  try {
    const task = await Task.findOne({ 
      _id: req.params.id, 
      user: req.session.userId 
    });
    
    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: 'Task not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: task 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Server error' 
    });
  }
});

// POST /api/tasks (Create)
router.post('/tasks', requireAuthApi, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;
    
    if (!title) {
      return res.status(400).json({ 
        success: false,
        error: 'Title is required' 
      });
    }
    
    const task = await Task.create({ 
      title, 
      description, 
      dueDate,
      priority,
      status,
      user: req.session.userId 
    });
    
    res.status(201).json({ 
      success: true,
      data: task 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create task' 
    });
  }
});

// PUT /api/tasks/:id (Update)
router.put('/tasks/:id', requireAuthApi, async (req, res) => {
  try {
    const { title, description, dueDate, priority, status } = req.body;
    
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.session.userId },
      { title, description, dueDate, priority, status },
      { new: true, runValidators: true }
    );
    
    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: 'Task not found' 
      });
    }
    
    res.json({ 
      success: true,
      data: task 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update task' 
    });
  }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', requireAuthApi, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.session.userId 
    });
    
    if (!task) {
      return res.status(404).json({ 
        success: false,
        error: 'Task not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'Task deleted successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete task' 
    });
  }
});

module.exports = router;
