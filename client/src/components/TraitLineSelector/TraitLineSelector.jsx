import { useState, useEffect, useMemo, Fragment } from "react";
import {
  getProfessionDetails,
  getSpecializations,
  getTraits,
} from "../../BuildCard/services/gw2Api";
import styles from "./TraitLineSelector.module.css";

const EMPTY_LINE = () => ({ specId: null, traitIds: [null, null, null] });

// Converts the denormalized shape produced by onChange (used for saving)
// back into the internal {specId, traitIds} shape, to preload an edit.
function toInternalLines(initialLines) {
  if (!initialLines) return [EMPTY_LINE(), EMPTY_LINE(), EMPTY_LINE()];
  return [0, 1, 2].map((i) => {
    const line = initialLines[i];
    if (!line) return EMPTY_LINE();
    return {
      specId: line.specialization?.id ?? null,
      traitIds: [0, 1, 2].map((t) => line.traits?.[t]?.id ?? null),
    };
  });
}

// GW2 trait descriptions sometimes contain markup like <c=@reminder>...</c>
function cleanDescription(text) {
  if (!text) return "";
  return text.replace(/<c=@[^>]*>/g, "").replace(/<\/c>/g, "");
}

function groupTraitsByTier(spec, traitsById) {
  const majors = (spec.major_traits || [])
    .map((id) => traitsById[id])
    .filter(Boolean);
  return [1, 2, 3].map((tier) => majors.filter((t) => t.tier === tier));
}

// The 3 minor traits are auto-granted (no choice) — one per tier, in order.
function minorsByTier(spec, traitsById) {
  const minors = (spec.minor_traits || []).map((id) => traitsById[id]).filter(Boolean);
  return [1, 2, 3].map((tier) => minors.find((t) => t.tier === tier) || null);
}

