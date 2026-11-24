import { useEffect, useMemo, useRef, useState } from "react";
import { Link,useParams } from "react-router-dom";
import { getPublicSite, sendEnquiry } from "./publicSiteApi";
import "./PublicSite.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/;
const EMPTY_FORM = { name: "", email: "", phone: "", company: "", productId: "", message: "", consent: false, companyWebsite: "" };
const BILLING_TEXT = { Monthly: "/ month", Yearly: "/ year", "One-time": "one-time" };

function formatPrice(product) {
  if (product.price == null) return "Price on request";
  const amount = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.price);
  const billing = BILLING_TEXT[product.billing];
  return billing ? `${amount} ${billing}` : amount;
}

function initials(name) {
  return String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0].toUpperCase()).join("");
}

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  else if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (form.phone.trim() && !PHONE_PATTERN.test(form.phone.trim())) errors.phone = "Enter a valid phone number";
  if (form.message.length > 1000) errors.message = "Message must be 1000 characters or less";
  if (!form.consent) errors.consent = "Please agree to be contacted";
  return errors;
}

function ProductCard({ product, onEnquire }) {
  return (
    <article className="ps-product">
      {product.imageUrl ? (
        <img className="ps-product-image" src={product.imageUrl} alt="" loading="lazy" />
      ) : (
        <div className="ps-product-image ps-product-placeholder" aria-hidden="true">{initials(product.name)}</div>
      )}
      <div className="ps-product-body">
        <div className="ps-product-tags">
          <span className="ps-tag">{product.type}</span>
          {product.category && <span className="ps-tag ps-tag-muted">{product.category}</span>}
        </div>
        <h3>{product.name}</h3>
        {product.description && <p className="ps-product-description">{product.description}</p>}
        <div className="ps-product-footer">
          <div>
            <strong className="ps-price">{formatPrice(product)}</strong>
            {product.duration && <small className="ps-duration">{product.duration}</small>}
          </div>
          <button type="button" className="ps-button ps-button-small" onClick={() => onEnquire(product._id)}>Enquire</button>
        </div>
      </div>
    </article>
  );
}

function EnquiryForm({ slug, products, form, setForm }) {
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [serverMessage, setServerMessage] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("sending");
    setServerMessage("");
    try {
      const response = await sendEnquiry(slug, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        company: form.company.trim(),
        productId: form.productId,
        message: form.message.trim(),
        consent: form.consent,
        companyWebsite: form.companyWebsite,
      });
      setServerMessage(response?.message || "Thank you! Our team will contact you soon.");
      setStatus("sent");
    } catch (err) {
      setErrors(err?.errors || {});
      setServerMessage(err?.status === 429 ? "Too many enquiries. Please try again in a few minutes." : err?.message || "Could not send your enquiry. Please try again.");
      setStatus("failed");
    }
  }

  if (status === "sent") {
    return (
      <div className="ps-form ps-form-success" role="status">
        <div className="ps-success-icon" aria-hidden="true">✓</div>
        <h3>Enquiry sent</h3>
        <p>{serverMessage}</p>
        <button type="button" className="ps-button ps-button-ghost" onClick={() => { setForm(EMPTY_FORM); setStatus("idle"); }}>Send another enquiry</button>
      </div>
    );
  }

  return (
    <form className="ps-form" onSubmit={handleSubmit} noValidate>
      <div className="ps-form-grid">
        <label className="ps-field">
          <span>Name *</span>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} maxLength={100} autoComplete="name" aria-invalid={Boolean(errors.name)} />
          {errors.name && <small className="ps-error">{errors.name}</small>}
        </label>
        <label className="ps-field">
          <span>Email *</span>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} maxLength={120} autoComplete="email" aria-invalid={Boolean(errors.email)} />
          {errors.email && <small className="ps-error">{errors.email}</small>}
        </label>
        <label className="ps-field">
          <span>Phone</span>
          <input type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} maxLength={20} autoComplete="tel" aria-invalid={Boolean(errors.phone)} />
          {errors.phone && <small className="ps-error">{errors.phone}</small>}
        </label>
        <label className="ps-field">
          <span>Company</span>
          <input value={form.company} onChange={(e) => update("company", e.target.value)} maxLength={100} autoComplete="organization" />
          {errors.company && <small className="ps-error">{errors.company}</small>}
        </label>
        <label className="ps-field ps-field-wide">
          <span>Interested in</span>
          <select value={form.productId} onChange={(e) => update("productId", e.target.value)} aria-invalid={Boolean(errors.productId)}>
            <option value="">General enquiry</option>
            {products.map((product) => <option key={product._id} value={product._id}>{product.name}</option>)}
          </select>
          {errors.productId && <small className="ps-error">{errors.productId}</small>}
        </label>
        <label className="ps-field ps-field-wide">
          <span>Message</span>
          <textarea rows={4} value={form.message} onChange={(e) => update("message", e.target.value)} maxLength={1000} placeholder="Tell us what you need" />
          <small className="ps-counter">{form.message.length}/1000</small>
          {errors.message && <small className="ps-error">{errors.message}</small>}
        </label>
        <label className="ps-honeypot" aria-hidden="true">
          <span>Company website</span>
          <input tabIndex={-1} autoComplete="off" value={form.companyWebsite} onChange={(e) => update("companyWebsite", e.target.value)} />
        </label>
        <label className="ps-consent ps-field-wide">
          <input type="checkbox" checked={form.consent} onChange={(e) => update("consent", e.target.checked)} />
          <span>I agree to be contacted about my enquiry.</span>
        </label>
        {errors.consent && <small className="ps-error ps-field-wide">{errors.consent}</small>}
      </div>
      {status === "failed" && serverMessage && <div className="ps-alert" role="alert">{serverMessage}</div>}
      <button type="submit" className="ps-button ps-button-full" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send enquiry"}
      </button>
    </form>
  );
}

