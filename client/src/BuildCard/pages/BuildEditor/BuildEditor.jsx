import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import TraitLineSelector from "../../../components/TraitLineSelector/TraitLineSelector";
import { useAuth } from "../../context/AuthContext";
import { getProfessions } from "../../services/gw2Api";
import { getCharacters } from "../../services/characterService";
import { createBuild, getBuild, updateBuild } from "../../services/buildService";
import styles from "./BuildEditor.module.css";

const PROFESSION_IDS = [
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

const GAME_MODES = ["PvE", "PvP", "WvW"];

function BuildEditor() {
  const { user } = useAuth();
  const { buildId } = useParams();
  const isEditing = Boolean(buildId);

  const [professions, setProfessions] = useState([]);
  const [profession, setProfession] = useState(null);
  const [lines, setLines] = useState([null, null, null]);
  const [initialLines, setInitialLines] = useState(null);

  const [buildName, setBuildName] = useState("");
  const [gameMode, setGameMode] = useState(GAME_MODES[0]);
  const [isPublic, setIsPublic] = useState(true);

  const [characters, setCharacters] = useState([]);
  const [characterId, setCharacterId] = useState("");

  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [loadError, setLoadError] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    getProfessions(PROFESSION_IDS)
      .then((data) => {
        const order = new Map(PROFESSION_IDS.map((id, i) => [id, i]));
        setProfessions(data.sort((a, b) => order.get(a.id) - order.get(b.id)));
      })
      .catch(() => setProfessions([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setCharacters([]);
      setCharacterId("");
      return;
    }
    getCharacters()
      .then(setCharacters)
      .catch(() => setCharacters([]));
  }, [user]);

  useEffect(() => {
    if (!buildId) return;

    let cancelled = false;
    setLoadingExisting(true);
    setLoadError("");

    getBuild(buildId)
      .then((build) => {
        if (cancelled) return;
        setProfession(build.data.profession);
        setInitialLines(build.data.lines);
        setBuildName(build.build_name);
        setGameMode(build.game_mode || GAME_MODES[0]);
        setIsPublic(build.is_public);
        setCharacterId(String(build.character_id));
      })
      .catch(() => {
        if (!cancelled) setLoadError("This build doesn't exist or isn't yours to edit.");
      })
      .finally(() => {
        if (!cancelled) setLoadingExisting(false);
      });

    return () => {
      cancelled = true;
    };
  }, [buildId]);

  function handleProfessionClick(profId) {
    if (isEditing) return;
    setProfession(profId);
    setCharacterId("");
  }

  const matchingCharacters = characters.filter((c) => c.profession === profession);
  const isComplete =
    profession &&
    lines.every((line) => line && line.traits.every((t) => t));

  async function handleSave(e) {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    if (!buildName.trim()) {
      setSaveError("Give your build a name first.");
      return;
    }
    if (!characterId) {
      setSaveError("Choose a character to save this build under.");
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await updateBuild(buildId, {
          buildName: buildName.trim(),
          gameMode,
          isPublic,
          data: { profession, lines },
        });
        setSaveSuccess("Build updated!");
      } else {
        await createBuild({
          characterId,
          buildName: buildName.trim(),
          gameMode,
          isPublic,
          data: { profession, lines },
        });
        setSaveSuccess("Build saved!");
      }
    } catch {
      setSaveError(
        isEditing ? "The build couldn't be updated." : "The build couldn't be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingExisting) {
    return (
      <div className="container mt-4 mb-5">
        <p className="text-muted">Loading build…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mt-4 mb-5">
        <div className="alert alert-danger">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="container mt-4 mb-5">
      <h2 className="mb-3">{isEditing ? "Edit Build" : "Build Editor"}</h2>
      <p className="text-muted">
        {isEditing
          ? "Editing an existing build — the profession and character are locked, but specializations, traits, and details below can be changed."
          : "Pick a profession, then hover any specialization option below to preview its traits before choosing it. Any of the 3 lines can hold a core or an elite specialization."}
      </p>

      <div className={styles.professionGrid}>
        {professions.map((prof) => (
          <button
            type="button"
            key={prof.id}
            className={`${styles.professionButton} ${
              profession === prof.id ? styles.professionSelected : ""
            }`}
            onClick={() => handleProfessionClick(prof.id)}
            disabled={isEditing}
          >
            <img src={prof.icon} alt={prof.name} />
            <span>{prof.name}</span>
          </button>
        ))}
      </div>

      {profession && (
        <div className="mt-4">
          <TraitLineSelector
            key={profession}
            profession={profession}
            initialLines={initialLines}
            onChange={setLines}
          />
        </div>
      )}

      {profession && (
        <form className={`${styles.saveForm} mt-4`} onSubmit={handleSave}>
          <h4>{isEditing ? "Save changes" : "Save this build"}</h4>

          {!isComplete && (
            <div className="alert alert-warning">
              Choose all 3 specializations and one trait per tier to complete
              the build.
            </div>
          )}

          {!user && (
            <div className="alert alert-info">
              <Link to="/login">Log in</Link> to save this build to a
              character.
            </div>
          )}

          {user && matchingCharacters.length === 0 && (
            <div className="alert alert-info">
              You don't have a {profession} character yet. Create one from
              your <Link to="/dashboard">Dashboard</Link> first.
            </div>
          )}

          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <label className="form-label">Build name</label>
              <input
                type="text"
                className="form-control"
                value={buildName}
                onChange={(e) => setBuildName(e.target.value)}
                disabled={!user}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Character</label>
              <select
                className="form-select"
                value={characterId}
                onChange={(e) => setCharacterId(e.target.value)}
                disabled={!user || matchingCharacters.length === 0 || isEditing}
              >
                <option value="">-- choose --</option>
                {matchingCharacters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label">Game mode</label>
              <select
                className="form-select"
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                disabled={!user}
              >
                {GAME_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2 form-check ms-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={!user}
              />
              <label className="form-check-label" htmlFor="isPublic">
                Public
              </label>
            </div>

            <div className="col-md-1">
              <button
                type="submit"
                className="btn btn-primary w-100"
                disabled={!user || saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>

          {saveError && <div className="alert alert-danger mt-3">{saveError}</div>}
          {saveSuccess && (
            <div className="alert alert-success mt-3">
              {saveSuccess}{" "}
              {isEditing ? (
                <Link to="/my-builds">Back to My Builds</Link>
              ) : (
                <Link to="/">View public builds</Link>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default BuildEditor;
