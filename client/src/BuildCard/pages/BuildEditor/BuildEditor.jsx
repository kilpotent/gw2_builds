import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import TraitLineSelector from "../../../components/TraitLineSelector/TraitLineSelector";
import GearSelector from "../../../components/GearSelector/GearSelector";
import WeaponSetSelector, {
  EMPTY_WEAPON_SET,
  toWeaponSetState,
} from "../../../components/WeaponSetSelector/WeaponSetSelector";
import { useAuth } from "../../context/AuthContext";
import {
  getProfessions,
  getAmulets,
  getProfessionWeapons,
  getProfessionSkills,
} from "../../services/gw2Api";
import { getCharacters } from "../../services/characterService";
import { createBuild, getBuild, updateBuild } from "../../services/buildService";
import { runes, sigils, relics } from "../../../data/gear";
import { PROFESSIONS as PROFESSION_IDS, GAME_MODES } from "../../../data/constants";
import styles from "./BuildEditor.module.css";

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
  const [description, setDescription] = useState("");

  const [amulets, setAmulets] = useState([]);
  const [amuletId, setAmuletId] = useState(null);
  const [runeId, setRuneId] = useState(null);
  const [relicId, setRelicId] = useState(null);

  const [weapons, setWeapons] = useState([]);
  const [weaponSet1, setWeaponSet1] = useState(EMPTY_WEAPON_SET());
  const [weaponSet2, setWeaponSet2] = useState(EMPTY_WEAPON_SET());

  const [profSkills, setProfSkills] = useState([]);
  const [healId, setHealId] = useState(null);
  const [utility1Id, setUtility1Id] = useState(null);
  const [utility2Id, setUtility2Id] = useState(null);
  const [utility3Id, setUtility3Id] = useState(null);
  const [eliteId, setEliteId] = useState(null);

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
    getAmulets()
      .then(setAmulets)
      .catch(() => setAmulets([]));
  }, []);

  useEffect(() => {
    if (!profession) {
      setWeapons([]);
      return;
    }
    getProfessionWeapons(profession)
      .then(setWeapons)
      .catch(() => setWeapons([]));
  }, [profession]);

  useEffect(() => {
    if (!profession) {
      setProfSkills([]);
      return;
    }
    getProfessionSkills(profession)
      .then(setProfSkills)
      .catch(() => setProfSkills([]));
  }, [profession]);

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
        setDescription(build.data.description || "");
        const gear = build.data.gear || {};
        setAmuletId(gear.amulet?.id ?? null);
        setRuneId(gear.rune?.id ?? null);
        setRelicId(gear.relic?.id ?? null);
        const weaponsData = build.data.weapons || {};
        setWeaponSet1(toWeaponSetState(weaponsData.set1));
        setWeaponSet2(toWeaponSetState(weaponsData.set2));
        const skillsData = build.data.skills || {};
        setHealId(skillsData.heal?.id ?? null);
        const utilities = skillsData.utilities || [];
        setUtility1Id(utilities[0]?.id ?? null);
        setUtility2Id(utilities[1]?.id ?? null);
        setUtility3Id(utilities[2]?.id ?? null);
        setEliteId(skillsData.elite?.id ?? null);
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
    setWeaponSet1(EMPTY_WEAPON_SET());
    setWeaponSet2(EMPTY_WEAPON_SET());
    setHealId(null);
    setUtility1Id(null);
    setUtility2Id(null);
    setUtility3Id(null);
    setEliteId(null);
  }

  function pick(list, id) {
    if (!id) return null;
    const item = list.find((o) => o.id === id);
    return item ? { id: item.id, name: item.name, icon: item.icon } : null;
  }

  function buildWeaponSetPayload(ws) {
    return {
      type: ws.type,
      main: ws.type === "oneHand" ? pick(weapons, ws.mainId) : null,
      off: ws.type === "oneHand" ? pick(weapons, ws.offId) : null,
      twoHand: ws.type === "twoHand" ? pick(weapons, ws.twoHandId) : null,
      sigil1: pick(sigils, ws.sigil1Id),
      sigil2: pick(sigils, ws.sigil2Id),
    };
  }

  const matchingCharacters = characters.filter((c) => c.profession === profession);
  const isComplete =
    profession &&
    lines.every((line) => line && line.traits.every((t) => t)) &&
    amuletId &&
    runeId &&
    relicId;

  // Elite/core-spec-locked skills (e.g. Berserker's Rage skills, or an elite
  // spec's unique heal) only show up once that specialization is chosen.
  const chosenSpecIds = lines.filter(Boolean).map((l) => l.specialization.id);

  function skillsFor(slot, excludeIds = []) {
    return profSkills.filter(
      (s) =>
        s.slot === slot &&
        (!s.specialization || chosenSpecIds.includes(s.specialization)) &&
        !excludeIds.includes(s.id),
    );
  }

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
    if (!isComplete) {
      setSaveError(
        "Choose all 3 specializations, one trait per tier, and an amulet, rune, and relic before saving.",
      );
      return;
    }

    const gear = {
      amulet: pick(amulets, amuletId),
      rune: pick(runes, runeId),
      relic: pick(relics, relicId),
    };
    const weaponsPayload = {
      set1: buildWeaponSetPayload(weaponSet1),
      set2: buildWeaponSetPayload(weaponSet2),
    };
    const skillsPayload = {
      heal: pick(profSkills, healId),
      utilities: [
        pick(profSkills, utility1Id),
        pick(profSkills, utility2Id),
        pick(profSkills, utility3Id),
      ],
      elite: pick(profSkills, eliteId),
    };

    try {
      setSaving(true);
      if (isEditing) {
        await updateBuild(buildId, {
          buildName: buildName.trim(),
          gameMode,
          isPublic,
          data: {
            profession,
            lines,
            gear,
            weapons: weaponsPayload,
            skills: skillsPayload,
            description: description.trim(),
          },
        });
        setSaveSuccess("Build updated!");
      } else {
        await createBuild({
          characterId,
          buildName: buildName.trim(),
          gameMode,
          isPublic,
          data: {
            profession,
            lines,
            gear,
            weapons: weaponsPayload,
            skills: skillsPayload,
            description: description.trim(),
          },
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
        <div className={`${styles.gearSection} mt-4`}>
          <h4>Gear</h4>
          <div className={styles.gearRow}>
            <GearSelector
              label="Amulet"
              options={amulets}
              value={amuletId}
              onChange={setAmuletId}
              onClear={() => setAmuletId(null)}
              shape="square"
            />
            <GearSelector
              label="Rune"
              options={runes}
              value={runeId}
              onChange={setRuneId}
              onClear={() => setRuneId(null)}
              shape="square"
            />
            <GearSelector
              label="Relic"
              options={relics}
              value={relicId}
              onChange={setRelicId}
              onClear={() => setRelicId(null)}
              shape="square"
            />
          </div>
        </div>
      )}

      {profession && (
        <div className={`${styles.gearSection} mt-4`}>
          <h4>Weapons</h4>
          <div className={styles.weaponSetsRow}>
            <WeaponSetSelector
              label="Weapon Set 1"
              weapons={weapons}
              sigils={sigils}
              value={weaponSet1}
              onChange={setWeaponSet1}
            />
            <WeaponSetSelector
              label="Weapon Set 2"
              weapons={weapons}
              sigils={sigils}
              value={weaponSet2}
              onChange={setWeaponSet2}
            />
          </div>
        </div>
      )}

      {profession && (
        <div className={`${styles.gearSection} mt-4`}>
          <h4>Skills</h4>
          <div className={styles.gearRow}>
            <GearSelector
              label="Heal Skill"
              options={skillsFor("Heal")}
              value={healId}
              onChange={setHealId}
              onClear={() => setHealId(null)}
            />
            <GearSelector
              label="Utility 1"
              options={skillsFor("Utility", [utility2Id, utility3Id].filter(Boolean))}
              value={utility1Id}
              onChange={setUtility1Id}
              onClear={() => setUtility1Id(null)}
            />
            <GearSelector
              label="Utility 2"
              options={skillsFor("Utility", [utility1Id, utility3Id].filter(Boolean))}
              value={utility2Id}
              onChange={setUtility2Id}
              onClear={() => setUtility2Id(null)}
            />
            <GearSelector
              label="Utility 3"
              options={skillsFor("Utility", [utility1Id, utility2Id].filter(Boolean))}
              value={utility3Id}
              onChange={setUtility3Id}
              onClear={() => setUtility3Id(null)}
            />
            <GearSelector
              label="Elite Skill"
              options={skillsFor("Elite")}
              value={eliteId}
              onChange={setEliteId}
              onClear={() => setEliteId(null)}
            />
          </div>
        </div>
      )}

      {profession && (
        <form className={`${styles.saveForm} mt-4`} onSubmit={handleSave}>
          <h4>{isEditing ? "Save changes" : "Save this build"}</h4>

          <div className="mb-3">
            <label className="form-label">Playstyle / notes</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Explain the playstyle, rotation, or any variations players can make..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!user}
            />
          </div>

          {!isComplete && (
            <div className="alert alert-warning">
              Choose all 3 specializations, one trait per tier, and an amulet,
              rune, and relic to complete the build.
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
              your <Link to="/account">Account</Link> page first.
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
                disabled={!user || saving || !isComplete}
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