export default function PublicSite() {
  const { slug } = useParams();
  const [result, setResult] = useState({ slug: null, status: "loading", site: null });
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const contactRef = useRef(null);

  useEffect(() => {
    let active = true;
    getPublicSite(slug)
      .then((response) => {
        if (active) setResult({ slug, status: "ready", site: response?.data || null });
      })
      .catch((err) => {
        if (active) setResult({ slug, status: err?.status === 404 ? "missing" : "error", site: null });
      });
    return () => { active = false; };
  }, [slug]);

  const state = result.slug === slug ? result.status : "loading";
  const site = result.slug === slug ? result.site : null;

  useEffect(() => {
    if (site?.company?.companyName) document.title = site.company.companyName;
  }, [site]);

  const products = useMemo(() => site?.products || [], [site]);
  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category).filter(Boolean))], [products]);
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) =>
      (category === "All" || p.category === category) &&
      (!term || [p.name, p.description, p.category].join(" ").toLowerCase().includes(term))
    );
  }, [products, category, search]);

  function enquireAbout(productId) {
    setForm((current) => ({ ...current, productId }));
    contactRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (state === "loading") {
    return <div className="public-site ps-center"><div className="ps-spinner" aria-label="Loading" /></div>;
  }

  if (state === "missing" || state === "error") {
    return (
      <div className="public-site ps-center">
        <div className="ps-empty-page">
          <h1>{state === "missing" ? "Page not found" : "Something went wrong"}</h1>
          <p>{state === "missing" ? "This company page doesn't exist or is not available right now." : "We couldn't load this page. Please try again."}</p>
          {state === "error" && <button type="button" className="ps-button" onClick={() => window.location.reload()}>Try again</button>}
        </div>
      </div>
    );
  }

  const { company } = site;

  return (
    <div className="public-site">
      <header className="ps-header">
        <div className="ps-container ps-header-inner">
          <a href="#top" className="ps-brand">
            {company.logoUrl ? <img src={company.logoUrl} alt="" className="ps-logo" /> : <span className="ps-logo ps-logo-text">{initials(company.companyName)}</span>}
            <span>{company.companyName}</span>
          </a>
          <nav className="ps-nav" aria-label="Page sections">
            <a href="#products">Products</a>
            {company.about && <a href="#about">About</a>}
            <a href="#contact">Contact</a>
          </nav>
          <Link to={`/site/${slug}/login`} className="ps-button ps-button-small ps-button-ghost">Customer login</Link>
          <button type="button" className="ps-button ps-button-small" onClick={() => contactRef.current?.scrollIntoView({ behavior: "smooth" })}>Enquire now</button>
        </div>
      </header>

      <main id="top">
        <section className="ps-hero">
          <div className="ps-container">
            {company.industry && <span className="ps-eyebrow">{company.industry}</span>}
            <h1>{company.tagline || `Solutions from ${company.companyName}`}</h1>
            <p>Explore our products and services, and send us an enquiry. Our team will get back to you.</p>
            <div className="ps-hero-actions">
              <a href="#products" className="ps-button">View products</a>
              <a href="#contact" className="ps-button ps-button-ghost">Contact us</a>
            </div>
          </div>
        </section>

        <section id="products" className="ps-section">
          <div className="ps-container">
            <div className="ps-section-heading">
              <div>
                <h2>Products &amp; services</h2>
                <p>{products.length} {products.length === 1 ? "offering" : "offerings"} available</p>
              </div>
              {products.length > 0 && (
                <input className="ps-search" type="search" placeholder="Search products" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
              )}
            </div>

            {categories.length > 2 && (
              <div className="ps-chips" role="tablist" aria-label="Categories">
                {categories.map((item) => (
                  <button key={item} type="button" role="tab" aria-selected={category === item} className={`ps-chip${category === item ? " is-active" : ""}`} onClick={() => setCategory(item)}>{item}</button>
                ))}
              </div>
            )}

            {visibleProducts.length > 0 ? (
              <div className="ps-product-grid">
                {visibleProducts.map((product) => <ProductCard key={product._id} product={product} onEnquire={enquireAbout} />)}
              </div>
            ) : (
              <div className="ps-empty">{products.length ? "No products match your search." : "Products will be listed here soon. You can still send us an enquiry."}</div>
            )}
          </div>
        </section>

        {company.about && (
          <section id="about" className="ps-section ps-section-alt">
            <div className="ps-container ps-about">
              <h2>About {company.companyName}</h2>
              <p>{company.about}</p>
            </div>
          </section>
        )}

        <section id="contact" ref={contactRef} className="ps-section">
          <div className="ps-container ps-contact">
            <div className="ps-contact-info">
              <h2>Send an enquiry</h2>
              <p>Tell us what you're looking for. A member of our team will contact you.</p>
              <ul>
                {company.email && <li><span>Email</span><a href={`mailto:${company.email}`}>{company.email}</a></li>}
                {company.phone && <li><span>Phone</span><a href={`tel:${company.phone}`}>{company.phone}</a></li>}
                {company.address && <li><span>Address</span><p>{company.address}</p></li>}
                {company.website && <li><span>Website</span><a href={company.website} target="_blank" rel="noopener noreferrer">{company.website.replace(/^https?:\/\//, "")}</a></li>}
              </ul>
            </div>
            <EnquiryForm slug={slug} products={products} form={form} setForm={setForm} />
          </div>
        </section>
      </main>

      <footer className="ps-footer">
        <div className="ps-container ps-footer-inner">
          <span>© {new Date().getFullYear()} {company.companyName}</span>
          <span>Powered by Cliently</span>
        </div>
      </footer>
    </div>
  );
}