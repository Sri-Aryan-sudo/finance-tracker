const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse');
const authMiddleware = require('../middleware/authMiddleware');
const pool = require('../db');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed.'), false);
    }
  },
});

router.use(authMiddleware);

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded.' });
  }

  const userId = req.user.user_id;
  const csvData = req.file.buffer.toString('utf-8');

  const records = [];
  const errors = [];

  try {
    await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) return reject(err);

        output.forEach((row, index) => {
          const rowNum = index + 2;
          const { date, amount, type, category, subcategory, payment_method, source, description } = row;

          if (!date || !amount || !type || !category) {
            errors.push(`Row ${rowNum}: Missing required fields (date, amount, type, category)`);
            return;
          }

          if (!['income', 'expense'].includes(type.toLowerCase())) {
            errors.push(`Row ${rowNum}: Type must be 'income' or 'expense'`);
            return;
          }

          const parsedAmount = parseFloat(amount);
          if (isNaN(parsedAmount) || parsedAmount <= 0) {
            errors.push(`Row ${rowNum}: Invalid amount`);
            return;
          }

          records.push({
            date, amount: parsedAmount,
            type: type.toLowerCase(), category,
            subcategory: subcategory || null,
            payment_method: payment_method || null,
            source: source || null,
            description: description || null,
          });
        });

        resolve();
      });
    });

    if (records.length === 0) {
      return res.status(400).json({ error: 'No valid records found in CSV.', errors });
    }

    // Batch insert
    const inserted = [];
    for (const record of records) {
      const result = await pool.query(
        `INSERT INTO transactions (user_id, date, amount, type, category, subcategory, payment_method, source, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING transaction_id`,
        [userId, record.date, record.amount, record.type, record.category,
         record.subcategory, record.payment_method, record.source, record.description]
      );
      inserted.push(result.rows[0].transaction_id);
    }

    res.json({
      message: `Successfully imported ${inserted.length} transactions.`,
      inserted_count: inserted.length,
      error_count: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('CSV upload error:', err);
    res.status(500).json({ error: 'Failed to process CSV file.', detail: err.message });
  }
});

// CSV template download
router.get('/template', authMiddleware, (req, res) => {
  const csv = 'date,amount,type,category,subcategory,payment_method,source,description\n2024-01-15,5000,income,Salary,,Bank Transfer,Employer Inc,Monthly salary\n2024-01-20,150.50,expense,Food,Groceries,UPI,SuperMart,Weekly groceries\n';
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="transactions_template.csv"');
  res.send(csv);
});

module.exports = router;
