import React, { Component } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './index.css';

function withRouter(Comp) {
  return function Wrapped(props) {
    const navigate = useNavigate();
    const location = useLocation();
    return <Comp {...props} navigate={navigate} location={location} />;
  };
}

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.handleLogout = this.handleLogout.bind(this);
  }

  handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (this.props.onLogout) this.props.onLogout();
    this.props.navigate('/login');
  }

  getUser() {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch { return {}; }
  }

  getInitials(name) {
    if (!name) return 'U';
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  render() {
    const user = this.getUser();

    const navItems = [
      { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
      { to: '/transactions', label: 'Transactions', icon: 'receipt_long' },
      { to: '/analytics', label: 'Analytics', icon: 'bar_chart' },
      { to: '/upload', label: 'Upload', icon: 'upload_file' },
    ];

    return (
      <>
        {/* Top navbar */}
        <nav className="navbar">
          <div className="navbar-inner">
            <NavLink to="/dashboard" className="navbar-logo">
              <div className="navbar-logo-icon">
                <span className="material-icons-round">account_balance_wallet</span>
              </div>
              <span className="navbar-logo-text">Fin<span>Track</span></span>
            </NavLink>

            <div className="navbar-nav">
              {navItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span className="material-icons-round">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>

            <div className="navbar-right">
              <NavLink to="/transactions?add=true" className="navbar-add-btn">
                <span className="material-icons-round">add</span>
                <span>Add</span>
              </NavLink>

              <div className="navbar-user">
                <div className="navbar-avatar">{this.getInitials(user.name)}</div>
                <span className="navbar-username">{user.name || 'User'}</span>
              </div>

              <button className="navbar-logout" onClick={this.handleLogout}>
                <span className="material-icons-round">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile bottom navigation */}
        <div className="mobile-bottom-nav">
          <div className="mobile-nav-items">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `mobile-nav-item${isActive ? ' active' : ''}`}
              >
                <span className="material-icons-round">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
            <button className="mobile-nav-item" onClick={this.handleLogout}>
              <span className="material-icons-round">logout</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(Navbar);
