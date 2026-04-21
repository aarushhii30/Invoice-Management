import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdDashboard, MdReceipt, MdAdd, MdPeople,
  MdPayment, MdLogout, MdSettings
} from 'react-icons/md';

const navItems = [
  { icon: <MdDashboard />, label: 'Dashboard', to: '/dashboard' },
  { icon: <MdReceipt />, label: 'Invoices', to: '/invoices' },
  { icon: <MdAdd />, label: 'Create Invoice', to: '/invoices/create' },
  { icon: <MdPeople />, label: 'Clients', to: '/clients' },
  { icon: <MdPayment />, label: 'Payments', to: '/payments' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>Invoice<span>Flow</span></h2>
        <p style={{ color: 'var(--gray)', fontSize: 12, marginTop: 4 }}>Billing Made Simple</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-label">Main Menu</div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <MdLogout /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
