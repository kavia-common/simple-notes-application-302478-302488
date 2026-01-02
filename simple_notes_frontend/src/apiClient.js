import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// PUBLIC_INTERFACE
export function setAuthToken(token) {
  /** Set (or clear) the Bearer token used for API requests. */
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    // eslint-disable-next-line no-param-reassign
    delete client.defaults.headers.common.Authorization;
  }
}

// PUBLIC_INTERFACE
export async function register(email, password) {
  /** Register a new user. */
  const res = await client.post("/auth/register", { email, password });
  return res.data;
}

// PUBLIC_INTERFACE
export async function login(email, password) {
  /** Login and return {access_token, token_type}. */
  const res = await client.post("/auth/login", { email, password });
  return res.data;
}

// PUBLIC_INTERFACE
export async function getMe() {
  /** Return current user profile. */
  const res = await client.get("/auth/me");
  return res.data;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** List notes for current user. */
  const res = await client.get("/notes");
  return res.data;
}

// PUBLIC_INTERFACE
export async function createNote({ title = "", content = "" } = {}) {
  /** Create a note. */
  const res = await client.post("/notes", { title, content });
  return res.data;
}

// PUBLIC_INTERFACE
export async function updateNote(noteId, patch) {
  /** Update a note by id. */
  const res = await client.put(`/notes/${noteId}`, patch);
  return res.data;
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId) {
  /** Delete a note by id. */
  await client.delete(`/notes/${noteId}`);
}
