export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="hero-text">
          <span className="eyebrow">All-in-one CRM platform</span>

          <h1>
            Manage your entire customer journey{" "}
            <span className="hl">in one place</span>
          </h1>

          <p>
            Manage leads, contacts, opportunities and activities from one
            centralized CRM platform. Track your sales pipeline, automate
            workflows and build stronger customer relationships.
          </p>

          <div className="hero-btns">
            <a href="#pricing" className="btn btn-lg">Get Started</a>
            <a href="#features" className="btn btn-outline btn-lg">
              Explore Features
            </a>
          </div>

          <small className="hero-note">
            ✓ Easy to set up &nbsp;&nbsp; ✓ Built for growing teams
          </small>
        </div>

        <div className="mock" aria-hidden="true">
          <div className="mock-bar">
            <span />
            <span />
            <span />
          </div>

          <div className="mock-body">
            <div className="mock-stats">
              <div>
                <small>Leads</small>
                <b>248</b>
              </div>
              <div>
                <small>Open Deals</small>
                <b>36</b>
              </div>
              <div>
                <small>Pipeline Value</small>
                <b>₹4.2L</b>
              </div>
            </div>

            <div className="mock-chart">
              {[40, 65, 50, 80, 60, 95, 75].map((h, i) => (
                <i key={i} style={{ height: h + "%" }} />
              ))}
            </div>

            <div className="mock-list">
              <div>
                <span>Jeya Kartika G · Website Inquiry</span>
                <em>New Lead</em>
              </div>
              <div>
                <span>Arun Balaji R · Business Account</span>
                <em>Negotiation</em>
              </div>
              <div>
                <span>Mounika M · Service Opportunity</span>
                <em>Won</em>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
