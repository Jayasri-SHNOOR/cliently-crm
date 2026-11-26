import { plans } from "../data/content";

export default function Pricing() {
  return (
    <section id="pricing" className="section alt">
      <div className="container">
        <div className="head">
          <span className="eyebrow">Pricing</span>

          <h2>Plans that scale with your business</h2>

          <p>
            Start with the essentials and unlock advanced CRM capabilities as
            your team grows.
          </p>
        </div>

        <div className="grid">
          {plans.map((p) => (
            <div
              className={`card plan ${p.popular ? "popular" : ""}`}
              key={p.name}
            >
              {p.popular && <span className="badge">Most Popular</span>}

              <h3>{p.name}</h3>
              <small className="plan-desc">{p.desc}</small>

              <div className="price">
                {p.price}
                <small>/month</small>
              </div>

              <ul>
                {p.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <a href="#" className={`btn ${p.popular ? "" : "btn-outline"}`}>
                Choose {p.name}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
