import { useState } from "react";
import { faqs } from "../data/content";

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="section">
      <div className="container faq-grid">
        <div className="head">
          <span className="eyebrow">FAQ</span>

          <h2>
            Frequently asked <span className="faq-highlight">questions</span>
          </h2>

          <p>
            Everything you need to know about managing your business with
            Cliently.
          </p>
        </div>

        <div className="faq-list">
          {faqs.map((f, i) => (
            <div className="faq-item" key={f.q}>
              <button
                className="faq-q"
                aria-expanded={open === i}
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span>{f.q}</span>
                <span className="faq-icon">{open === i ? "−" : "+"}</span>
              </button>

              {open === i && <p className="faq-a">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
