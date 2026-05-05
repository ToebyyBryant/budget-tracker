import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import apiClient from '../api/client'

export default function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      // Proceed with client-side logout even if the request fails
    } finally {
      localStorage.removeItem('token')
      navigate('/login')
    }
  }

  function toggleMenu() {
    setMenuOpen((prev) => !prev)
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  const activeLinkClass = ({ isActive }) =>
    isActive
      ? 'px-3 py-2 rounded bg-blue-500 font-medium'
      : 'px-3 py-2 rounded hover:bg-blue-600 transition-colors'

  return (
    <nav className="bg-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <span className="font-bold text-lg tracking-tight">Budget Tracker</span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={activeLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/entries" className={activeLinkClass}>
            Entries
          </NavLink>
          <NavLink to="/categories" className={activeLinkClass}>
            Categories
          </NavLink>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded hover:bg-blue-600 transition-colors ml-2"
          >
            Logout
          </button>
        </div>

        {/* Hamburger button — mobile only */}
        <button
          className="md:hidden p-2 rounded hover:bg-blue-600 transition-colors"
          aria-label="Toggle navigation"
          data-testid="hamburger-button"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
        >
          ☰
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden flex flex-col px-4 pb-3 gap-1">
          <NavLink to="/" end className={activeLinkClass} onClick={closeMenu}>
            Dashboard
          </NavLink>
          <NavLink to="/entries" className={activeLinkClass} onClick={closeMenu}>
            Entries
          </NavLink>
          <NavLink to="/categories" className={activeLinkClass} onClick={closeMenu}>
            Categories
          </NavLink>
          <button
            onClick={handleLogout}
            className="px-3 py-2 rounded hover:bg-blue-600 transition-colors text-left"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
