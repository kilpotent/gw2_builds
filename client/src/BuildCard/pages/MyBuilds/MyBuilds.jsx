import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getMyBuilds, deleteBuild } from "../../services/buildService";
import styles from "./MyBuilds.module.css";

function MyBuilds() {
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const highlightRef = useRef(null);

  useEffect(() => {
    getMyBuilds()
      .then(setBuilds)
      .catch(() => setError("Couldn't load your builds."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightId, builds]);

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete "${name}"? This can't be undone.`)) return;

    try {
      setDeletingId(id);
      await deleteBuild(id);
      setBuilds((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError("The build couldn't be deleted.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">My Builds</h2>
        <Link className="btn btn-primary btn-sm" to="/builder">
          + New Build
        </Link>
      </div>

      {loading && <p className="text-muted">Loading your builds...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && builds.length === 0 && (
        <p className="text-muted">
          You haven't saved any builds yet. Head to the Build Editor to create one!
        </p>
      )}

      <div className="row g-3">
        {builds.map((build) => {
          const isHighlighted = String(build.id) === highlightId;
          return (
            <div className="col-md-6 col-lg-4" key={build.id}>
              <div
                ref={isHighlighted ? highlightRef : null}
                className={`card h-100 ${styles.buildCard} ${
                  isHighlighted ? styles.highlighted : ""
                }`}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <h5 className="card-title mb-0">{build.build_name}</h5>
                      <p className="card-subtitle text-muted small">
                        {build.character_name} · {build.profession}
                        {build.game_mode ? ` · ${build.game_mode}` : ""}
                      </p>
                    </div>
                    {!build.is_public && (
                      <span className="badge text-bg-secondary">Private</span>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <Link
                      className="btn btn-outline-primary btn-sm"
                      to={`/builder/${build.id}`}
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      disabled={deletingId === build.id}
                      onClick={() => handleDelete(build.id, build.build_name)}
                    >
                      {deletingId === build.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MyBuilds;
