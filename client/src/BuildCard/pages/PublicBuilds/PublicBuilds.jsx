import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPublicBuilds } from "../../services/buildService";
import styles from "./PublicBuilds.module.css";

function PublicBuilds() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [builds, setBuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicBuilds()
      .then(setBuilds)
      .catch(() => setError("Couldn't load public builds."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-3">Public Builds</h2>

      {loading && <p className="text-muted">Loading builds...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && builds.length === 0 && (
        <p className="text-muted">
          No public builds yet. Head to the Build Editor to create one!
        </p>
      )}

      <div className="row g-3">
        {builds.map((build) => {
          const isOwner = user && build.owner_id === user.id;
          return (
          <div className="col-md-6 col-lg-4" key={build.id}>
            <div
              className={`card h-100 ${styles.buildCard} ${isOwner ? styles.ownBuild : ""}`}
              role={isOwner ? "button" : undefined}
              onClick={isOwner ? () => navigate(`/my-builds?highlight=${build.id}`) : undefined}
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
                  {isOwner && <span className="badge text-bg-primary">Yours</span>}
                </div>

                <div className={styles.linesRow}>
                  {(build.data?.lines || []).map((line, idx) =>
                    line ? (
                      <div className={styles.lineChip} key={idx}>
                        <img
                          src={line.specialization.icon}
                          alt={line.specialization.name}
                          title={line.specialization.name}
                        />
                        <div className={styles.traitIcons}>
                          {line.traits.map((trait, tIdx) =>
                            trait ? (
                              <img
                                key={tIdx}
                                src={trait.icon}
                                alt={trait.name}
                                title={trait.name}
                              />
                            ) : (
                              <span key={tIdx} className={styles.emptyTrait} />
                            ),
                          )}
                        </div>
                      </div>
                    ) : null,
                  )}
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

export default PublicBuilds;
