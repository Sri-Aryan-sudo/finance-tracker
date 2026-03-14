import React, { Component } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getTransactions, deleteTransaction, exportTransactionsCSV } from '../../services/api';
import TransactionTable from '../../components/TransactionTable';
import TransactionForm from '../../components/TransactionForm';
import './index.css';

function withRouter(Comp) {
  return function Wrapped(props) {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    return <Comp {...props} navigate={navigate} searchParams={searchParams} setSearchParams={setSearchParams} />;
  };
}

class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      transactions: [],
      pagination: { total: 0, page: 1, limit: 20, total_pages: 1 },
      filters: {
        type: '', category: '', payment_method: '',
        date_from: '', date_to: '', search: '',
        sort_by: 'date', sort_order: 'DESC',
      },
      loading: false,
      showForm: false,
      editTransaction: null,
      deleteTarget: null,
      deleting: false,
    };
    this.loadTransactions = this.loadTransactions.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleFormSuccess = this.handleFormSuccess.bind(this);
    this.handleDelete = this.handleDelete.bind(this);
    this.confirmDelete = this.confirmDelete.bind(this);
    this.handleExport = this.handleExport.bind(this);
  }

  componentDidMount() {
    const add = this.props.searchParams?.get('add');
    if (add === 'true') this.setState({ showForm: true });
    this.loadTransactions(1);
  }

  async loadTransactions(page = 1) {
    this.setState({ loading: true });
    const { filters } = this.state;
    const params = { ...filters, page, limit: 20 };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    try {
      const data = await getTransactions(params);
      this.setState({ transactions: data.transactions, pagination: { ...data.pagination, page }, loading: false });
    } catch {
      this.setState({ loading: false });
    }
  }

  handleFilterChange(key, value) {
    this.setState(
      prev => ({ filters: { ...prev.filters, [key]: value } }),
      () => this.loadTransactions(1)
    );
  }

  handleFormSuccess() {
    this.setState({ showForm: false, editTransaction: null });
    this.loadTransactions(this.state.pagination.page);
  }

  async confirmDelete() {
    const { deleteTarget } = this.state;
    if (!deleteTarget) return;
    this.setState({ deleting: true });
    try {
      await deleteTransaction(deleteTarget.transaction_id);
      this.setState({ deleteTarget: null, deleting: false });
      this.loadTransactions(this.state.pagination.page);
    } catch {
      this.setState({ deleting: false });
    }
  }

  handleDelete(tx) { this.setState({ deleteTarget: tx }); }

  handleExport() {
    const { filters } = this.state;
    const params = { ...filters };
    Object.keys(params).forEach(k => !params[k] && delete params[k]);
    exportTransactionsCSV(params);
  }

  renderFilters() {
    const { filters } = this.state;
    return (
      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="material-icons-round search-icon">search</span>
          <input
            className="search-input"
            placeholder="Search transactions..."
            value={filters.search}
            onChange={e => this.handleFilterChange('search', e.target.value)}
          />
        </div>

        <select className="filter-select" value={filters.type} onChange={e => this.handleFilterChange('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select className="filter-select" value={filters.category} onChange={e => this.handleFilterChange('category', e.target.value)}>
          <option value="">All Categories</option>
          {['Food','Travel','Bills','Shopping','Healthcare','Entertainment','Education','Investment','Salary','Freelance','Business','Other'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select className="filter-select" value={filters.payment_method} onChange={e => this.handleFilterChange('payment_method', e.target.value)}>
          <option value="">All Payments</option>
          {['UPI','Card','Cash','Bank Transfer','Net Banking'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <input type="date" className="filter-select" value={filters.date_from} onChange={e => this.handleFilterChange('date_from', e.target.value)} title="From date" />
        <input type="date" className="filter-select" value={filters.date_to} onChange={e => this.handleFilterChange('date_to', e.target.value)} title="To date" />

        <select className="filter-select" value={`${filters.sort_by}:${filters.sort_order}`} onChange={e => {
          const [sort_by, sort_order] = e.target.value.split(':');
          this.setState(prev => ({ filters: { ...prev.filters, sort_by, sort_order } }), () => this.loadTransactions(1));
        }}>
          <option value="date:DESC">Newest First</option>
          <option value="date:ASC">Oldest First</option>
          <option value="amount:DESC">Highest Amount</option>
          <option value="amount:ASC">Lowest Amount</option>
        </select>
      </div>
    );
  }

  renderPagination() {
    const { pagination, loading } = this.state;
    if (pagination.total_pages <= 1) return null;

    const pages = Array.from({ length: pagination.total_pages }, (_, i) => i + 1);
    const visible = pages.filter(p => p === 1 || p === pagination.total_pages || Math.abs(p - pagination.page) <= 1);

    return (
      <div className="pagination">
        <span className="pagination-info">
          {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
        </span>
        <div className="pagination-controls">
          <button className="page-btn" disabled={pagination.page === 1 || loading} onClick={() => this.loadTransactions(pagination.page - 1)}>
            <span className="material-icons-round" style={{ fontSize: 15 }}>chevron_left</span>
          </button>
          {visible.map((p, i) => {
            const prev = visible[i - 1];
            return (
              <React.Fragment key={p}>
                {prev && p - prev > 1 && <span style={{ color: 'var(--gray-400)', padding: '0 2px', fontSize: 13 }}>…</span>}
                <button className={`page-btn ${p === pagination.page ? 'active' : ''}`} onClick={() => this.loadTransactions(p)} disabled={loading}>{p}</button>
              </React.Fragment>
            );
          })}
          <button className="page-btn" disabled={pagination.page === pagination.total_pages || loading} onClick={() => this.loadTransactions(pagination.page + 1)}>
            <span className="material-icons-round" style={{ fontSize: 15 }}>chevron_right</span>
          </button>
        </div>
      </div>
    );
  }

  render() {
    const { transactions, loading, showForm, editTransaction, deleteTarget, deleting } = this.state;

    return (
      <div className="page-container fade-in">
        <div className="transactions-page-header">
          <div>
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">Manage and track all your financial records</p>
          </div>
          <div className="transactions-page-actions">
            <button className="btn btn-outline" onClick={this.handleExport}>
              <span className="material-icons-round" style={{ fontSize: 15 }}>download</span>
              <span>Export</span>
            </button>
            <button className="btn btn-primary" onClick={() => this.setState({ showForm: true, editTransaction: null })}>
              <span className="material-icons-round" style={{ fontSize: 15 }}>add</span>
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="transactions-card">
          {this.renderFilters()}
          <TransactionTable
            transactions={transactions}
            loading={loading}
            onEdit={tx => this.setState({ editTransaction: tx, showForm: true })}
            onDelete={this.handleDelete}
            onView={tx => this.props.navigate(`/transactions/${tx.transaction_id}`)}
          />
          {this.renderPagination()}
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && this.setState({ showForm: false, editTransaction: null })}>
            <div className="modal">
              <div className="modal-header">
                <h2 className="modal-title">{editTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
                <button className="btn btn-ghost" style={{ padding: 6 }} onClick={() => this.setState({ showForm: false, editTransaction: null })}>
                  <span className="material-icons-round">close</span>
                </button>
              </div>
              <div className="modal-body">
                <TransactionForm
                  transaction={editTransaction}
                  onSuccess={this.handleFormSuccess}
                  onCancel={() => this.setState({ showForm: false, editTransaction: null })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm */}
        {deleteTarget && (
          <div className="delete-confirm-overlay">
            <div className="delete-confirm-card">
              <div className="delete-icon">
                <span className="material-icons-round">delete_forever</span>
              </div>
              <h3 className="delete-confirm-title">Delete Transaction?</h3>
              <p className="delete-confirm-msg">This action cannot be undone.</p>
              <div className="delete-confirm-actions">
                <button className="btn btn-outline" onClick={() => this.setState({ deleteTarget: null })}>Cancel</button>
                <button className="btn btn-danger" onClick={this.confirmDelete} disabled={deleting}>
                  {deleting ? <span className="spinner" /> : null}
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(Transactions);
