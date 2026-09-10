import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Dashboard.module.css";
import {
  getCharacters,
  createCharacter,
  deleteCharacter,
} from "../../services/characterService";

const PROFESSIONS = [
  "Elementalist",
  "Mesmer",
  "Necromancer",
  "Guardian",
  "Warrior",
  "Engineer",
  "Ranger",
  "Thief",
  "Revenant",
];

function Dashboard() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newProfession, setNewProfession] = useState(PROFESSIONS[0]);
  const [creating, setCreating] = useState(false);

  const { user, logout } = useAuth();

  useEffect(() => {
    loadCharacters();
  }, []);

  async function loadCharacters() {
    try {
      setLoading(true);
      const data = await getCharacters();
      setCharacters(data);
    } catch (err) {
      setError("Error. Characters couldn't load!");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setCreating(true);
      const newChar = await createCharacter(newName, newProfession);
      setCharacters([newChar, ...characters]);
      setNewName("");
    } catch (err) {
      setError("Error. The character couldn't be created!");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm(`Are you sure you want to delete the character ${""}?`))
      return;

    try {
      await deleteCharacter(id);
      setCharacters(characters.filter((c) => c.id !== id));
    } catch (err) {
      setError("The character couldn't be deleted!");
    }
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Hello, {user?.username}</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Φόρμα δημιουργίας νέου χαρακτήρα */}
      <form onSubmit={handleCreate} className="row g-2 mb-4">
        <div className="col-auto">
          <input
            type="text"
            className="form-control"
            placeholder="Character name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div className="col-auto">
          <select
            className="form-select"
            value={newProfession}
            onChange={(e) => setNewProfession(e.target.value)}
          >
            {PROFESSIONS.map((prof) => (
              <option key={prof} value={prof}>
                {prof}
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Creating..." : "+ New Character"}
          </button>
        </div>
      </form>

      {/* Λίστα χαρακτήρων */}
      {loading ? (
        <p>Loading characters...</p>
      ) : characters.length === 0 ? (
        <p className="text-muted">
          You don't have any characters yet. Create your first!
        </p>
      ) : (
        <div className="row g-3">
          {characters.map((char) => (
            <div className="col-md-4" key={char.id}>
              <div className={`card ${styles.characterCard}`}>
                <div className="card-body">
                  <h5 className="card-title">{char.name}</h5>
                  <p className="card-subtitle text-muted mb-2">
                    {char.profession}
                  </p>
                  <div className="d-flex gap-2">
                    <Link
                      className="btn btn-outline-primary btn-sm"
                      to="/builder"
                    >
                      Build
                    </Link>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleDelete(char.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default Dashboard;
