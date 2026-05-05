import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavBar from './NavBar'

// Mock apiClient so logout POST doesn't hit a real server
vi.mock('../api/client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({}),
  },
}))

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderNavBar() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>
  )
}

describe('NavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the brand name', () => {
    renderNavBar()
    expect(screen.getByText('Budget Tracker')).toBeInTheDocument()
  })

  it('renders the hamburger button', () => {
    renderNavBar()
    expect(screen.getByTestId('hamburger-button')).toBeInTheDocument()
  })

  it('hamburger button has correct aria-label', () => {
    renderNavBar()
    const btn = screen.getByTestId('hamburger-button')
    expect(btn).toHaveAttribute('aria-label', 'Toggle navigation')
  })

  it('mobile dropdown is hidden by default', () => {
    renderNavBar()
    // The desktop nav links are always in the DOM (hidden via CSS class).
    // The mobile dropdown should not be rendered until the hamburger is clicked.
    // We check that there is only one set of nav links (the desktop set).
    const dashboardLinks = screen.getAllByText('Dashboard')
    expect(dashboardLinks).toHaveLength(1)
  })

  it('clicking hamburger button shows mobile dropdown links', () => {
    renderNavBar()
    const hamburger = screen.getByTestId('hamburger-button')
    fireEvent.click(hamburger)

    // After toggle, both desktop and mobile links are in the DOM
    const dashboardLinks = screen.getAllByText('Dashboard')
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(2)
  })

  it('clicking hamburger button again hides mobile dropdown', () => {
    renderNavBar()
    const hamburger = screen.getByTestId('hamburger-button')

    fireEvent.click(hamburger) // open
    fireEvent.click(hamburger) // close

    const dashboardLinks = screen.getAllByText('Dashboard')
    expect(dashboardLinks).toHaveLength(1)
  })

  it('clicking a mobile nav link closes the dropdown', () => {
    renderNavBar()
    const hamburger = screen.getByTestId('hamburger-button')
    fireEvent.click(hamburger)

    // Two "Dashboard" links now — click the second (mobile) one
    const dashboardLinks = screen.getAllByText('Dashboard')
    fireEvent.click(dashboardLinks[1])

    // Dropdown should be closed — back to one Dashboard link
    expect(screen.getAllByText('Dashboard')).toHaveLength(1)
  })

  it('desktop nav contains Dashboard, Entries, Categories, and Logout links', () => {
    renderNavBar()
    // Desktop links are always rendered (hidden via Tailwind CSS on small screens)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Entries')).toBeInTheDocument()
    expect(screen.getByText('Categories')).toBeInTheDocument()
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('logout button calls apiClient.post and navigates to /login', async () => {
    const apiClient = (await import('../api/client')).default
    renderNavBar()

    const logoutBtn = screen.getByText('Logout')
    fireEvent.click(logoutBtn)

    // Wait for async logout to complete
    await vi.waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout')
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    })
  })

  it('logout removes token from localStorage', async () => {
    localStorage.setItem('token', 'test-token')
    renderNavBar()

    const logoutBtn = screen.getByText('Logout')
    fireEvent.click(logoutBtn)

    await vi.waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull()
    })
  })
})
