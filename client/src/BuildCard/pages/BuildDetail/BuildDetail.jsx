import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPublicBuild, deleteBuild } from "../../services/buildService";
import professionBackgrounds from "../../../assets/images/build-background-images/professionBackgrounds";
import styles from "./BuildDetail.module.css";

function GearPiece({ label, item }) {
  return (
    <div className={styles.gearPiece}>
      <span className={styles.gearLabel}>{label}</span>
      {item ? (
        <div className={styles.gearValue}>
          <img src={item.icon} alt={item.name} />
          <span>{item.name}</span>
        </div>
      ) : (
        <span className={styles.gearEmpty}>Not set</span>
      )}
    </div>
  );
}

function BuildDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [build, setBuild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError("");
    getPublicBuild(id)
      .then(setBuild)
      .catch(() => setError("This build doesn't exist or isn't public."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm(`Delete "${build.build_name}"? This can't be undone.`)) return;
    try {
      setDeleting(true);
      await deleteBuild(id);
      setDeleted(true);
    } catch {
      setError("The build couldn't be deleted.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mt-4 mb-5">
        <p className="text-muted">Loading build...</p>
      </div>
    );
  }

  if (error || !build) {
    return (
      <div className="container mt-4 mb-5">
        <div className="alert alert-danger">{error || "Build not found."}</div>
      </div>
    );
  }

  if (deleted) {
    return (
      <div className="container mt-4 mb-5">
        <div className="alert alert-success">
          Build deleted. <Link to="/my-builds">Back to My Builds</Link>
        </div>
      </div>
    );
  }

  const isOwner = user && build.owner_id === user.id;
  const gear = build.data.gear || {};
  const sigils = gear.sigils || [null, null];

  return (
    <div className="container mt-4 mb-5">
      <div
        className={styles.banner}
        style={{ backgroundImage: `url(${professionBackgrounds[build.profession]})` }}
      >
        <div className={styles.bannerOverlay}>
          <h2 className="mb-1">{build.build_name}</h2>
          <p className="mb-0">
            {build.character_name} · {build.profession}
            {build.game_mode ? ` · ${build.game_mode}` : ""}
            {!build.is_public && " · Private"}
          </p>
        </div>
      </div>

      {isOwner && (
        <div className="d-flex gap-2 mt-3">
          <Link className="btn btn-primary btn-sm" to={`/builder/${build.id}`}>
            Edit
          </Link>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      )}

      <h4 className="mt-4">Specializations &amp; Traits</h4>
      <div className="row g-3">
        {(build.data.lines || []).map((line, idx) =>
          line ? (
            <div className="col-md-4" key={idx}>
              <div className={styles.lineCard}>
                <div className={styles.lineHeader}>
                  <img src={line.specialization.icon} alt="" />
                  <span>{line.specialization.name}</span>
                  {line.specialization.elite && (
                    <span className={styles.eliteBadge}>Elite</span>
                  )}
                </div>
                {line.traits.map((trait, tIdx) =>
                  trait ? (
                    <div className={styles.traitRow} key={tIdx}>
                      <img src={trait.icon} alt="" />
                      <span>{trait.name}</span>
                    </div>
                  ) : (
                    <div className={styles.traitRow} key={tIdx}>
                      <span className={styles.traitEmpty}>-- none chosen --</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          ) : (
            <div className="col-md-4" key={idx}>
              <div className={styles.lineCard}>
                <span className={styles.traitEmpty}>-- no specialization chosen --</span>
              </div>
            </div>
          ),
        )}
      </div>

      <h4 className="mt-4">Gear</h4>
      <div className={styles.gearGrid}>
        <GearPiece label="Amulet" item={gear.amulet} />
        <GearPiece label="Rune" item={gear.rune} />
        <GearPiece label="Sigil 1" item={sigils[0]} />
        <GearPiece label="Sigil 2" item={sigils[1]} />
        <GearPiece label="Relic" item={gear.relic} />
      </div>

      {build.data.description && (
        <>
          <h4 className="mt-4">Playstyle &amp; Notes</h4>
          <p className={styles.description}>{build.data.description}</p>
        </>
      )}
    </div>
  );
}

export default BuildDetail;
