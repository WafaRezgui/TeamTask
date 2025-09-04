import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="nav-icon" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      )
    },
  ];

  const handleNavItemClick = (item) => {
    navigate(item.path);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  const getUserInitials = (user) => {
    if (!user?.username) return 'U';
    return user.username.slice(0, 2).toUpperCase();
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="logo-container">
        <div className="logo">C</div>
        <div className="logo-text">Catalyze</div>
      </div>

      {/* Navigation principale */}
      <div className="nav-section">
        <div className="nav-title">NAVIGATION</div>
        {navigationItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
            onClick={() => handleNavItemClick(item)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* User Profile & Logout */}
      <div className="nav-section" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <div className="user-profile-section">
          <div className="user-profile" style={{ padding: '0 20px 15px' }}>
            <div className="member-avatar">
              {getUserInitials(user)}
            </div>
            <div className="member-info">
              <h4>{user?.username || 'Utilisateur'}</h4>
              <div className="member-role">{user?.role === 'manager' ? 'Manager' : 'Utilisateur'}</div>
            </div>
          </div>
          
          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
            style={{ color: 'var(--danger)', borderLeft: '3px solid transparent' }}
          >
            <svg className="nav-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.59L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;