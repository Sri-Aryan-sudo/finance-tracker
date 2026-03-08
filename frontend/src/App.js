import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Analytics from './pages/Analytics';
import UploadCSV from './components/UploadCSV';

class PrivateRoute extends Component {
  render() {
    const { children } = this.props;
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
  }
}

class PublicRoute extends Component {
  render() {
    const { children } = this.props;
    const token = localStorage.getItem('token');
    if (token) return <Navigate to="/dashboard" replace />;
    return children;
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: !!localStorage.getItem('token'),
    };
    this.handleAuthChange = this.handleAuthChange.bind(this);
  }

  handleAuthChange(authenticated) {
    this.setState({ isAuthenticated: authenticated });
  }

  render() {
    return (
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login onAuth={this.handleAuthChange} />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <Signup onAuth={this.handleAuthChange} />
              </PublicRoute>
            } />
            <Route path="/*" element={
              <PrivateRoute>
                <AuthenticatedLayout onAuth={this.handleAuthChange} />
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </Router>
    );
  }
}

class AuthenticatedLayout extends Component {
  render() {
    return (
      <>
        <Navbar onLogout={() => this.props.onAuth(false)} />
        <div style={{ paddingTop: '64px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/:id" element={<TransactionDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/upload" element={<UploadCSVPage />} />
          </Routes>
        </div>
      </>
    );
  }
}

class UploadCSVPage extends Component {
  render() {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Upload Transactions</h1>
          <p className="page-subtitle">Import your transaction history via CSV file</p>
        </div>
        <UploadCSV />
      </div>
    );
  }
}

export default App;
