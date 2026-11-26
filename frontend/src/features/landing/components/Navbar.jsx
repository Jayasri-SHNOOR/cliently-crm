import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <a href="#" className="logo" onClick={close}>
          <span className="logo-mark">C</span>
          Cliently
        </a>

        <nav id="primary-nav" className={`nav-links ${open ? "open" : ""}`}>
          <a href="#features" onClick={close}>Features</a>
          <a href="#how" onClick={close}>How It Works</a>
          <a href="#reviews" onClick={close}>Reviews</a>
          <a href="#pricing" onClick={close}>Pricing</a>
          <a href="#faq" onClick={close}>FAQ</a>
        </nav>

        <div className="nav-actions">
          <Link to="/login" className="link-login">Login</Link>
          <a href="#pricing" className="btn">Get Started</a>

          <button
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            aria-controls="primary-nav"
            onClick={() => setOpen(!open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}
