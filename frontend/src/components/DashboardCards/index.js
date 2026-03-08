import React, { Component } from 'react';
import './index.css';

class SummaryCard extends Component {
  formatCurrency(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(value));
  }

  render() {
    const { type, label, value, icon, isCount } = this.props;

    let valueClass = type;
    if (type === 'balance') {
      valueClass = parseFloat(value) >= 0 ? 'balance-positive' : 'balance-negative';
    }

    return (
      <div className={`summary-card ${type} fade-in`}>
        <div className={`card-icon ${type}`}>
          <span className="material-icons-round">{icon}</span>
        </div>
        <div className="card-label">{label}</div>
        <div className={`card-value ${valueClass}`}>
          {isCount ? value : (
            <>
              {type === 'balance' && parseFloat(value) < 0 ? '−' : ''}
              {this.formatCurrency(value)}
            </>
          )}
        </div>
        <div className="card-change">
          <span className="material-icons-round">schedule</span>
          All time
        </div>
      </div>
    );
  }
}

class DashboardCards extends Component {
  render() {
    const { summary, loading } = this.props;

    const cards = [
      { type: 'income', label: 'Total Income', value: summary?.total_income || 0, icon: 'trending_up' },
      { type: 'expense', label: 'Total Expenses', value: summary?.total_expenses || 0, icon: 'trending_down' },
      { type: 'balance', label: 'Net Balance', value: summary?.net_balance || 0, icon: 'account_balance' },
      { type: 'count', label: 'Transactions', value: summary?.transaction_count || 0, icon: 'receipt', isCount: true },
    ];

    if (loading) {
      return (
        <div className="cards-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="summary-card">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 140, height: 32 }} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="cards-grid">
        {cards.map(card => (
          <SummaryCard key={card.type} {...card} />
        ))}
      </div>
    );
  }
}

export default DashboardCards;
