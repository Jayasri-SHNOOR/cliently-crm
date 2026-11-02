import { useState, useEffect } from "react";
import { Search, Plus, Trash2, NotebookPen } from "lucide-react";

const API_URL = "http://localhost:5000/api/notes";

function Notes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Fetch notes from the backend
  async function fetchNotes() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notes.");
      }

      setNotes(data.notes || []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  const filteredNotes = notes.filter((note) =>
    `${note.title || note.noteTitle || ""} ${
      note.content || note.noteContent || ""
    }`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // Create a note in MongoDB
  async function addNote(e) {
    e.preventDefault();

    if (!noteTitle.trim() || !noteContent.trim()) return;

    try {
      setSaving(true);
      setError("");

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: noteContent.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save note.");
      }

      setNoteTitle("");
      setNoteContent("");
      setShowForm(false);

      await fetchNotes();
    } catch (err) {
      setError(err.message || "Unable to save note.");
    } finally {
      setSaving(false);
    }
  }

  // Delete a note from MongoDB
  async function deleteNote(id) {
    const confirmed = window.confirm("Are you sure you want to delete this note?");
    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete note.");
      }

      setNotes((currentNotes) =>
        currentNotes.filter((note) => (note._id || note.id) !== id)
      );
    } catch (err) {
      setError(err.message || "Unable to delete note.");
    }
  }

  function formatDate(note) {
    const dateValue = note.createdAt || note.date || note.updatedAt;

    if (!dateValue) return "Recently added";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) return String(dateValue);

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Notes</h1>
          <p>Keep track of customer discussions and reminders.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={17} />
          Add Note
        </button>
      </div>

      {showForm && (
        <form className="note-form" onSubmit={addNote}>
          <h2>Create a Note</h2>

          <label>Title</label>
          <input
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="Enter note title"
            required
          />

          <label>Note</label>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note..."
            required
          />

          <div className="task-form-actions">
            <button
              type="button"
              className="filter-button"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Note"}
            </button>
          </div>
        </form>
      )}

      {error && (
        <div role="alert" style={{ color: "#b42318", margin: "12px 0" }}>
          {error}
          <button
            type="button"
            className="filter-button"
            onClick={fetchNotes}
            style={{ marginLeft: "12px" }}
          >
            Retry
          </button>
        </div>
      )}

      <div className="notes-toolbar">
        <div className="lead-search">
          <Search size={17} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
          />
        </div>

        <span className="lead-count">{notes.length} Notes</span>
      </div>

      {loading ? (
        <p>Loading notes...</p>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => {
            const id = note._id || note.id;
            const title = note.title || note.noteTitle || "Untitled";
            const content = note.content || note.noteContent || "";

            return (
              <article className="note-card" key={id}>
                <div className="note-card-heading">
                  <div className="note-icon">
                    <NotebookPen size={19} />
                  </div>

                  <button
                    type="button"
                    className="action-button"
                    onClick={() => deleteNote(id)}
                    aria-label={`Delete ${title}`}
                    title="Delete note"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>

                <h3>{title}</h3>
                <p>{content}</p>
                <span className="note-date">{formatDate(note)}</span>
              </article>
            );
          })}

          {filteredNotes.length === 0 && (
            <p className="empty-tasks">
              {searchTerm ? "No matching notes found." : "No notes yet. Add your first note!"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Notes;