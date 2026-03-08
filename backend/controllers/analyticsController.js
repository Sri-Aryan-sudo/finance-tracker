const pool = require('../db');

const getAnalytics = async (req, res) => {
  const userId = req.user.user_id;
  const { year, type = 'expense' } = req.query;

  const currentYear = year || new Date().getFullYear();

  try {
    // Category level
    const categoryResult = await pool.query(
      `SELECT category, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 AND type = $2 AND EXTRACT(YEAR FROM date) = $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, type, currentYear]
    );

    // Subcategory level
    const subcategoryResult = await pool.query(
      `SELECT category, COALESCE(subcategory, 'Other') AS subcategory,
              COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 AND type = $2 AND EXTRACT(YEAR FROM date) = $3
       GROUP BY category, subcategory
       ORDER BY total DESC`,
      [userId, type, currentYear]
    );

    // Source level
    const sourceResult = await pool.query(
      `SELECT category, COALESCE(subcategory, 'Other') AS subcategory,
              COALESCE(source, 'Unknown') AS source,
              COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
       FROM transactions
       WHERE user_id = $1 AND type = $2 AND EXTRACT(YEAR FROM date) = $3
       GROUP BY category, subcategory, source
       ORDER BY total DESC`,
      [userId, type, currentYear]
    );

    // Monthly breakdown
    const monthlyResult = await pool.query(
      `SELECT
        EXTRACT(MONTH FROM date) AS month,
        category,
        COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = $1 AND type = $2 AND EXTRACT(YEAR FROM date) = $3
       GROUP BY month, category
       ORDER BY month, total DESC`,
      [userId, type, currentYear]
    );

    res.json({
      by_category: categoryResult.rows,
      by_subcategory: subcategoryResult.rows,
      by_source: sourceResult.rows,
      monthly_by_category: monthlyResult.rows,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics.' });
  }
};

module.exports = { getAnalytics };
