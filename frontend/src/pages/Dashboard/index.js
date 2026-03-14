import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, getTransactions } from '../../services/api';
import DashboardCards from '../../components/DashboardCards';
import { MonthlyTrendChart, ExpenseCategoryPie, IncomeSourceChart } from '../../components/Charts';
import TransactionTable from '../../components/TransactionTable';
import './index.css';

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dashboardData: null,
      recentTransactions: [],
      loading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  async loadData() {
    this.setState({ loading: true });
    try {
      const [dashboard, txData] = await Promise.all([
        getDashboard(),
        getTransactions({ limit: 5, sort_by: 'date', sort_order: 'DESC' }),
      ]);
      this.setState({
        dashboardData: dashboard,
        recentTransactions: txData.transactions || [],
        loading: false,
      });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
    }
  }

  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  render() {
    const { dashboardData, recentTransactions, loading, error } = this.state;
    let user = {};
    try { user = JSON.parse(localStorage.getItem('user')) || {}; } catch {}

    if (error) {
      return (
        <div className="page-container">
          <div className="empty-state">
            <span className="material-icons-round">error_outline</span>
            <h3>Failed to load dashboard</h3>
            <p>{error}</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => this.loadData()}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="page-container fade-in">
        <div className="dashboard-welcome">
          <h2>{this.getGreeting()}, {user.name?.split(' ')[0] || 'there'} 👋</h2>
          <p>Here's your financial overview for {new Date().getFullYear()}</p>
        </div>

        <DashboardCards summary={dashboardData?.summary} loading={loading} />

        {/* Full-width monthly trend */}
        <div className="dashboard-chart-full">
          <MonthlyTrendChart data={dashboardData?.monthly_trend} loading={loading} />
        </div>

        {/* Two-column pie + bar */}
        <div className="dashboard-charts-row">
          <ExpenseCategoryPie data={dashboardData?.expense_by_category} loading={loading} />
          <IncomeSourceChart data={dashboardData?.income_by_source} loading={loading} />
        </div>

        <div className="recent-section">
          <div className="section-header">
            <h3 className="section-title">Recent Transactions</h3>
            <Link to="/transactions" className="view-all-link">View all →</Link>
          </div>
          <TransactionTable
            transactions={recentTransactions}
            loading={loading}
          />
        </div>
      </div>
    );
  }
}

export default Dashboard;
