import React, { Component } from 'react';
import { createTransaction, updateTransaction } from '../../services/api';
import './index.css';

const CATEGORIES = {
  expense: ['Food', 'Travel', 'Bills', 'Shopping', 'Healthcare', 'Entertainment', 'Education', 'Investment', 'Other'],
  income: ['Salary', 'Freelance', 'Business', 'Investment', 'Rental', 'Gift', 'Other'],
};

const SUBCATEGORIES = {
  Food: ['Groceries', 'Restaurant', 'Snacks', 'Delivery', 'Other'],
  Travel: ['Fuel', 'Public Transport', 'Flight', 'Hotel', 'Cab', 'Other'],
  Bills: ['Electricity', 'Water', 'Internet', 'Phone', 'Rent', 'Insurance', 'Other'],
  Shopping: ['Clothing', 'Electronics', 'Home', 'Beauty', 'Other'],
  Healthcare: ['Medicine', 'Doctor', 'Lab Tests', 'Hospital', 'Other'],
  Entertainment: ['Movies', 'Games', 'Sports', 'Subscriptions', 'Other'],
  Education: ['Books', 'Courses', 'Tuition', 'Other'],
  Salary: ['Monthly', 'Bonus', 'Commission', 'Other'],
  Freelance: ['Design', 'Development', 'Writing', 'Consulting', 'Other'],
};

const PAYMENT_METHODS = ['UPI', 'Card', 'Cash', 'Bank Transfer', 'Net Banking', 'Cheque', 'Other'];

class TransactionForm extends Component {
  constructor(props) {
    super(props);
    const t = props.transaction || {};
    this.state = {
      type: t.type || 'expense',
      date: t.date ? t.date.split('T')[0] : new Date().toISOString().split('T')[0],
      amount: t.amount || '',
      category: t.category || '',
      subcategory: t.subcategory || '',
      payment_method: t.payment_method || '',
      source: t.source || '',
      description: t.description || '',
      loading: false,
      error: '',
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(field, value) {
    const update = { [field]: value };
    if (field === 'type') update.category = '';
    if (field === 'category') update.subcategory = '';
    this.setState(update);
  }

  async handleSubmit(e) {
    e.preventDefault();
    const { type, date, amount, category, subcategory, payment_method, source, description } = this.state;

    if (!date || !amount || !category) {
      this.setState({ error: 'Please fill in required fields.' });
      return;
    }

    this.setState({ loading: true, error: '' });
    try {
      const payload = { type, date, amount: parseFloat(amount), category, subcategory, payment_method, source, description };
      let result;
      if (this.props.transaction?.transaction_id) {
        result = await updateTransaction(this.props.transaction.transaction_id, payload);
      } else {
        result = await createTransaction(payload);
      }
      if (this.props.onSuccess) this.props.onSuccess(result);
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { type, date, amount, category, subcategory, payment_method, source, description, loading, error } = this.state;
    const { onCancel, transaction } = this.props;
    const isEdit = !!transaction?.transaction_id;
    const categories = CATEGORIES[type] || [];
    const subcategories = SUBCATEGORIES[category] || [];

    return (
      <form className="transaction-form" onSubmit={this.handleSubmit}>
        {error && (
          <div style={{ padding: '10px 14px', background: 'var(--red-50)', color: 'var(--red-600)', borderRadius: 8, marginBottom: 18, fontSize: 14 }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Transaction Type *</label>
          <div className="type-toggle">
            {['expense', 'income'].map(t => (
              <button
                key={t}
                type="button"
                className={`type-btn ${t} ${type === t ? 'active' : ''}`}
                onClick={() => this.handleChange('type', t)}
              >
                <span className="material-icons-round" style={{ fontSize: 18 }}>
                  {t === 'income' ? 'trending_up' : 'trending_down'}
                </span>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={e => this.handleChange('date', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input
              type="number"
              className="form-control"
              placeholder="0.00"
              value={amount}
              min="0.01" step="0.01"
              onChange={e => this.handleChange('amount', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-control"
              value={category}
              onChange={e => this.handleChange('category', e.target.value)}
              required
            >
              <option value="">Select category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Subcategory</label>
            <select
              className="form-control"
              value={subcategory}
              onChange={e => this.handleChange('subcategory', e.target.value)}
            >
              <option value="">Select subcategory</option>
              {subcategories.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select
              className="form-control"
              value={payment_method}
              onChange={e => this.handleChange('payment_method', e.target.value)}
            >
              <option value="">Select method</option>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Source / Merchant</label>
            <input
              type="text"
              className="form-control"
              placeholder={type === 'income' ? 'e.g., Employer Inc' : 'e.g., Amazon'}
              value={source}
              onChange={e => this.handleChange('source', e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description / Notes</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="Add any notes..."
            value={description}
            onChange={e => this.handleChange('description', e.target.value)}
            style={{ resize: 'vertical', minHeight: 80 }}
          />
        </div>

        <div className="modal-footer" style={{ padding: 0, paddingTop: 8 }}>
          {onCancel && (
            <button type="button" className="btn btn-outline" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : null}
            {isEdit ? 'Update Transaction' : 'Add Transaction'}
          </button>
        </div>
      </form>
    );
  }
}

export default TransactionForm;
