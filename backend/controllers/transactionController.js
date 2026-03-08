const pool = require('../db');

const getTransactions = async (req, res) => {
  const userId = req.user.user_id;
  const {
    type, category, payment_method,
    date_from, date_to,
    search,
    page = 1, limit = 20,
    sort_by = 'date', sort_order = 'DESC',
  } = req.query;

  const allowedSortColumns = ['date', 'amount', 'category', 'type', 'created_at'];
  const allowedOrders = ['ASC', 'DESC'];
  const safeSort = allowedSortColumns.includes(sort_by) ? sort_by : 'date';
  const safeOrder = allowedOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

  const conditions = ['user_id = $1'];
  const values = [userId];
  let idx = 2;

  if (type) { conditions.push(`type = $${idx++}`); values.push(type); }
  if (category) { conditions.push(`category = $${idx++}`); values.push(category); }
  if (payment_method) { conditions.push(`payment_method = $${idx++}`); values.push(payment_method); }
  if (date_from) { conditions.push(`date >= $${idx++}`); values.push(date_from); }
  if (date_to) { conditions.push(`date <= $${idx++}`); values.push(date_to); }
  if (search) {
    conditions.push(`(description ILIKE $${idx} OR category ILIKE $${idx} OR source ILIKE $${idx} OR subcategory ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }

  const whereClause = conditions.join(' AND ');
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM transactions WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await pool.query(
      `SELECT * FROM transactions WHERE ${whereClause} ORDER BY ${safeSort} ${safeOrder} LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, parseInt(limit), offset]
    );

    res.json({
      transactions: dataResult.rows,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions.' });
  }
};

const getTransaction = async (req, res) => {
  const userId = req.user.user_id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM transactions WHERE transaction_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get transaction error:', err);
    res.status(500).json({ error: 'Failed to fetch transaction.' });
  }
};

const createTransaction = async (req, res) => {
  const userId = req.user.user_id;
  const { date, amount, type, category, subcategory, payment_method, source, description } = req.body;

  if (!date || !amount || !type || !category) {
    return res.status(400).json({ error: 'Date, amount, type, and category are required.' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be income or expense.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO transactions (user_id, date, amount, type, category, subcategory, payment_method, source, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, date, parseFloat(amount), type, category, subcategory || null, payment_method || null, source || null, description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to create transaction.' });
  }
};

const updateTransaction = async (req, res) => {
  const userId = req.user.user_id;
  const { id } = req.params;
  const { date, amount, type, category, subcategory, payment_method, source, description } = req.body;

  try {
    const existing = await pool.query(
      'SELECT transaction_id FROM transactions WHERE transaction_id = $1 AND user_id = $2',
      [id, userId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const result = await pool.query(
      `UPDATE transactions SET
        date = COALESCE($1, date),
        amount = COALESCE($2, amount),
        type = COALESCE($3, type),
        category = COALESCE($4, category),
        subcategory = $5,
        payment_method = $6,
        source = $7,
        description = $8
       WHERE transaction_id = $9 AND user_id = $10
       RETURNING *`,
      [date, amount ? parseFloat(amount) : null, type, category, subcategory, payment_method, source, description, id, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: 'Failed to update transaction.' });
  }
};

const deleteTransaction = async (req, res) => {
  const userId = req.user.user_id;
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE transaction_id = $1 AND user_id = $2 RETURNING transaction_id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    res.json({ message: 'Transaction deleted successfully.' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: 'Failed to delete transaction.' });
  }
};

module.exports = { getTransactions, getTransaction, createTransaction, updateTransaction, deleteTransaction };
