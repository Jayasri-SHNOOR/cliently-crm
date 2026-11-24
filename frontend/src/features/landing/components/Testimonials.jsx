import { testimonials } from "../data/content";

export default function Testimonials() {
  return (
    <section id="reviews" className="section">
      <div className="container">
        <div className="head">
          <span className="eyebrow">Testimonials</span>

          <h2>Trusted by teams to manage their business</h2>

          <p>
            See how teams use Cliently to organize customer relationships,
            manage opportunities and streamline their workflows.
          </p>
        </div>

        <div className="grid">
          {testimonials.map((t) => (
            <div className="card" key={t.name}>
              <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>

              <p className="quote">“{t.text}”</p>

              <div className="person">
                <div className="avatar">{t.name[0]}</div>

                <div>
                  <strong>{t.name}</strong>
                  <small>{t.role}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
