import { steps } from "../data/content";

export default function HowItWorks() {
  return (
    <section id="how" className="section alt">
      <div className="container">
        <div className="head">
          <span className="eyebrow">How it works</span>

          <h2>Manage your customer journey in 3 simple steps</h2>

          <p>
            Bring your customer data together, manage your sales process and
            keep your team aligned.
          </p>
        </div>

        <div className="grid">
          {steps.map((s, i) => (
            <div className="card" key={s.title}>
              <div className="step">{i + 1}</div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
