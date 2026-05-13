const API = 'http://localhost:5000';
let allTasks = [];
let currentFilter = 'all';

function getToken() {
  return localStorage.getItem('token');
}

function showTab(tab) {
  document.getElementById('login-tab').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('register-tab').style.display = tab === 'register' ? 'block' : 'none';
  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
  });
}

async function register() {
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const message = document.getElementById('register-message');
  if (!username || !password) {
    message.style.color = '#ff6b6b';
    message.textContent = 'Please fill all fields!';
    return;
  }
  try {
    const res = await fetch(`${API}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      message.style.color = '#00cc88';
      message.textContent = 'Registered! Please login now.';
      showTab('login');
    } else {
      message.style.color = '#ff6b6b';
      message.textContent = data.message;
    }
  } catch {
    message.style.color = '#ff6b6b';
    message.textContent = 'Server error. Is server running?';
  }
}

async function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const message = document.getElementById('login-message');
  if (!username || !password) {
    message.style.color = '#ff6b6b';
    message.textContent = 'Please fill all fields!';
    return;
  }
  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      showDashboard();
    } else {
      message.style.color = '#ff6b6b';
      message.textContent = data.message;
    }
  } catch {
    message.style.color = '#ff6b6b';
    message.textContent = 'Server error. Is server running?';
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('username');
  document.getElementById('auth-section').style.display = 'flex';
  document.getElementById('dashboard-section').style.display = 'none';
}

function showDashboard() {
  document.getElementById('auth-section').style.display = 'none';
  document.getElementById('dashboard-section').style.display = 'block';
  document.getElementById('welcome-text').textContent = `Hi, ${localStorage.getItem('username')}!`;
  fetchTasks();
}

async function fetchTasks() {
  try {
    const res = await fetch(`${API}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    allTasks = await res.json();
    updateStats();
    renderTasks();
  } catch {
    document.getElementById('tasks-container').innerHTML = '<p class="empty-text">Could not load tasks.</p>';
  }
}

function updateStats() {
  document.getElementById('total-tasks').textContent = allTasks.length;
  document.getElementById('pending-tasks').textContent = allTasks.filter(t => t.status === 'pending').length;
  document.getElementById('inprogress-tasks').textContent = allTasks.filter(t => t.status === 'inprogress').length;
  document.getElementById('completed-tasks').textContent = allTasks.filter(t => t.status === 'completed').length;
}

function filterTasks(filter) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderTasks();
}

function renderTasks() {
  const container = document.getElementById('tasks-container');
  const filtered = currentFilter === 'all' ? allTasks : allTasks.filter(t => t.status === currentFilter);
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-text">No tasks found!</p>';
    return;
  }
  container.innerHTML = filtered.map(task => `
    <div class="task-card">
      <div class="task-header">
        <p class="task-title">${task.title}</p>
        <span class="priority-badge priority-${task.priority}">${task.priority}</span>
      </div>
      <p class="task-description">${task.description || 'No description'}</p>
      <div class="task-footer">
        <select class="status-select" onchange="updateTask('${task._id}', this.value)">
          <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>Pending</option>
          <option value="inprogress" ${task.status === 'inprogress' ? 'selected' : ''}>In Progress</option>
          <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
        <button class="delete-btn" onclick="deleteTask('${task._id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

async function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const description = document.getElementById('task-description').value.trim();
  const priority = document.getElementById('task-priority').value;
  const message = document.getElementById('task-message');
  if (!title) {
    message.style.color = '#ff6b6b';
    message.textContent = 'Title is required!';
    return;
  }
  try {
    await fetch(`${API}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ title, description, priority })
    });
    message.style.color = '#00cc88';
    message.textContent = 'Task added!';
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    fetchTasks();
  } catch {
    message.style.color = '#ff6b6b';
    message.textContent = 'Error adding task!';
  }
}

async function updateTask(id, status) {
  const task = allTasks.find(t => t._id === id);
  try {
    await fetch(`${API}/api/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ ...task, status })
    });
    fetchTasks();
  } catch {
    console.error('Error updating task');
  }
}

async function deleteTask(id) {
  try {
    await fetch(`${API}/api/tasks/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    fetchTasks();
  } catch {
    console.error('Error deleting task');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (getToken()) {
    showDashboard();
  }
});