import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import styles from "./Account.module.css";
import {
  getCharacters,
  createCharacter,
  deleteCharacter,
} from "../../services/characterService";
import { changePassword, deleteAccount } from "../../services/authService";

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

function Account() {
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newName, setNewName] = useState("");
  const [newProfession, setNewProfession] = useState(PROFESSIONS[0]);
  const [creating, setCreating] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const nameInputRef = useRef(null);

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    if (searchParams.get("action") === "add" && nameInputRef.current) {
      nameInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      nameInputRef.current.focus();
    }
  }, [searchParams]);

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

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("The new passwords don't match.");
      return;
    }

    try {
      setChangingPassword(true);
      await changePassword(currentPassword, newPassword);
      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err.response?.data?.error || "Couldn't change the password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError("");

    try {
      setDeletingAccount(true);
      await deleteAccount(deletePassword);
      logout();
      // Full reload rather than client-side navigate: this avoids a race where
      // ProtectedRoute (still mounted on this route while the SPA transition
      // to "/" is in flight) sees user === null first and redirects to /login.
      window.location.href = "/";
    } catch (err) {
      setDeleteError(err.response?.data?.error || "Couldn't delete the account.");
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Hello, {user?.username}</h2>
        <button className="btn btn-outline-secondary btn-sm" onClick={logout}>
          Logout
        </button>
      </div>
      {error && <div className="alert alert-danger">{error}</div>}

      <h4 className="mb-3">Characters</h4>

      {/* Φόρμα δημιουργίας νέου χαρακτήρα */}
      <form onSubmit={handleCreate} className="row g-2 mb-4">
        <div className="col-auto">
          <input
            ref={nameInputRef}
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
        <div className="row g-3 mb-5">
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

      <hr className="my-5" />

      <h4 className="mb-3">Account Settings</h4>

      <div className={`card mb-4 ${styles.settingsCard}`}>
        <div className="card-body">
          <h5 className="card-title">Change Password</h5>
          {passwordMessage && (
            <div className="alert alert-success">{passwordMessage}</div>
          )}
          {passwordError && <div className="alert alert-danger">{passwordError}</div>}

          <form onSubmit={handleChangePassword} className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label">Current password</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">New password</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Confirm new password</label>
              <input
                type="password"
                className="form-control"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="col-md-3">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={changingPassword}
              >
                {changingPassword ? "Saving..." : "Change Password"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`card border-danger ${styles.settingsCard}`}>
        <div className="card-body">
          <h5 className="card-title text-danger">Delete Account</h5>
          <p className="text-muted">
            This permanently deletes your account, all your characters, and all
            your builds. This can't be undone.
          </p>

          {deleteError && <div className="alert alert-danger">{deleteError}</div>}

          {!showDeleteConfirm ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete my account
            </button>
          ) : (
            <form onSubmit={handleDeleteAccount} className="row g-2 align-items-end">
              <div className="col-md-4">
                <label className="form-label">Confirm your password</label>
                <input
                  type="password"
                  className="form-control"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="col-auto">
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={deletingAccount}
                >
                  {deletingAccount ? "Deleting..." : "Permanently delete account"}
                </button>
              </div>
              <div className="col-auto">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
export default Account;
