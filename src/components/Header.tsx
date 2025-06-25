'use client'

import { useState } from 'react'
import Link from 'next/link'
import './Header.css'

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link href="/">AI SEO Blog Generator</Link>
        </div>
        
        <button className="hamburger" onClick={toggleMenu} aria-label="Toggle navigation menu">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        <nav className={`nav-menu ${menuOpen ? 'active' : ''}`}>
          <ul>
            <li><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
            <li><Link href="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
            <li><Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
            <li><Link href="/privacy" onClick={() => setMenuOpen(false)}>Privacy Policy</Link></li>
            <li><Link href="/terms" onClick={() => setMenuOpen(false)}>Terms of Use</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header