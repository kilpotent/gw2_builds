import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getPublicBuild, deleteBuild } from "../../services/buildService";
import professionBackgrounds from "../../../assets/images/build-background-images/professionBackgrounds";
import styles from "./BuildDetail.module.css";

function GearPiece({ label, item, shape = "circle" }) {
  return (
    <div className={styles.gearPiece}>
      <span className={styles.gearLabel}>{label}</span>
      {item ? (
        <div className={styles.gearValue}>
          <img
            src={item.icon}
            alt={item.name}
            className={shape === "square" ? styles.iconSquare : ""}
          />
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
    if (!window.confirm(`Delete "${build.build_name}"? This can't be undone.`))
      return;
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
        <p className="text-muted">
          Loading build...(Database is sleeping. Waking it up.)
        </p>
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
  const weaponSets = build.data.weapons || {};
  const skills = build.data.skills || {};
  const skillUtilities = skills.utilities || [];

  return (
    <div className="container mt-4 mb-5">
      <div
        className={styles.banner}
        style={{
          backgroundImage: `url(${professionBackgrounds[build.profession]})`,
        }}
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
      <div className={styles.linesStack}>
        {(build.data.lines || []).map((line, idx) =>
          line ? (
            <div
              className={`${styles.lineCard} ${
                line.specialization.background ? styles.lineCardWithBg : ""
              }`}
              style={
                line.specialization.background
                  ? {
                      backgroundImage: `url(${line.specialization.background})`,
                    }
                  : undefined
              }
              key={idx}
            >
              <div className={styles.lineContent}>
                <div className={styles.lineHeader}>
                  <img src={line.specialization.icon} alt="" />
                  <span>{line.specialization.name}</span>
                  {line.specialization.elite && (
                    <span className={styles.eliteBadge}>Elite</span>
                  )}
                </div>
                <div className={styles.traitsRow}>
                  {[0, 1, 2]
                    .flatMap((tIdx) => {
                      const minor = line.minorTraits?.[tIdx];
                      const major = line.traits?.[tIdx];
                      return [
                        minor ? (
                          <div
                            className={`${styles.traitChip} ${styles.minorChip}`}
                            key={`m${tIdx}`}
                          >
                            <img src={minor.icon} alt="" />
                            <span>{minor.name}</span>
                          </div>
                        ) : null,
                        major ? (
                          <div className={styles.traitChip} key={`M${tIdx}`}>
                            <img src={major.icon} alt="" />
                            <span>{major.name}</span>
                          </div>
                        ) : (
                          <span className={styles.traitEmpty} key={`M${tIdx}`}>
                            -- none chosen --
                          </span>
                        ),
                      ];
                    })
                    .filter(Boolean)}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.lineCard} key={idx}>
              <div className={styles.lineContent}>
                <span className={styles.traitEmpty}>
                  -- no specialization chosen --
                </span>
              </div>
            </div>
          ),
        )}
      </div>

      <h4 className="mt-4">Gear</h4>
      <div className={styles.gearGrid}>
        <GearPiece label="Amulet" item={gear.amulet} shape="square" />
        <GearPiece label="Rune" item={gear.rune} shape="square" />
        <GearPiece label="Relic" item={gear.relic} shape="square" />
      </div>

      <h4 className="mt-4">Weapons</h4>
      <div className={styles.weaponSetsGrid}>
        {["set1", "set2"].map((key, idx) => {
          const ws = weaponSets[key];
          const hasWeapon = ws && (ws.main || ws.off || ws.twoHand);
          return (
            <div className={styles.weaponSetCard} key={key}>
              <h6>Weapon Set {idx + 1}</h6>
              {!hasWeapon ? (
                <span className={styles.traitEmpty}>-- not set --</span>
              ) : ws.type === "twoHand" ? (
                <div className={styles.gearGrid}>
                  <GearPiece label="Weapon" item={ws.twoHand} />
                  <GearPiece label="Sigil 1" item={ws.sigil1} />
                  <GearPiece label="Sigil 2" item={ws.sigil2} />
                </div>
              ) : (
                <div className={styles.gearGrid}>
                  <GearPiece label="Main Hand" item={ws.main} />
                  <GearPiece label="Main Hand Sigil" item={ws.sigil1} />
                  <GearPiece label="Off Hand" item={ws.off} />
                  <GearPiece label="Off Hand Sigil" item={ws.sigil2} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <h4 className="mt-4">Skills</h4>
      <div className={styles.gearGrid}>
        <GearPiece label="Heal Skill" item={skills.heal} />
        <GearPiece label="Utility 1" item={skillUtilities[0]} />
        <GearPiece label="Utility 2" item={skillUtilities[1]} />
        <GearPiece label="Utility 3" item={skillUtilities[2]} />
        <GearPiece label="Elite Skill" item={skills.elite} />
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
