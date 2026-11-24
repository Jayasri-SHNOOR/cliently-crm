import { features } from "../data/content";

export default function Features() {
  return (
    <section id="features" className="section">
      <div className="container">
        <div className="head">
          <span className="eyebrow">Features</span>

          <h2>Everything you need to manage your business</h2>

          <p>
            Manage leads, customers, opportunities and activities from one
            centralized CRM platform.
          </p>
        </div>

        <div className="feature-grid">
          {features.map((f) => (
            <div className="card feature-card" key={f.title}>
              <h3>{f.title}</h3>

              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}