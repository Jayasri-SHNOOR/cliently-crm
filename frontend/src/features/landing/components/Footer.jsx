export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a href="#" className="logo logo-light">
            <span className="logo-mark">C</span>
            Cliently
          </a>

          <p className="footer-about">
            A centralized CRM platform for managing customers, sales and
            business workflows.
          </p>
        </div>

        <div>
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#pricing">Pricing</a>
          <a href="#faq">FAQ</a>
        </div>

        <div>
          <h4>Company</h4>
          <a href="#">About</a>
          <a href="#">Contact</a>
          <a href="#">Careers</a>
        </div>

        <div>
          <h4>Legal</h4>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms</a>
        </div>
      </div>

      <div className="container">
        <div className="footer-bottom">© 2026 Cliently. Demo project.</div>
      </div>
    </footer>
  );
}
