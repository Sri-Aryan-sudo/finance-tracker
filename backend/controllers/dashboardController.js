const pool = require('../db');

const getDashboard = async (req, res) => {
  const userId = req.user.user_id;
  const { year, month } = req.query;

  try {
    let dateFilter = '';
    const values = [userId];

    if (year && month) {
      dateFilter = `AND EXTRACT(YEAR FROM date) = $2 AND EXTRACT(MONTH FROM date) = $3`;
      values.push(parseInt(year), parseInt(month));
    } else if (year) {
      dateFilter = `AND EXTRACT(YEAR FROM date) = $2`;
      values.push(parseInt(year));
    }

    const summaryResult = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COUNT(*) AS transaction_count
       FROM transactions
       WHERE user_id = $1 ${dateFilter}`,
      values
    );

    const summary = summaryResult.rows[0];
    const totalIncome = parseFloat(summary.total_income);
    const totalExpenses = parseFloat(summary.total_expenses);
    const netBalance = totalIncome - totalExpenses;

    // Monthly trend for current year
    const currentYear = year || new Date().getFullYear();
    const trendResult = await pool.query(
      `SELECT
        EXTRACT(MONTH FROM date) AS month,
        EXTRACT(YEAR FROM date) AS year,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expenses
       FROM transactions
       WHERE user_id = $1 AND EXTRACT(YEAR FROM date) = $2
       GROUP BY EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date)
       ORDER BY month`,
      [userId, currentYear]
    );

    // Category breakdown for expenses
    const categoryResult = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' ${dateFilter}
       GROUP BY category
       ORDER BY total DESC`,
      values
    );

    // Income by source
    const sourceResult = await pool.query(
      `SELECT COALESCE(source, 'Other') AS source, COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND type = 'income' ${dateFilter}
       GROUP BY source
       ORDER BY total DESC`,
      values
    );

    res.json({
      summary: {
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_balance: netBalance,
        transaction_count: parseInt(summary.transaction_count),
      },
      monthly_trend: trendResult.rows,
      expense_by_category: categoryResult.rows,
      income_by_source: sourceResult.rows,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
};

module.exports = { getDashboard };
