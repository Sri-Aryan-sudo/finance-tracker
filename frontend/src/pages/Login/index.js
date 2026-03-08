import React, { Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../services/api';
import './index.css';

function withNavigate(Comp) {
  return function Wrapped(props) {
    const navigate = useNavigate();
    return <Comp {...props} navigate={navigate} />;
  };
}

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = { email: '', password: '', loading: false, error: '' };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  async handleSubmit(e) {
    e.preventDefault();
    const { email, password } = this.state;
    if (!email || !password) {
      this.setState({ error: 'Please enter email and password.' });
      return;
    }

    this.setState({ loading: true, error: '' });
    try {
      const data = await login({ email, password });
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
    const { email, password, loading, error } = this.state;

    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <span className="material-icons-round">account_balance_wallet</span>
            </div>
            <div className="auth-logo-text">Fin<span>Track</span></div>
          </div>

          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-subheading">Sign in to your account to continue</p>

          {error && (
            <div className="auth-error">
              <span className="material-icons-round" style={{ fontSize: 18 }}>error_outline</span>
              {error}
            </div>
          )}

          <form onSubmit={this.handleSubmit}>
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
                  autoFocus
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => this.setState({ password: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="spinner" /> : <span className="material-icons-round" style={{ fontSize: 20 }}>login</span>}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{' '}
            <button className="auth-link" onClick={() => this.props.navigate('/signup')}>
              Create account
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default withNavigate(Login);
