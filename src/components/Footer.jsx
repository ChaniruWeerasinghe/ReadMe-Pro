import { Link } from 'react-router-dom';
import { LogoIcon, GithubIcon, LinkedinIcon, FacebookIcon, InstagramIcon } from './Icons';
import brandLogo from '../assets/brand-logo.png';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__top">
          <div className="footer__brand-section">
            <Link to="/" className="footer__logo">
              <div className="footer__logo-icon">
                <img src={brandLogo} alt="ReadMe Logo" className="footer__logo-img" />
              </div>
              <span className="footer__logo-text">ReadMe</span>
            </Link>
            <p className="footer__tagline">Share structured notes and markdown beautifully.</p>
          </div>

          <div className="footer__nav-section">
            <div className="footer__nav-group">
              <h4 className="footer__nav-title">Platform</h4>
              <Link to="/" className="footer__nav-link">Dashboard</Link>
              <Link to="/login" className="footer__nav-link">Sign In</Link>
            </div>
            <div className="footer__nav-group">
              <h4 className="footer__nav-title">Social</h4>
              <a href="https://github.com/Chanii2024" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <GithubIcon size={18} />
                <span>GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/chaniru-weerasinghe-36aa2a326/" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <LinkedinIcon size={18} />
                <span>LinkedIn</span>
              </a>
              <a href="https://web.facebook.com/Chanii2003/" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <FacebookIcon size={18} />
                <span>Facebook</span>
              </a>
              <a href="https://www.instagram.com/chaniruweerasinghe" target="_blank" rel="noopener noreferrer" className="footer__social-link">
                <InstagramIcon size={18} />
                <span>Instagram</span>
              </a>
            </div>
          </div>
        </div>

        <div className="footer__bottom">
          <div className="footer__copyright-group">
            <p className="footer__copyright">
              &copy; {currentYear} ReadMe. Built with passion for the developer community.
            </p>
            <p className="footer__designer">Designed by Chaniru Weerasinghe!</p>
          </div>
          <div className="footer__legal">
            <span className="footer__legal-link">Privacy Policy</span>
            <span className="footer__legal-link">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
