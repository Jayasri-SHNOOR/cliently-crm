
import { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Send,
  Plus,
  X,
  Loader2,
} from "lucide-react";

import { opsApi } from "../../services/opsApi";
import "./ArticleEditor.css";

const EMPTY_FORM = {
  title: "",
  summary: "",
  content: "",
  category: "General",
  tags: [],
  visibility: "Internal",
  status: "Draft",
};

function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const isEditing = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    let active = true;

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await opsApi.getArticle(id);

        if (!active) return;

        const article = response.data || response;

        setForm({
          title: article.title || "",
          summary: article.summary || "",
          content: article.content || "",
          category: article.category || "General",
          tags: Array.isArray(article.tags)
            ? article.tags
            : [],
          visibility: article.visibility || "Internal",
          status: article.status || "Draft",
        });
      } catch (err) {
        if (active) {
          setError(
            err.message || "Unable to load article."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (isEditing) {
      loadArticle();
    }

    return () => {
      active = false;
    };
  }, [id, isEditing]);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      try {
        const response = typeof opsApi.articleCategories === "function"
          ? await opsApi.articleCategories()
          : await opsApi.listArticles({ page: 1, limit: 100 });

        if (!active) return;

        const result = response?.data || response;
        const names = Array.isArray(result)
          ? result.map((item) => typeof item === "string" ? item : item?.category).filter(Boolean)
          : [];
        setCategories([...new Set(names)]);
      } catch {
        // The editor still works if categories fail to load.
      }
    }

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFieldErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();

    if (!tag) return;

    if (tag.length > 30) {
      setFieldErrors((previous) => ({
        ...previous,
        tags: "Each tag must be 30 characters or fewer.",
      }));
      return;
    }

    if (form.tags.includes(tag)) {
      setTagInput("");
      return;
    }

    if (form.tags.length >= 10) {
      setFieldErrors((previous) => ({
        ...previous,
        tags: "Maximum 10 tags allowed.",
      }));
      return;
    }

    setForm((previous) => ({
      ...previous,
      tags: [...previous.tags, tag],
    }));

    setTagInput("");
    setFieldErrors((previous) => ({
      ...previous,
      tags: "",
    }));
  }

  function removeTag(tag) {
    setForm((previous) => ({
      ...previous,
      tags: previous.tags.filter(
        (item) => item !== tag
      ),
    }));
  }

  function validate() {
    const errors = {};

    if (!form.title.trim()) {
      errors.title = "Article title is required.";
    } else if (form.title.length > 200) {
      errors.title = "Maximum 200 characters.";
    }

    if (form.summary.length > 300) {
      errors.summary = "Maximum 300 characters.";
    }

    if (!form.content.trim()) {
      errors.content = "Article content is required.";
    } else if (form.content.length > 20000) {
      errors.content = "Maximum 20000 characters.";
    }

    if (form.category.length > 60) {
      errors.category = "Maximum 60 characters.";
    }

    if (form.tags.length > 10) {
      errors.tags = "Maximum 10 tags.";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  }

  async function handleSave(status) {
    if (saving || !validate()) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        title: form.title.trim(),
        summary: form.summary.trim(),
        content: form.content.trim(),
        category: form.category.trim() || "General",
        tags: form.tags,
        visibility: form.visibility,
        status,
      };

      const response = isEditing
        ? await opsApi.updateArticle(id, payload)
        : await opsApi.createArticle(payload);

      const article = response.data || response;

      navigate(
        `/operations/knowledge-base/${article._id || id}`
      );
    } catch (err) {
      setError(
        err.message || "Unable to save article."
      );

      if (err.errors) {
        setFieldErrors(err.errors);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ops-article-editor-loading">
        <Loader2 size={26} className="ops-spin" />
        <p>Loading article...</p>
      </div>
    );
  }

  return (
    <div className="ops-article-editor">
      <div className="ops-article-editor-header">
        <button
          type="button"
          className="ops-article-editor-back"
          onClick={() =>
            navigate("/operations/knowledge-base")
          }
        >
          <ArrowLeft size={18} />
          Back to Knowledge Base
        </button>

        <div className="ops-article-editor-heading">
          <h1>
            {isEditing ? "Edit Article" : "Create Article"}
          </h1>
          <p>
            {isEditing
              ? "Update your knowledge base article."
              : "Create helpful documentation for your team and customers."}
          </p>
        </div>
      </div>

      {error && (
        <div
          className="ops-article-editor-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="ops-article-editor-card">
        <div className="ops-article-editor-field">
          <label htmlFor="ops-article-title">
            Article Title <span>*</span>
          </label>

          <input
            id="ops-article-title"
            type="text"
            maxLength={200}
            placeholder="Enter article title"
            value={form.title}
            onChange={(event) =>
              updateField("title", event.target.value)
            }
          />

          <div className="ops-article-editor-field-footer">
            <span className="ops-article-editor-field-error">
              {fieldErrors.title}
            </span>
            <span>{form.title.length}/200</span>
          </div>
        </div>

        <div className="ops-article-editor-field">
          <label htmlFor="ops-article-summary">
            Summary
          </label>

          <textarea
            id="ops-article-summary"
            rows={3}
            maxLength={300}
            placeholder="Write a short article summary"
            value={form.summary}
            onChange={(event) =>
              updateField("summary", event.target.value)
            }
          />

          <div className="ops-article-editor-field-footer">
            <span className="ops-article-editor-field-error">
              {fieldErrors.summary}
            </span>
            <span>{form.summary.length}/300</span>
          </div>
        </div>

        <div className="ops-article-editor-grid">
          <div className="ops-article-editor-field">
            <label htmlFor="ops-article-category">
              Category
            </label>

            <input
              id="ops-article-category"
              type="text"
              maxLength={60}
              list="ops-article-categories"
              placeholder="e.g. General"
              value={form.category}
              onChange={(event) =>
                updateField(
                  "category",
                  event.target.value
                )
              }
            />

            <datalist id="ops-article-categories">
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                />
              ))}
            </datalist>

            {fieldErrors.category && (
              <span className="ops-article-editor-field-error">
                {fieldErrors.category}
              </span>
            )}
          </div>

          <div className="ops-article-editor-field">
            <label htmlFor="ops-article-visibility">
              Visibility
            </label>

            <select
              id="ops-article-visibility"
              value={form.visibility}
              onChange={(event) =>
                updateField(
                  "visibility",
                  event.target.value
                )
              }
            >
              <option value="Internal">
                Internal
              </option>
              <option value="Public">
                Public
              </option>
            </select>
          </div>
        </div>

        <div className="ops-article-editor-field">
          <label htmlFor="ops-article-tag">
            Tags
          </label>

          <div className="ops-article-editor-tag-input">
            <input
              id="ops-article-tag"
              type="text"
              maxLength={30}
              placeholder="Add a tag"
              value={tagInput}
              onChange={(event) =>
                setTagInput(event.target.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addTag();
                }
              }}
            />

            <button
              type="button"
              onClick={addTag}
              disabled={form.tags.length >= 10}
            >
              <Plus size={17} />
              Add
            </button>
          </div>

          {form.tags.length > 0 && (
            <div className="ops-article-editor-tags">
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  className="ops-article-editor-tag"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => removeTag(tag)}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {fieldErrors.tags && (
            <span className="ops-article-editor-field-error">
              {fieldErrors.tags}
            </span>
          )}

          <small>Maximum 10 tags.</small>
        </div>

        <div className="ops-article-editor-field">
          <label htmlFor="ops-article-content">
            Article Content <span>*</span>
          </label>

          <textarea
            id="ops-article-content"
            className="ops-article-editor-content"
            maxLength={20000}
            placeholder="Write your article content here..."
            value={form.content}
            onChange={(event) =>
              updateField(
                "content",
                event.target.value
              )
            }
          />

          <div className="ops-article-editor-field-footer">
            <span className="ops-article-editor-field-error">
              {fieldErrors.content}
            </span>
            <span>{form.content.length}/20000</span>
          </div>
        </div>
      </div>

      <div className="ops-article-editor-actions">
        <button
          type="button"
          className="ops-article-editor-cancel"
          onClick={() =>
            navigate("/operations/knowledge-base")
          }
          disabled={saving}
        >
          Cancel
        </button>

        <div className="ops-article-editor-save-actions">
          <button
            type="button"
            className="ops-article-editor-draft"
            onClick={() => handleSave("Draft")}
            disabled={saving}
          >
            <Save size={17} />
            Save Draft
          </button>

          <button
            type="button"
            className="ops-article-editor-publish"
            onClick={() => handleSave("Published")}
            disabled={saving}
          >
            {saving ? (
              <Loader2
                size={17}
                className="ops-spin"
              />
            ) : (
              <Send size={17} />
            )}
            {saving ? "Saving..." : "Publish Article"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ArticleEditor;
