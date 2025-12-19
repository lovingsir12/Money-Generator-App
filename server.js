const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let db;
const DB_PATH = path.join(__dirname, 'money_flow.db');

// Initialize Database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      icon TEXT,
      color TEXT
    )
  `);

  // Seed default categories if empty
  const result = db.exec('SELECT COUNT(*) as count FROM categories');
  const count = result.length > 0 ? result[0].values[0][0] : 0;

  if (count === 0) {
    const defaultCategories = [
      // Income categories
      { name: 'Salary', type: 'income', icon: '💼', color: '#10b981' },
      { name: 'Freelance', type: 'income', icon: '💻', color: '#6366f1' },
      { name: 'Investments', type: 'income', icon: '📈', color: '#f59e0b' },
      { name: 'Gifts', type: 'income', icon: '🎁', color: '#ec4899' },
      { name: 'Other Income', type: 'income', icon: '💰', color: '#8b5cf6' },
      // Expense categories
      { name: 'Food & Dining', type: 'expense', icon: '🍔', color: '#ef4444' },
      { name: 'Transportation', type: 'expense', icon: '🚗', color: '#f97316' },
      { name: 'Shopping', type: 'expense', icon: '🛒', color: '#a855f7' },
      { name: 'Bills & Utilities', type: 'expense', icon: '📄', color: '#64748b' },
      { name: 'Entertainment', type: 'expense', icon: '🎮', color: '#06b6d4' },
      { name: 'Health', type: 'expense', icon: '🏥', color: '#22c55e' },
      { name: 'Education', type: 'expense', icon: '📚', color: '#3b82f6' },
      { name: 'Other Expense', type: 'expense', icon: '📦', color: '#78716c' },
    ];

    for (const cat of defaultCategories) {
      db.run('INSERT INTO categories (name, type, icon, color) VALUES (?, ?, ?, ?)',
        [cat.name, cat.type, cat.icon, cat.color]);
    }
    saveDatabase();
  }

  console.log('💾 Database initialized');
}

// Save database to file
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper to run query and get results as objects
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push(row);
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0]?.values[0][0] };
}

// ============== API ROUTES ==============

// Get dashboard summary
app.get('/api/dashboard', (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Total income this month
    const incomeResult = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'income' AND date LIKE ?
    `, [`${currentMonth}%`]);

    // Total expenses this month
    const expenseResult = queryOne(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM transactions 
      WHERE type = 'expense' AND date LIKE ?
    `, [`${currentMonth}%`]);

    // All-time totals
    const allTimeIncome = queryOne(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'income'`);
    const allTimeExpense = queryOne(`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'expense'`);

    // Recent transactions
    const recentTransactions = queryAll(`
      SELECT t.*, c.icon, c.color 
      FROM transactions t
      LEFT JOIN categories c ON t.category = c.name
      ORDER BY t.date DESC, t.id DESC 
      LIMIT 10
    `);

    // Goals progress
    const goals = queryAll('SELECT * FROM goals ORDER BY created_at DESC');

    // Monthly trend (last 6 months)
    const monthlyTrend = queryAll(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions
      WHERE date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `);

    // Expense breakdown by category
    const expenseByCategory = queryAll(`
      SELECT 
        t.category, 
        c.icon,
        c.color,
        SUM(t.amount) as total
      FROM transactions t
      LEFT JOIN categories c ON t.category = c.name
      WHERE t.type = 'expense' AND t.date LIKE ?
      GROUP BY t.category
      ORDER BY total DESC
    `, [`${currentMonth}%`]);

    res.json({
      monthlyIncome: incomeResult?.total || 0,
      monthlyExpense: expenseResult?.total || 0,
      monthlyBalance: (incomeResult?.total || 0) - (expenseResult?.total || 0),
      allTimeBalance: (allTimeIncome?.total || 0) - (allTimeExpense?.total || 0),
      recentTransactions,
      goals,
      monthlyTrend,
      expenseByCategory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all transactions
app.get('/api/transactions', (req, res) => {
  try {
    const { type, month, limit = 50 } = req.query;
    let query = `
      SELECT t.*, c.icon, c.color 
      FROM transactions t
      LEFT JOIN categories c ON t.category = c.name
      WHERE 1=1
    `;
    const params = [];

    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    if (month) {
      query += ' AND t.date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY t.date DESC, t.id DESC LIMIT ?';
    params.push(parseInt(limit));

    const transactions = queryAll(query, params);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add transaction
app.post('/api/transactions', (req, res) => {
  try {
    const { type, category, amount, description, date } = req.body;

    if (!type || !category || !amount || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = runQuery(`
      INSERT INTO transactions (type, category, amount, description, date)
      VALUES (?, ?, ?, ?, ?)
    `, [type, category, parseFloat(amount), description || '', date]);

    res.json({ id: result.lastInsertRowid, message: 'Transaction added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete transaction
app.delete('/api/transactions/:id', (req, res) => {
  try {
    runQuery('DELETE FROM transactions WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories
app.get('/api/categories', (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM categories';
    const params = [];

    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }

    const categories = queryAll(query, params);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all goals
app.get('/api/goals', (req, res) => {
  try {
    const goals = queryAll('SELECT * FROM goals ORDER BY created_at DESC');
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add goal
app.post('/api/goals', (req, res) => {
  try {
    const { name, target_amount, current_amount = 0, deadline, color = '#6366f1' } = req.body;

    if (!name || !target_amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = runQuery(`
      INSERT INTO goals (name, target_amount, current_amount, deadline, color)
      VALUES (?, ?, ?, ?, ?)
    `, [name, parseFloat(target_amount), parseFloat(current_amount), deadline || null, color]);

    res.json({ id: result.lastInsertRowid, message: 'Goal added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update goal
app.put('/api/goals/:id', (req, res) => {
  try {
    const { name, target_amount, current_amount, deadline, color } = req.body;
    const id = parseInt(req.params.id);

    // Get current goal
    const currentGoal = queryOne('SELECT * FROM goals WHERE id = ?', [id]);
    if (!currentGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    runQuery(`
      UPDATE goals 
      SET name = ?,
          target_amount = ?,
          current_amount = ?,
          deadline = ?,
          color = ?
      WHERE id = ?
    `, [
      name ?? currentGoal.name,
      target_amount ?? currentGoal.target_amount,
      current_amount ?? currentGoal.current_amount,
      deadline ?? currentGoal.deadline,
      color ?? currentGoal.color,
      id
    ]);

    res.json({ message: 'Goal updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete goal
app.delete('/api/goals/:id', (req, res) => {
  try {
    runQuery('DELETE FROM goals WHERE id = ?', [parseInt(req.params.id)]);
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`💰 Money Flow Dashboard running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
