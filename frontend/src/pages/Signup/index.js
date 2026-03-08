import React, { Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../../services/api';
import '../Login/index.css';

function withNavigate(Comp) {
  return function Wrapped(props) {
    const navigate = useNavigate();
    return <Comp {...props} navigate={navigate} />;
  };
}

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = { name: '', email: '', password: '', confirm: '', loading: false, error: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();
    const { name, email, password, confirm } = this.state;

    if (!name || !email || !password) {
      this.setState({ error: 'All fields are required.' });
      return;
    }
    if (password !== confirm) {
      this.setState({ error: 'Passwords do not match.' });
      return;
    }
    if (password.length < 6) {
      this.setState({ error: 'Password must be at least 6 characters.' });
      return;
    }

    this.setState({ loading: true, error: '' });
    try {
      const data = await signup({ name, email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (this.props.onAuth) this.props.onAuth(true);
      this.props.navigate('/dashboard');
    } catch (err) {
      this.setState({ error: err.message });
    } finally {
      this.setState({ loading: false });
    }
  }

  render() {
    const { name, email, password, confirm, loading, error } = this.state;

    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <span className="material-icons-round">account_balance_wallet</span>
            </div>
            <div className="auth-logo-text">Fin<span>Track</span></div>
          </div>

          <h1 className="auth-heading">Create account</h1>
          <p className="auth-subheading">Start tracking your finances today</p>

          {error && (
            <div className="auth-error">
              <span className="material-icons-round" style={{ fontSize: 18 }}>error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div className="input-wrap">
                <span className="material-icons-round input-icon">person</span>
                <input
                  type="text"
                  className="form-control input-with-icon"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => this.setState({ name: e.target.value })}
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrap">
                <span className="material-icons-round input-icon">email</span>
                <input
                  type="email"
                  className="form-control input-with-icon"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => this.setState({ email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrap">
                <span className="material-icons-round input-icon">lock</span>
                <input
                  type="password"
                  className="form-control input-with-icon"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={e => this.setState({ password: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-wrap">
                <span className="material-icons-round input-icon">lock_outline</span>
                <input
                  type="password"
                  className="form-control input-with-icon"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => this.setState({ confirm: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : <span className="material-icons-round" style={{ fontSize: 20 }}>how_to_reg</span>}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <button className="auth-link" onClick={() => this.props.navigate('/login')}>
              Sign in
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withNavigate(Signup);
