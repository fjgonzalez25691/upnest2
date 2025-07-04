// .src/components/Header.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { cognitoConfig } from "../auth/cognitoConfig.js";

function Header() {
  const auth = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLoginClick = () => {
    auth.signinRedirect();
  };

  const signOutRedirect = () => {
    const clientId = cognitoConfig.client_id;
    const logoutUri = cognitoConfig.post_logout_redirect_uri;
    const cognitoDomain = cognitoConfig.cognitoDomain;
    const logoutUrl = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;

    window.location.href = logoutUrl;
  };

  const handleLogout = () => {
    signOutRedirect();
    auth.removeUser();
  };

  const user = auth.user;

  return (
    <header className="bg-white shadow px-4 py-3 sticky top-0 z-50">
      <div className="flex justify-between items-center max-w-5xl mx-auto">
        {/* Logo */}
        <Link to="/" className="text-3xl font-bold text-primary">UpNest</Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-4 items-center">

          {user ? (
            <>
              <Link to="#" className="hover:text-primary">AI Chat</Link>
              <Link to="#" className="hover:text-primary">My Dashboard</Link>
              <Link to="#" className="hover:text-primary">Add Baby</Link>
              <div className="bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-lg">
                {user.profile?.name?.[0]?.toUpperCase() || user.profile?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                className="bg-gray-200 text-primary px-3 py-1 rounded hover:bg-gray-300"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              onClick={handleLoginClick}
            >
              Login
            </button>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Open navigation"
        >
          <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu (dropdown) */}
      {menuOpen && (
        <nav className="md:hidden bg-white shadow rounded-b-lg px-4 py-3 flex flex-col gap-3 max-w-5xl mx-auto">
          <Link to="/ai-chat" className="hover:text-primary" onClick={() => setMenuOpen(false)}>AI Chat</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="hover:text-primary" onClick={() => setMenuOpen(false)}>My Dashboard</Link>
              <Link to="/add-baby" className="hover:text-primary" onClick={() => setMenuOpen(false)}>Add Baby</Link>
              <div className="bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center font-bold text-lg">
                {user.profile?.name?.[0]?.toUpperCase() || user.profile?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <button
                className="bg-gray-200 text-primary px-3 py-1 rounded hover:bg-gray-300"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <button
              className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
              onClick={() => {
                handleLoginClick();
                setMenuOpen(false);
              }}
            >
              Login
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

export default Header;
