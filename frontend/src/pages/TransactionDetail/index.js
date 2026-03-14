import React, { Component } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTransaction } from '../../services/api';
import TransactionForm from '../../components/TransactionForm';
import './index.css';

function withRouter(Comp) {
  return function Wrapped(props) {
    const params = useParams();
    const navigate = useNavigate();
    return <Comp {...props} params={params} navigate={navigate} />;
  };
}

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

class TransactionDetail extends Component {
  constructor(props) {
    super(props);
    this.state = { transaction: null, loading: true, error: null, editing: false };
    this.handleEditSuccess = this.handleEditSuccess.bind(this);
  }

  componentDidMount() {
    this.loadTransaction();
  }

  async loadTransaction() {
    this.setState({ loading: true });
    try {
      const tx = await getTransaction(this.props.params.id);
      this.setState({ transaction: tx, loading: false });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
    }
  }

  handleEditSuccess(updated) {
    this.setState({ transaction: updated, editing: false });
  }

  render() {
    const { transaction: tx, loading, error, editing } = this.state;
    const { navigate } = this.props;

    if (loading) {
      return (
        <div className="page-container">
          <div className="skeleton" style={{ height: 36, width: 160, marginBottom: 20, borderRadius: 8 }} />
          <div className="skeleton" style={{ height: 280, borderRadius: 16 }} />
        </div>
      );
    }

    if (error || !tx) {
      return (
        <div className="page-container">
          <div className="empty-state">
            <span className="material-icons-round">error_outline</span>
            <h3>Transaction not found</h3>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/transactions')}>
              Back to Transactions
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page-container fade-in detail-page">
        <button className="back-btn" onClick={() => navigate('/transactions')}>
          <span className="material-icons-round" style={{ fontSize: 18 }}>arrow_back</span>
          Back to Transactions
        </button>

        {editing ? (
          <div className="card detail-edit-card">
            <h2 className="detail-edit-title">Edit Transaction</h2>
            <TransactionForm
              transaction={tx}
              onSuccess={this.handleEditSuccess}
              onCancel={() => this.setState({ editing: false })}
            />
          </div>
        ) : (
          <div className="detail-card">
            <div className="detail-header">
              <div>
                <div className={`detail-amount ${tx.type}`}>
                  {tx.type === 'income' ? '+' : '−'}{formatCurrency(tx.amount)}
                </div>
                <div className="detail-meta">
                  <span className={`badge badge-${tx.type}`}>{tx.type}</span>
                  <span className="detail-date">{formatDate(tx.date)}</span>
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => this.setState({ editing: true })}>
                <span className="material-icons-round" style={{ fontSize: 15 }}>edit</span>
                Edit
              </button>
            </div>

            <div className="detail-body">
              <div className="detail-grid">
                <div className="detail-field">
                  <label>Category</label>
                  <div className="value">{tx.category}</div>
                </div>
                <div className="detail-field">
                  <label>Subcategory</label>
                  <div className="value">{tx.subcategory || '—'}</div>
                </div>
                <div className="detail-field">
                  <label>Payment Method</label>
                  <div className="value">{tx.payment_method || '—'}</div>
                </div>
                <div className="detail-field">
                  <label>Source / Merchant</label>
                  <div className="value">{tx.source || '—'}</div>
                </div>
                <div className="detail-field">
                  <label>Transaction ID</label>
                  <div className="value mono detail-muted">#{tx.transaction_id}</div>
                </div>
                <div className="detail-field">
                  <label>Added On</label>
                  <div className="value detail-muted">
                    {new Date(tx.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="detail-description">
                <label>Notes / Description</label>
                <p>{tx.description || 'No description provided.'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default withRouter(TransactionDetail);
