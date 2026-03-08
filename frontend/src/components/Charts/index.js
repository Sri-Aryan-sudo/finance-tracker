import React, { Component } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart,
} from 'recharts';
import './index.css';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const MATERIAL_COLORS = [
  '#2196F3', '#4CAF50', '#F44336', '#FF9800', '#9C27B0',
  '#009688', '#3F51B5', '#E91E63', '#00BCD4', '#8BC34A',
  '#FF5722', '#607D8B',
];

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

class CustomTooltip extends Component {
  render() {
    const { active, payload, label } = this.props;
    if (!active || !payload?.length) return null;
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="value" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
}

class PieTooltip extends Component {
  render() {
    const { active, payload } = this.props;
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <div className="custom-tooltip">
        <p className="label">{d.name}</p>
        <p className="value" style={{ color: d.payload.fill }}>{formatCurrency(d.value)}</p>
        <p style={{ fontSize: 12, color: '#9E9E9E' }}>{(d.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }
}

export class MonthlyTrendChart extends Component {
  render() {
    const { data = [], loading } = this.props;

    const chartData = MONTH_NAMES.map((name, i) => {
      const found = data.find(d => parseInt(d.month) === i + 1);
      return {
        name,
        Income: found ? parseFloat(found.income) : 0,
        Expenses: found ? parseFloat(found.expenses) : 0,
      };
    });

    return (
      <div className="chart-card full-width">
        <div className="chart-title">Monthly Overview</div>
        <div className="chart-subtitle">Income vs Expenses this year</div>
        {loading ? (
          <div className="skeleton" style={{ height: 280 }} />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4CAF50" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F44336" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F44336" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Area type="monotone" dataKey="Income" stroke="#4CAF50" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ fill: '#4CAF50', r: 4 }} />
              <Area type="monotone" dataKey="Expenses" stroke="#F44336" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ fill: '#F44336', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }
}

export class ExpenseCategoryPie extends Component {
  render() {
    const { data = [], loading } = this.props;

    const chartData = data.map(d => ({ name: d.category, value: parseFloat(d.total) }));

    return (
      <div className="chart-card">
        <div className="chart-title">Expense Breakdown</div>
        <div className="chart-subtitle">Spending by category</div>
        {loading ? (
          <div className="skeleton" style={{ height: 260 }} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={MATERIAL_COLORS[i % MATERIAL_COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        )}
        <div className="chart-legend">
          {chartData.slice(0, 6).map((d, i) => (
            <div key={i} className="legend-item">
              <div className="legend-dot" style={{ background: MATERIAL_COLORS[i % MATERIAL_COLORS.length] }} />
              {d.name}
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export class IncomeSourceChart extends Component {
  render() {
    const { data = [], loading } = this.props;
    const chartData = data.map(d => ({ name: d.source || 'Other', value: parseFloat(d.total) }));

    return (
      <div className="chart-card">
        <div className="chart-title">Income Sources</div>
        <div className="chart-subtitle">Income grouped by source</div>
        {loading ? (
          <div className="skeleton" style={{ height: 260 }} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F5F5F5" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: '#616161' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Income" radius={[0, 6, 6, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={MATERIAL_COLORS[i % MATERIAL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }
}

export class IncomeExpenseBar extends Component {
  render() {
    const { data = [], loading } = this.props;
    const chartData = MONTH_NAMES.map((name, i) => {
      const found = data.find(d => parseInt(d.month) === i + 1);
      return {
        name,
        Income: found ? parseFloat(found.income) : 0,
        Expenses: found ? parseFloat(found.expenses) : 0,
      };
    });

    return (
      <div className="chart-card full-width">
        <div className="chart-title">Income vs Expense</div>
        <div className="chart-subtitle">Monthly comparison bar chart</div>
        {loading ? (
          <div className="skeleton" style={{ height: 260 }} />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9E9E9E' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} />
              <Bar dataKey="Income" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expenses" fill="#F44336" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    );
  }
}

export { MATERIAL_COLORS };