// A GW2-style trait line picker: 3 specialization slots. Hovering an option
// in a slot's dropdown previews all of that specialization's traits before
// it's chosen; any slot may hold a core or an elite spec, but only one
// elite spec can be active at once (matches in-game rules).
function TraitLineSelector({ profession, initialLines, onChange }) {
  const [specs, setSpecs] = useState([]);
  const [traitsById, setTraitsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lines, setLines] = useState(() => toInternalLines(initialLines));
  const [openSlot, setOpenSlot] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const professionData = await getProfessionDetails(profession);
        const allSpecs = await getSpecializations(professionData.specializations);
        const traitIds = allSpecs.flatMap((s) => [
          ...(s.major_traits || []),
          ...(s.minor_traits || []),
        ]);
        const traits = await getTraits(traitIds);
        if (cancelled) return;

        const byId = {};
        traits.forEach((t) => {
          byId[t.id] = t;
        });
        setSpecs(allSpecs);
        setTraitsById(byId);
      } catch {
        if (!cancelled) setError("Couldn't load specializations for this profession.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [profession]);

  const specsById = useMemo(() => {
    const map = {};
    specs.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [specs]);

  useEffect(() => {
    const payload = lines.map((line) => {
      if (!line.specId) return null;
      const spec = specsById[line.specId];
      if (!spec) return null;
      return {
        specialization: {
          id: spec.id,
          name: spec.name,
          icon: spec.icon,
          elite: spec.elite,
          background: spec.background,
        },
        traits: line.traitIds.map((traitId) => {
          const trait = traitId ? traitsById[traitId] : null;
          return trait
            ? { id: trait.id, name: trait.name, icon: trait.icon, tier: trait.tier }
            : null;
        }),
        minorTraits: minorsByTier(spec, traitsById).map((trait) =>
          trait ? { id: trait.id, name: trait.name, icon: trait.icon, tier: trait.tier } : null,
        ),
      };
    });
    onChange(payload);
    // onChange intentionally excluded: parent passes a fresh function each
    // render, and including it here would loop (call -> setState -> new fn).
  }, [lines, specsById, traitsById]);

  function eliteUsedElsewhere(slotIndex) {
    return lines.some(
      (l, i) => i !== slotIndex && l.specId && specsById[l.specId]?.elite,
    );
  }

  function availableSpecsForSlot(slotIndex) {
    return specs.filter((s) => {
      const usedElsewhere = lines.some(
        (l, i) => i !== slotIndex && l.specId === s.id,
      );
      if (usedElsewhere) return false;
      if (s.elite && eliteUsedElsewhere(slotIndex)) return false;
      return true;
    });
  }

  function toggleSlot(idx) {
    setOpenSlot((prev) => (prev === idx ? null : idx));
  }

  function selectSpec(slotIndex, specId) {
    setLines((prev) =>
      prev.map((l, i) => (i === slotIndex ? { specId, traitIds: [null, null, null] } : l)),
    );
    setOpenSlot(null);
  }

  function clearSlot(slotIndex, e) {
    e.stopPropagation();
    setLines((prev) => prev.map((l, i) => (i === slotIndex ? EMPTY_LINE() : l)));
  }

  function pickTrait(slotIndex, tierIndex, trait) {
    setLines((prev) =>
      prev.map((l, i) => {
        if (i !== slotIndex) return l;
        const traitIds = [...l.traitIds];
        traitIds[tierIndex] = trait.id;
        return { ...l, traitIds };
      }),
    );
  }

  function showTooltip(trait, e) {
    setTooltip({ trait, x: e.clientX, y: e.clientY });
  }

  function moveTooltip(e) {
    setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
  }

  function hideTooltip() {
    setTooltip(null);
  }

  if (loading) return <p className="text-muted">Loading specializations…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.linesRow}>
        {lines.map((line, idx) => {
          const spec = line.specId ? specsById[line.specId] : null;
          return (
            <div
              className={`${styles.line} ${spec ? styles.lineWithBg : ""}`}
              style={spec?.background ? { backgroundImage: `url(${spec.background})` } : undefined}
              key={idx}
            >
              <div className={styles.lineOverlay}>
              <div className={styles.slotHeaderWrap}>
                <button
                  type="button"
                  className={styles.specHexButton}
                  onClick={() => toggleSlot(idx)}
                  aria-label={spec ? spec.name : "Choose specialization"}
                >
                  {spec ? (
                    <img src={spec.icon} alt="" />
                  ) : (
                    <span className={styles.hexPlus}>+</span>
                  )}
                </button>

                <div className={styles.specCaption}>
                  {spec ? (
                    <>
                      <span className={styles.specName}>{spec.name}</span>
                      {spec.elite && <span className={styles.eliteBadge}>Elite</span>}
                      <button
                        type="button"
                        className={styles.clearBtn}
                        aria-label="Clear specialization"
                        onClick={(e) => clearSlot(idx, e)}
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span className={styles.placeholder}>Choose specialization</span>
                  )}
                </div>

                {openSlot === idx && (
                  <div className={styles.dropdown}>
                    {availableSpecsForSlot(idx).map((option) => (
                      <div
                        key={option.id}
                        className={styles.specOption}
                        onClick={() => selectSpec(idx, option.id)}
                      >
                        <div className={styles.specOptionRow}>
                          <img src={option.icon} alt="" className={styles.specIcon} />
                          <span>{option.name}</span>
                          {option.elite && <span className={styles.eliteBadge}>Elite</span>}
                        </div>
                      </div>
                    ))}
                    {availableSpecsForSlot(idx).length === 0 && (
                      <p className={styles.emptyNote}>No more specializations available.</p>
                    )}
                  </div>
                )}
              </div>

              {spec && (
                <div className={styles.tierGrid}>
                  {groupTraitsByTier(spec, traitsById).map((tier, tierIdx) => {
                    const minor = minorsByTier(spec, traitsById)[tierIdx];
                    return (
                      <Fragment key={tierIdx}>
                        {minor && (
                          <div
                            className={styles.minorHex}
                            onMouseEnter={(e) => showTooltip(minor, e)}
                            onMouseMove={moveTooltip}
                            onMouseLeave={hideTooltip}
                          >
                            <img src={minor.icon} alt={minor.name} />
                          </div>
                        )}
                        <div className={styles.tierRow}>
                          {tier.map((trait) => (
                            <button
                              type="button"
                              key={trait.id}
                              className={`${styles.traitButton} ${
                                line.traitIds[tierIdx] === trait.id ? styles.traitSelected : ""
                              }`}
                              onMouseEnter={(e) => showTooltip(trait, e)}
                              onMouseMove={moveTooltip}
                              onMouseLeave={hideTooltip}
                              onClick={() => pickTrait(idx, tierIdx, trait)}
                            >
                              <img src={trait.icon} alt={trait.name} />
                            </button>
                          ))}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          );
        })}
      </div>

      {tooltip && (
        <div
          className={styles.floatingTooltip}
          style={{ left: tooltip.x + 18, top: tooltip.y + 18 }}
        >
          <div className={styles.infoHeader}>
            <img src={tooltip.trait.icon} alt="" />
            <h5>{tooltip.trait.name}</h5>
          </div>
          <p>{cleanDescription(tooltip.trait.description)}</p>
        </div>
      )}
    </div>
  );
}

export default TraitLineSelector;
