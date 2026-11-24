import { Link } from "react-router-dom";
import { initials } from "./portalApi";
import "../login/styles/login.css";
import "./CustomerPortal.css";

function PortalLayout({ slug, company, children }) {
    const name = company?.companyName || "Customer Portal";
    const year = new Date().getFullYear();

    return (
        <main className="login-page">
            <section className="login-section">
                <div className="login-bg-shape login-bg-shape-one" aria-hidden="true"></div>
                <div className="login-bg-shape login-bg-shape-two" aria-hidden="true"></div>
                <div className="login-card">
                    <div className="login-card-corner" aria-hidden="true"></div>
                    <div className="login-content">
                        <Link to={`/site/${slug}`} className="brand cp-brand-link">
                            <div className="brand-logo">
                                {company?.logoUrl ? (
                                    <img src={company.logoUrl} alt="" className="cp-brand-img" />
                                ) : (
                                    initials(name)
                                )}
                            </div>
                            <div>
                                <span className="brand-name">{name}</span>
                                <span className="brand-subtitle">Customer Portal</span>
                            </div>
                        </Link>
                        {children}
                    </div>
                    <div className="login-footer">
                        © {year} {name}. Powered by Cliently.
                    </div>
                </div>
            </section>
            <section className="crm-showcase">
                <div className="showcase-content">
                    <div className="showcase-label">{name.toUpperCase()}</div>
                    <h2>
                        Your orders and service,
                        <br />
                        <span>in one place.</span>
                    </h2>
                    <p className="showcase-description">
                        {company?.tagline || "Track what you bought, book service visits and pay online."}
                    </p>
                    <div className="crm-features">
                        <div className="feature-card">
                            <div className="feature-number">01</div>
                            <div className="feature-text">
                                <h3>My orders</h3>
                                <p>See your products and their delivery status.</p>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-number">02</div>
                            <div className="feature-text">
                                <h3>Service requests</h3>
                                <p>Ask for installation, repair or maintenance visits.</p>
                            </div>
                        </div>
                        <div className="feature-card">
                            <div className="feature-number">03</div>
                            <div className="feature-text">
                                <h3>Secure payments</h3>
                                <p>Pay your bills online safely.</p>
                            </div>
                        </div>
                    </div>
                    <p className="showcase-bottom">
                        {company?.phone ? (
                            <>Need help? <strong>Call {company.phone}</strong></>
                        ) : (
                            <>New customer? <strong>Your login ID is shared after your order.</strong></>
                        )}
                    </p>
                </div>
                <div className="showcase-arc showcase-arc-top" aria-hidden="true"></div>
                <div className="showcase-arc showcase-arc-bottom" aria-hidden="true"></div>
                <div className="showcase-spark showcase-spark-top" aria-hidden="true"></div>
                <div className="showcase-spark showcase-spark-bottom" aria-hidden="true"></div>
                <div className="decorative-grid" aria-hidden="true"></div>
            </section>
        </main>
    );
}

export default PortalLayout;