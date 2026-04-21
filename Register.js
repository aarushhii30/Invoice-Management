import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill required fields');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Invoice<span>Flow</span></h1>
          <p>Professional Invoice Management</p>
        </div>

        <h2 className="auth-title">Create Account</h2>
        <p className="auth-subtitle">Start managing your invoices today</p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="John Doe" className="form-control" />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input type="text" name="company" value={form.company} onChange={handleChange} placeholder="Acme Inc." className="form-control" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className="form-control" />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className="form-control" />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-link">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
