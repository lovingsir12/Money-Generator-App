# 💰 Money Flow Dashboard

A beautiful, modern personal finance dashboard built with Node.js. Track your income, expenses, and savings goals with an elegant dark-themed interface.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## ✨ Features

- 📊 **Dashboard Overview** - Real-time stats for monthly income, expenses, and balance
- 📈 **Interactive Charts** - Visualize trends with Chart.js (line charts & doughnut charts)
- 💳 **Transaction Management** - Add, view, and delete income/expense transactions
- 🎯 **Savings Goals** - Set financial goals and track your progress
- 🌙 **Dark Theme** - Premium dark UI with glassmorphism effects
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/money-flow-dashboard.git

# Navigate to project directory
cd money-flow-dashboard

# Install dependencies
npm install

# Start the application
npm start
```

The app will be running at **http://localhost:3000**

## 📁 Project Structure

```
money-flow-dashboard/
├── server.js           # Express.js backend with REST API
├── package.json        # Node.js dependencies
├── money_flow.db       # SQLite database (auto-created)
└── public/
    ├── index.html      # Main HTML structure
    ├── styles.css      # Premium dark theme styling
    └── app.js          # Frontend JavaScript logic
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (sql.js) |
| **Frontend** | Vanilla JavaScript, HTML5, CSS3 |
| **Charts** | Chart.js |
| **Styling** | Custom CSS with CSS Variables |

## 📡 API Endpoints

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | Get all transactions |
| `POST` | `/api/transactions` | Create a new transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/goals` | Get all savings goals |
| `POST` | `/api/goals` | Create a new goal |
| `PUT` | `/api/goals/:id` | Update goal progress |
| `DELETE` | `/api/goals/:id` | Delete a goal |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Get dashboard summary data |
| `GET` | `/api/categories` | Get all categories |

## 🎨 Screenshots

### Dashboard View
*Main dashboard with stats, charts, and recent transactions*

### Transaction Management
*Add and filter transactions by type*

### Savings Goals
*Track progress towards financial goals*

## 📝 Usage

### Adding a Transaction
1. Click the **"+ Add Transaction"** button
2. Select **Income** or **Expense**
3. Choose a category
4. Enter the amount and optional description
5. Click **"Add Transaction"**

### Creating a Savings Goal
1. Navigate to the **Goals** tab
2. Click **"+ Add Goal"**
3. Enter goal name and target amount
4. Optionally set a deadline
5. Click **"Save Goal"**

### Updating Goal Progress
1. Go to the **Goals** tab
2. Click **"Update Progress"** on any goal
3. Enter your current saved amount

## 🎯 Categories

### Income Categories
- 💼 Salary
- 💻 Freelance
- 📈 Investments
- 🎁 Gifts
- 💰 Other Income

### Expense Categories
- 🍔 Food & Dining
- 🚗 Transportation
- 🛒 Shopping
- 📄 Bills & Utilities
- 🎮 Entertainment
- 🏥 Health
- 📚 Education
- 📦 Other Expense

## 🔧 Configuration

The server runs on port `3000` by default. You can change this by setting the `PORT` environment variable:

```bash
PORT=8080 npm start
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Your Name**
- GitHub: [@YOUR_USERNAME](https://github.com/YOUR_USERNAME)

---

⭐ Star this repo if you find it helpful!
