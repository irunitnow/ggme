import Link from 'next/link'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <Link href="/">AI SEO Blog Generator</Link>
          <p>Your ultimate tool for creating SEO-optimized blog content</p>
        </div>
        
        <div className="footer-links">
          <div className="footer-links-column">
            <h3>Navigation</h3>
            <ul>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          
          <div className="footer-links-column">
            <h3>Legal</h3>
            <ul>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Use</Link></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {currentYear} AI SEO Blog Generator. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer