import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Welcome back! Here\'s your overview.' },
  '/invoices': { title: 'Invoices', sub: 'Manage all your invoices' },
  '/invoices/create': { title: 'Create Invoice', sub: 'Fill in the details below' },
  '/clients': { title: 'Client Management', sub: 'Manage your clients' },
  '/payments': { title: 'Payment History', sub: 'All payment records' },
};

const Layout = () => {
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: 'InvoiceFlow', sub: '' };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{pageInfo.title}</h1>
            {pageInfo.sub && <p>{pageInfo.sub}</p>}
          </div>
          <div className="topbar-actions">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 700, fontSize: 14 }}>
              IF
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Layout;
