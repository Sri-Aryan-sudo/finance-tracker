import React, { Component } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
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
      <div className="custom-tooltip">
        <p className="label">{d.name}</p>
        <p className="value" style={{ color: d.payload.fill }}>{formatCurrency(d.value)}</p>
        <p style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{(d.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }
}

class BarTooltip extends Component {
  render() {
    const { active, payload, label } = this.props;
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value">{formatCurrency(payload[0].value)}</p>
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
      drillLevel: 0,
      selectedCategory: null,
      selectedSubcategory: null,
      txType: 'expense',
      year: new Date().getFullYear().toString(),
    };
    this.loadAnalytics = this.loadAnalytics.bind(this);
    this.handleCategoryClick = this.handleCategoryClick.bind(this);
    this.handleSubcategoryClick = this.handleSubcategoryClick.bind(this);
  }

  componentDidMount() { this.loadAnalytics(); }

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
    if (drillLevel === 0) return analyticsData.by_category.map(d => ({ name: d.category, value: parseFloat(d.total), count: d.count }));
    if (drillLevel === 1) return analyticsData.by_subcategory.filter(d => d.category === selectedCategory).map(d => ({ name: d.subcategory, value: parseFloat(d.total), count: d.count }));
    if (drillLevel === 2) return analyticsData.by_source.filter(d => d.category === selectedCategory && d.subcategory === selectedSubcategory).map(d => ({ name: d.source, value: parseFloat(d.total), count: d.count }));
    return [];
  }

  getMonthlyData() {
    const { analyticsData, selectedCategory, drillLevel } = this.state;
    if (!analyticsData) return [];
    const monthlyData = MONTH_NAMES.map((name) => ({ name, value: 0 }));
    if (drillLevel >= 1 && selectedCategory) {
      analyticsData.monthly_by_category.filter(d => d.category === selectedCategory).forEach(d => {
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

  getDrillTitle() {
    const { drillLevel, selectedCategory, selectedSubcategory } = this.state;
    if (drillLevel === 0) return 'By Category';
    if (drillLevel === 1) return `${selectedCategory} — Subcategories`;
    return `${selectedSubcategory} — Sources`;
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

  render() {
    const { loading, error, txType, year, drillLevel } = this.state;
    const pieData = this.getCurrentPieData();
    const monthlyData = this.getMonthlyData();
    const totalInView = pieData.reduce((s, d) => s + d.value, 0);
    const canDrill = drillLevel < 2;

    return (
      <div className="page-container fade-in">
        <div className="page-header">
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Click chart segments to drill down into your spending</p>
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
            {[2026, 2025, 2024, 2023, 2022].map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {drillLevel > 0 && (
            <button className="btn btn-outline btn-sm" onClick={() => this.setState({ drillLevel: 0, selectedCategory: null, selectedSubcategory: null })}>
              <span className="material-icons-round" style={{ fontSize: 15 }}>refresh</span>
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
              {/* Pie chart */}
              <div className="chart-card">
                <div className="chart-title">{this.getDrillTitle()}</div>
                <p className="chart-subtitle">{canDrill ? 'Tap a segment to drill down' : 'Source level'}</p>

                {loading ? (
                  <div className="skeleton" style={{ height: 240, borderRadius: 8 }} />
                ) : pieData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 16px' }}>
                    <span className="material-icons-round">pie_chart</span>
                    <h3>No data</h3>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        onClick={drillLevel === 0 ? this.handleCategoryClick : drillLevel === 1 ? this.handleSubcategoryClick : undefined}
                        style={{ cursor: canDrill ? 'pointer' : 'default' }}
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
                <div className="analytics-legend">
                  {pieData.map((d, i) => (
                    <div
                      key={i}
                      className={`analytics-legend-item ${canDrill ? 'clickable' : ''}`}
                      onClick={() => canDrill && (drillLevel === 0 ? this.handleCategoryClick({ name: d.name }) : this.handleSubcategoryClick({ name: d.name }))}
                    >
                      <div className="legend-dot" style={{ background: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }} />
                      <span className="legend-name">{d.name}</span>
                      <span className="legend-pct">({((d.value / (totalInView || 1)) * 100).toFixed(0)}%)</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breakdown list */}
              <div className="chart-card">
                <div className="chart-title">Breakdown</div>
                <div className="analytics-total">
                  Total: <strong>{formatCurrency(totalInView)}</strong>
                </div>

                {loading ? (
                  <div className="analytics-list">
                    {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
                  </div>
                ) : (
                  <div className="analytics-list">
                    {pieData.sort((a, b) => b.value - a.value).map((d, i) => (
                      <div
                        key={i}
                        className={`analytics-list-item ${canDrill ? 'clickable' : ''}`}
                        onClick={() => canDrill && (drillLevel === 0 ? this.handleCategoryClick({ name: d.name }) : this.handleSubcategoryClick({ name: d.name }))}
                      >
                        <div className="ali-dot" style={{ background: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }} />
                        <span className="ali-name">{d.name}</span>
                        <span className="ali-count">{d.count} txns</span>
                        <span className="ali-amount">{formatCurrency(d.value)}</span>
                        {canDrill && <span className="material-icons-round ali-chevron">chevron_right</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Monthly bar */}
            <div className="chart-card">
              <div className="chart-title">Monthly Trend</div>
              <p className="chart-subtitle">
                {drillLevel >= 1 ? `${this.state.selectedCategory} by month` : `Total ${txType} by month`}
              </p>
              {loading ? (
                <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={48} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="value" fill={txType === 'expense' ? '#F44336' : '#4CAF50'} radius={[4, 4, 0, 0]} />
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
