
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Eye,
  CalendarDays,
  UserRound,
  Tag,
  Send,
  FilePenLine,
  Loader2,
  AlertCircle,
  BookOpen,
} from "lucide-react";

import { opsApi } from "../../services/opsApi";
import "./ArticleView.css";

// ==========================================
// DATE FORMATTER
// ==========================================

function formatDate(value) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ==========================================
// ARTICLE VIEW COMPONENT
// ==========================================

function ArticleView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ========================================
  // LOAD ARTICLE
  // ========================================

  useEffect(() => {
    let active = true;

    async function loadArticle() {
      try {
        setLoading(true);
        setError("");

        const response = await opsApi.getArticle(id);

        if (!active) return;

        const result = response?.data || response;
        if (!result || typeof result !== "object" || !result._id) {
          throw new Error("Article details are unavailable.");
        }
        setArticle(result);
      } catch (err) {
        if (active) {
          setArticle(null);
          setError(err.message || "Unable to load article.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadArticle();

    return () => {
      active = false;
    };
  }, [id]);

  // ========================================
  // PUBLISH / UNPUBLISH
  // ========================================

  async function handleStatusChange() {
    if (!article || actionLoading) return;

    const newStatus =
      article.status === "Published"
        ? "Draft"
        : "Published";

    try {
      setActionLoading(true);
      setError("");

      const response = await opsApi.updateArticle(id, {
        status: newStatus,
      });

      const updatedArticle = response?.data || response;
      if (!updatedArticle || typeof updatedArticle !== "object" || !updatedArticle._id) {
        throw new Error("Unable to confirm article status update.");
      }
      setArticle(updatedArticle);
    } catch (err) {
      setError(
        err.message || "Unable to update article status."
      );
    } finally {
      setActionLoading(false);
    }
  }

  // ========================================
  // DELETE ARTICLE
  // ========================================

  async function handleDelete() {
    if (!article || actionLoading) return;

    try {
      setActionLoading(true);
      setError("");

      await opsApi.deleteArticle(id);

      navigate("/operations/knowledge-base", {
        replace: true,
      });
    } catch (err) {
      setError(err.message || "Unable to delete article.");
      setShowDeleteConfirm(false);
    } finally {
      setActionLoading(false);
    }
  }

  // ========================================
  // LOADING STATE
  // ========================================

  if (loading) {
    return (
      <div className="ops-article-view-loading">
        <Loader2 size={28} className="ops-article-view-spin" />
        <p>Loading article...</p>
      </div>
    );
  }

  // ========================================
  // ERROR / NOT FOUND
  // ========================================

  if (!article) {
    return (
      <div className="ops-article-view">
        <button
          type="button"
          className="ops-article-view-back"
          onClick={() =>
            navigate("/operations/knowledge-base")
          }
        >
          <ArrowLeft size={18} />
          Back to Knowledge Base
        </button>

        <div className="ops-article-view-empty">
          <AlertCircle size={38} />
          <h2>Article unavailable</h2>
          <p>{error || "This article could not be found."}</p>
        </div>
      </div>
    );
  }

  const isPublished = article.status === "Published";
  const isPublic = article.visibility === "Public";

  return (
    <div className="ops-article-view">
      {/* =====================================
          BACK NAVIGATION
      ===================================== */}

      <button
        type="button"
        className="ops-article-view-back"
        onClick={() =>
          navigate("/operations/knowledge-base")
        }
      >
        <ArrowLeft size={18} />
        Back to Knowledge Base
      </button>

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="ops-article-view-header">
        <div className="ops-article-view-header-main">
          <div className="ops-article-view-eyebrow">
            <BookOpen size={16} />
            Knowledge Base Article
          </div>

          <h1>{article.title}</h1>

          {article.summary && (
            <p className="ops-article-view-summary">
              {article.summary}
            </p>
          )}

          <div className="ops-article-view-badges">
            <span
              className={`ops-article-view-badge ${
                isPublished
                  ? "ops-article-view-badge-published"
                  : "ops-article-view-badge-draft"
              }`}
            >
              {isPublished ? "Published" : "Draft"}
            </span>

            <span className="ops-article-view-badge ops-article-view-badge-visibility">
              {isPublic ? (
                <Globe size={13} />
              ) : (
                <Lock size={13} />
              )}
              {article.visibility || "Internal"}
            </span>

            <span className="ops-article-view-badge ops-article-view-badge-category">
              {article.category || "General"}
            </span>
          </div>
        </div>

        <div className="ops-article-view-actions">
          <button
            type="button"
            className="ops-article-view-btn ops-article-view-btn-edit"
            onClick={() =>
              navigate(
                `/operations/knowledge-base/${id}/edit`
              )
            }
            disabled={actionLoading}
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            type="button"
            className="ops-article-view-btn ops-article-view-btn-publish"
            onClick={handleStatusChange}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <Loader2
                size={16}
                className="ops-article-view-spin"
              />
            ) : isPublished ? (
              <FilePenLine size={16} />
            ) : (
              <Send size={16} />
            )}

            {isPublished ? "Unpublish" : "Publish"}
          </button>

          <button
            type="button"
            className="ops-article-view-btn ops-article-view-btn-delete"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={actionLoading}
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {/* =====================================
          ERROR MESSAGE
      ===================================== */}

      {error && (
        <div className="ops-article-view-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* =====================================
          ARTICLE LAYOUT
      ===================================== */}

      <div className="ops-article-view-layout">
        {/* ARTICLE CONTENT */}

        <article className="ops-article-view-card">
          <div className="ops-article-view-section-heading">
            <BookOpen size={18} />
            <h2>Article Content</h2>
          </div>

          <div className="ops-article-view-content">
            {article.content || "No content available."}
          </div>
        </article>

        {/* ARTICLE INFORMATION */}

        <aside className="ops-article-view-sidebar">
          <div className="ops-article-view-info-card">
            <h2>Article Information</h2>

            <div className="ops-article-view-info-list">
              <div className="ops-article-view-info-item">
                <span>
                  <UserRound size={15} />
                  Author
                </span>
                <strong>
                  {article.authorName || "Operations Staff"}
                </strong>
              </div>

              <div className="ops-article-view-info-item">
                <span>
                  <CalendarDays size={15} />
                  Created
                </span>
                <strong>
                  {formatDate(article.createdAt)}
                </strong>
              </div>

              <div className="ops-article-view-info-item">
                <span>
                  <CalendarDays size={15} />
                  Updated
                </span>
                <strong>
                  {formatDate(article.updatedAt)}
                </strong>
              </div>

              <div className="ops-article-view-info-item">
                <span>
                  <CalendarDays size={15} />
                  Published
                </span>
                <strong>
                  {formatDate(article.publishedAt)}
                </strong>
              </div>

              <div className="ops-article-view-info-item">
                <span>
                  <Eye size={15} />
                  Views
                </span>
                <strong>{article.views ?? 0}</strong>
              </div>
            </div>
          </div>

          <div className="ops-article-view-info-card">
            <div className="ops-article-view-tags-title">
              <Tag size={17} />
              <h2>Tags</h2>
            </div>

            {article.tags?.length > 0 ? (
              <div className="ops-article-view-tags">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="ops-article-view-tag"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="ops-article-view-no-tags">
                No tags added.
              </p>
            )}
          </div>
        </aside>
      </div>

      {/* =====================================
          DELETE CONFIRMATION MODAL
      ===================================== */}

      {showDeleteConfirm && (
        <div
          className="ops-article-view-modal-overlay"
          onClick={() => {
            if (!actionLoading) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div
            className="ops-article-view-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ops-article-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="ops-article-view-modal-icon">
              <Trash2 size={24} />
            </div>

            <h2 id="ops-article-delete-title">
              Delete Article?
            </h2>

            <p>
              Are you sure you want to delete
              <strong> {article.title}</strong>?
              This action cannot be undone.
            </p>

            <div className="ops-article-view-modal-actions">
              <button
                type="button"
                className="ops-article-view-modal-cancel"
                onClick={() =>
                  setShowDeleteConfirm(false)
                }
                disabled={actionLoading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="ops-article-view-modal-delete"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2
                    size={16}
                    className="ops-article-view-spin"
                  />
                ) : (
                  <Trash2 size={16} />
                )}

                {actionLoading
                  ? "Deleting..."
                  : "Delete Article"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleView;
