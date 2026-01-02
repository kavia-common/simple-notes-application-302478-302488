import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  createNote,
  deleteNote,
  getMe,
  listNotes,
  login,
  register,
  setAuthToken,
  updateNote,
} from "./apiClient";

function getStoredToken() {
  try {
    return localStorage.getItem("sn_token") || "";
  } catch {
    return "";
  }
}

function setStoredToken(token) {
  try {
    if (token) localStorage.setItem("sn_token", token);
    else localStorage.removeItem("sn_token");
  } catch {
    // ignore
  }
}

function truncate(s, n = 40) {
  if (!s) return "";
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

// PUBLIC_INTERFACE
function App() {
  const [token, setToken] = useState(getStoredToken());
  const [user, setUser] = useState(null);

  const [authMode, setAuthMode] = useState("login"); // login | register
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || null,
    [notes, selectedId]
  );

  useEffect(() => {
    setAuthToken(token || "");
  }, [token]);

  async function loadAll() {
    setError("");
    setBusy(true);
    try {
      const me = await getMe();
      setUser(me);

      const data = await listNotes();
      setNotes(data);

      // Auto-select the most recently updated note.
      if (data.length > 0) {
        const pick = selectedId && data.some((n) => n.id === selectedId) ? selectedId : data[0].id;
        setSelectedId(pick);
      } else {
        setSelectedId(null);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to load data");
      // If token is invalid, logout.
      if (e?.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (token) {
      loadAll();
    } else {
      setUser(null);
      setNotes([]);
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    // When selection changes, reset editor to selected note content.
    if (selectedNote) {
      setDraftTitle(selectedNote.title || "");
      setDraftContent(selectedNote.content || "");
    } else {
      setDraftTitle("");
      setDraftContent("");
    }
  }, [selectedNote]);

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (authMode === "register") {
        await register(authEmail, authPassword);
      }
      const res = await login(authEmail, authPassword);
      setStoredToken(res.access_token);
      setToken(res.access_token);
      setAuthEmail("");
      setAuthPassword("");
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  function handleLogout() {
    setStoredToken("");
    setToken("");
    setUser(null);
    setNotes([]);
    setSelectedId(null);
    setError("");
  }

  async function handleNewNote() {
    setError("");
    setBusy(true);
    try {
      const note = await createNote({ title: "Untitled", content: "" });
      const data = [note, ...notes];
      setNotes(data);
      setSelectedId(note.id);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to create note");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteSelected() {
    if (!selectedNote) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this note? This cannot be undone.");
    if (!ok) return;

    setError("");
    setBusy(true);
    try {
      await deleteNote(selectedNote.id);
      const data = notes.filter((n) => n.id !== selectedNote.id);
      setNotes(data);
      setSelectedId(data.length ? data[0].id : null);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to delete note");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!selectedNote) return;

    setError("");
    setBusy(true);
    try {
      const updated = await updateNote(selectedNote.id, {
        title: draftTitle,
        content: draftContent,
      });
      const data = notes.map((n) => (n.id === updated.id ? updated : n));
      // Keep updated note at the top in UI feel (even if backend sorts, we update list here).
      data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setNotes(data);
      setSelectedId(updated.id);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Failed to save note");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="sn-root">
        <div className="sn-auth-card" role="main" aria-label="Authentication">
          <div className="sn-auth-header">
            <div>
              <div className="sn-brand">Simple Notes</div>
              <div className="sn-subtitle">Create, edit, and organize your notes.</div>
            </div>
          </div>

          <div className="sn-auth-tabs" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={`sn-tab ${authMode === "login" ? "is-active" : ""}`}
              onClick={() => setAuthMode("login")}
              role="tab"
              aria-selected={authMode === "login"}
            >
              Login
            </button>
            <button
              type="button"
              className={`sn-tab ${authMode === "register" ? "is-active" : ""}`}
              onClick={() => setAuthMode("register")}
              role="tab"
              aria-selected={authMode === "register"}
            >
              Register
            </button>
          </div>

          <form className="sn-form" onSubmit={handleAuthSubmit}>
            <label className="sn-label">
              Email
              <input
                className="sn-input"
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>

            <label className="sn-label">
              Password
              <input
                className="sn-input"
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={authMode === "register" ? "new-password" : "current-password"}
                placeholder="At least 6 characters"
              />
            </label>

            {error ? <div className="sn-error">{error}</div> : null}

            <button className="sn-primary" type="submit" disabled={busy}>
              {busy ? "Please wait…" : authMode === "register" ? "Create account" : "Login"}
            </button>

            <div className="sn-hint">
              API URL: <code>{process.env.REACT_APP_API_BASE_URL || "http://localhost:3001"}</code>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="sn-app" aria-label="Simple Notes application">
      <header className="sn-topbar">
        <div className="sn-topbar-left">
          <div className="sn-brand">Simple Notes</div>
          <div className="sn-pill" title="Signed in user">
            {user?.email || "Signed in"}
          </div>
        </div>
        <div className="sn-topbar-actions">
          <button type="button" className="sn-ghost" onClick={loadAll} disabled={busy}>
            Refresh
          </button>
          <button type="button" className="sn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="sn-layout">
        <aside className="sn-sidebar" aria-label="Notes list">
          <div className="sn-sidebar-header">
            <button type="button" className="sn-primary" onClick={handleNewNote} disabled={busy}>
              + New
            </button>
            <button
              type="button"
              className="sn-danger"
              onClick={handleDeleteSelected}
              disabled={busy || !selectedNote}
              title="Delete selected note"
            >
              Delete
            </button>
          </div>

          <div className="sn-notes">
            {notes.length === 0 ? (
              <div className="sn-empty">
                No notes yet.
                <button type="button" className="sn-link" onClick={handleNewNote} disabled={busy}>
                  Create your first note
                </button>
              </div>
            ) : (
              notes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`sn-note-item ${n.id === selectedId ? "is-active" : ""}`}
                  onClick={() => setSelectedId(n.id)}
                >
                  <div className="sn-note-title">{n.title?.trim() ? n.title : "Untitled"}</div>
                  <div className="sn-note-snippet">{truncate(n.content?.trim() || "", 64) || " "}</div>
                </button>
              ))
            )}
          </div>
        </aside>

        <main className="sn-main" aria-label="Note editor">
          {selectedNote ? (
            <div className="sn-editor">
              <div className="sn-editor-header">
                <div className="sn-editor-meta">
                  <div className="sn-meta-label">Last updated</div>
                  <div className="sn-meta-value">
                    {new Date(selectedNote.updated_at).toLocaleString()}
                  </div>
                </div>
                <button type="button" className="sn-secondary" onClick={handleSave} disabled={busy}>
                  {busy ? "Saving…" : "Save"}
                </button>
              </div>

              {error ? <div className="sn-error sn-error-inline">{error}</div> : null}

              <label className="sn-label sn-editor-label">
                Title
                <input
                  className="sn-input sn-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Note title…"
                />
              </label>

              <label className="sn-label sn-editor-label">
                Content
                <textarea
                  className="sn-textarea"
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Write your note…"
                />
              </label>
            </div>
          ) : (
            <div className="sn-main-empty">
              <div className="sn-main-empty-card">
                <div className="sn-main-empty-title">Select a note</div>
                <div className="sn-main-empty-subtitle">Choose one from the left, or create a new note.</div>
                <button type="button" className="sn-primary" onClick={handleNewNote} disabled={busy}>
                  + New note
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
