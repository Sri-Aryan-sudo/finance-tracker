import React, { Component } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { getAnalytics } from '../../services/api';
import './index.css';

const MATERIAL_COLORS = [
  '#2196F3', '#4CAF50', '#F44336', '#FF9800', '#9C27B0',
  '#009688', '#3F51B5', '#E91E63', '#00BCD4', '#8BC34A',
  '#FF5722', '#607D8B',
];

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

class PieTooltip extends Component {
  render() {
    const { active, payload } = this.props;
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div style={{ background: 'white', border: '1px solid #E0E0E0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
        <p style={{ fontWeight: 600, color: '#424242', marginBottom: 4 }}>{d.name}</p>
        <p style={{ color: d.payload.fill, fontFamily: 'DM Mono, monospace' }}>{formatCurrency(d.value)}</p>
        <p style={{ color: '#9E9E9E', fontSize: 12 }}>{(d.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }
}

class Analytics extends Component {
  constructor(props) {
    super(props);
    this.state = {
      analyticsData: null,
      loading: false,
      error: null,
      // Drill-down state
      drillLevel: 0, // 0=category, 1=subcategory, 2=source
      selectedCategory: null,
      selectedSubcategory: null,
      txType: 'expense',
      year: new Date().getFullYear().toString(),
    };
    this.loadAnalytics = this.loadAnalytics.bind(this);
    this.handleCategoryClick = this.handleCategoryClick.bind(this);
    this.handleSubcategoryClick = this.handleSubcategoryClick.bind(this);
  }

  componentDidMount() {
    this.loadAnalytics();
  }

  async loadAnalytics() {
    this.setState({ loading: true });
    const { txType, year } = this.state;
    try {
      const data = await getAnalytics({ type: txType, year });
      this.setState({ analyticsData: data, loading: false });
    } catch (err) {
      this.setState({ error: err.message, loading: false });
    }
  }

  handleCategoryClick(entry) {
    this.setState({ selectedCategory: entry.name || entry.category, drillLevel: 1 });
  }

  handleSubcategoryClick(entry) {
    this.setState({ selectedSubcategory: entry.name || entry.subcategory, drillLevel: 2 });
  }

  getCurrentPieData() {
    const { analyticsData, drillLevel, selectedCategory, selectedSubcategory } = this.state;
    if (!analyticsData) return [];

    if (drillLevel === 0) {
      return analyticsData.by_category.map(d => ({ name: d.category, value: parseFloat(d.total), count: d.count }));
    }
    if (drillLevel === 1) {
      return analyticsData.by_subcategory
        .filter(d => d.category === selectedCategory)
        .map(d => ({ name: d.subcategory, value: parseFloat(d.total), count: d.count }));
    }
    if (drillLevel === 2) {
      return analyticsData.by_source
        .filter(d => d.category === selectedCategory && d.subcategory === selectedSubcategory)
        .map(d => ({ name: d.source, value: parseFloat(d.total), count: d.count }));
    }
    return [];
  }

  getMonthlyData() {
    const { analyticsData, selectedCategory, drillLevel } = this.state;
    if (!analyticsData) return [];
    const monthlyData = MONTH_NAMES.map((name, i) => ({ name, value: 0 }));
    if (drillLevel >= 1 && selectedCategory) {
      analyticsData.monthly_by_category
        .filter(d => d.category === selectedCategory)
        .forEach(d => {
          const idx = parseInt(d.month) - 1;
          if (monthlyData[idx]) monthlyData[idx].value = parseFloat(d.total);
        });
    } else {
      const map = {};
      analyticsData.monthly_by_category.forEach(d => {
        const idx = parseInt(d.month) - 1;
        map[idx] = (map[idx] || 0) + parseFloat(d.total);
      });
      Object.entries(map).forEach(([i, v]) => { if (monthlyData[i]) monthlyData[i].value = v; });
    }
    return monthlyData;
  }

  renderBreadcrumb() {
    const { drillLevel, selectedCategory, selectedSubcategory, txType } = this.state;
    return (
      <div className="drill-breadcrumb">
        <span className="crumb" onClick={() => this.setState({ drillLevel: 0, selectedCategory: null, selectedSubcategory: null })}>
          All {txType === 'expense' ? 'Expenses' : 'Income'}
        </span>
        {drillLevel >= 1 && selectedCategory && (
          <>
            <span className="crumb-sep">›</span>
            <span className="crumb" onClick={() => this.setState({ drillLevel: 1, selectedSubcategory: null })}>
              {selectedCategory}
            </span>
          </>
        )}
        {drillLevel >= 2 && selectedSubcategory && (
          <>
            <span className="crumb-sep">›</span>
            <span className="crumb current">{selectedSubcategory}</span>
          </>
        )}
      </div>
    );
  }

  getDrillTitle() {
    const { drillLevel, selectedCategory, selectedSubcategory } = this.state;
    if (drillLevel === 0) return 'By Category';
    if (drillLevel === 1) return `${selectedCategory} — By Subcategory`;
    return `${selectedSubcategory} — By Source`;
  }

  render() {
    const { loading, error, txType, year, drillLevel } = this.state;
    const pieData = this.getCurrentPieData();
    const monthlyData = this.getMonthlyData();
    const totalInView = pieData.reduce((s, d) => s + d.value, 0);

    return (
      <div className="page-container fade-in">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Click on chart segments to drill down into your spending</p>
        </div>

        <div className="analytics-controls">
          <select
            className="filter-select"
            value={txType}
            onChange={e => this.setState({ txType: e.target.value, drillLevel: 0, selectedCategory: null, selectedSubcategory: null }, this.loadAnalytics)}
          >
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </select>

          <select
            className="filter-select"
            value={year}
            onChange={e => this.setState({ year: e.target.value }, this.loadAnalytics)}
          >
            {[2025, 2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {drillLevel > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => this.setState({ drillLevel: 0, selectedCategory: null, selectedSubcategory: null })}>
              <span className="material-icons-round" style={{ fontSize: 16 }}>refresh</span>
              Reset
            </button>
          )}
        </div>

        {this.renderBreadcrumb()}

        {error ? (
          <div className="empty-state">
            <span className="material-icons-round">error_outline</span>
            <h3>Failed to load analytics</h3>
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="analytics-grid">
              {/* Pie Chart */}
              <div className="chart-card">
                <div className="chart-title">{this.getDrillTitle()}</div>
                <div className="chart-subtitle" style={{ color: 'var(--gray-500)', fontSize: 12, marginBottom: 4 }}>
                  {drillLevel < 2 ? 'Click a segment to drill down' : 'Source level view'}
                </div>
                {loading ? (
                  <div className="skeleton" style={{ height: 280 }} />
                ) : pieData.length === 0 ? (
                  <div className="empty-state" style={{ padding: 40 }}>
                    <span className="material-icons-round">pie_chart</span>
                    <h3>No data</h3>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={65} outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={drillLevel === 0 ? this.handleCategoryClick : drillLevel === 1 ? this.handleSubcategoryClick : undefined}
                        style={{ cursor: drillLevel < 2 ? 'pointer' : 'default' }}
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={MATERIAL_COLORS[i % MATERIAL_COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Legend */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 8 }}>
                  {pieData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--gray-600)', cursor: drillLevel < 2 ? 'pointer' : 'default' }}
                      onClick={() => drillLevel === 0 ? this.handleCategoryClick({ name: d.name }) : drillLevel === 1 ? this.handleSubcategoryClick({ name: d.name }) : null}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }} />
                      <span>{d.name}</span>
                      <span style={{ color: 'var(--gray-400)' }}>({((d.value / totalInView) * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary list */}
              <div className="chart-card">
                <div className="chart-title">Breakdown</div>
                <div className="chart-subtitle" style={{ marginBottom: 16 }}>
                  Total: <strong style={{ color: 'var(--gray-900)' }}>{formatCurrency(totalInView)}</strong>
                </div>
                {loading ? (
                  [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />)
                ) : (
                  <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pieData.sort((a, b) => b.value - a.value).map((d, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                          borderRadius: 8, background: 'var(--gray-50)', cursor: drillLevel < 2 ? 'pointer' : 'default',
                          transition: 'background 0.15s',
                        }}
                        onClick={() => drillLevel === 0 ? this.handleCategoryClick({ name: d.name }) : drillLevel === 1 ? this.handleSubcategoryClick({ name: d.name }) : null}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--blue-50)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gray-50)'}
                      >
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: MATERIAL_COLORS[i % MATERIAL_COLORS.length], flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{d.name}</span>
                        <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>{d.count} txns</span>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 14, fontWeight: 600, color: 'var(--gray-900)' }}>{formatCurrency(d.value)}</span>
                        {drillLevel < 2 && <span className="material-icons-round" style={{ fontSize: 16, color: 'var(--gray-400)' }}>chevron_right</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly bar chart */}
            <div className="chart-card">
              <div className="chart-title">Monthly Trend</div>
              <div className="chart-subtitle" style={{ marginBottom: 20 }}>
                {drillLevel >= 1 ? `${this.state.selectedCategory} spending by month` : `Total ${txType} by month`}
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 220 }} />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [formatCurrency(v), txType === 'expense' ? 'Expenses' : 'Income']} />
                    <Bar dataKey="value" fill={txType === 'expense' ? '#F44336' : '#4CAF50'} radius={[4, 4, 0, 0]} name={txType === 'expense' ? 'Expenses' : 'Income'} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}

export default Analytics;
