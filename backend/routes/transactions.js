const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getTransactions, getTransaction,
  createTransaction, updateTransaction, deleteTransaction
} = require('../controllers/transactionController');

router.use(authMiddleware);

router.get('/', getTransactions);
router.get('/:id', getTransaction);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
