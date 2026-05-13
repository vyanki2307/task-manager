const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'yoursecretkey123';

let users = [];
let tasks = [];

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const existing = users.find(u => u.username === username);
    if (existing) return res.status(400).json({ message: 'Username already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = { id: Date.now().toString(), username, password: hashed };
    users.push(user);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);
    if (!user) return res.status(400).json({ message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Wrong password' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in' });
  }
});

app.get('/api/tasks', auth, async (req, res) => {
  try {
    const userTasks = tasks.filter(t => t.userId === req.userId);
    res.json(userTasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

app.post('/api/tasks', auth, async (req, res) => {
  try {
    const { title, description, priority } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required' });
    const task = {
      _id: Date.now().toString(),
      title,
      description,
      priority: priority || 'medium',
      status: 'pending',
      userId: req.userId,
      createdAt: new Date()
    };
    tasks.push(task);
    res.status(201).json({ message: 'Task created!', task });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    const index = tasks.findIndex(t => t._id === req.params.id && t.userId === req.userId);
    if (index === -1) return res.status(404).json({ message: 'Task not found' });
    tasks[index] = { ...tasks[index], title, description, status, priority };
    res.json({ message: 'Task updated!', task: tasks[index] });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  try {
    tasks = tasks.filter(t => !(t._id === req.params.id && t.userId === req.userId));
    res.json({ message: 'Task deleted!' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

app.listen(5000, () => console.log('Server running on http://localhost:5000'));