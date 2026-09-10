import { useState, useEffect, useMemo } from "react";
import {
  getProfessionDetails,
  getSpecializations,
  getTraits,
} from "../../BuildCard/services/gw2Api";
import styles from "./TraitLineSelector.module.css";

const EMPTY_LINE = () => ({ specId: null, traitIds: [null, null, null] });

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

// A GW2-style trait line picker: 3 specialization slots. Hovering an option
// in a slot's dropdown previews all of that specialization's traits before
// it's chosen; any slot may hold a core or an elite spec, but only one
// elite spec can be active at once (matches in-game rules).
function TraitLineSelector({ profession, onChange }) {
  const [specs, setSpecs] = useState([]);
  const [traitsById, setTraitsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [lines, setLines] = useState([EMPTY_LINE(), EMPTY_LINE(), EMPTY_LINE()]);
  const [openSlot, setOpenSlot] = useState(null);
  const [hoveredSpecId, setHoveredSpecId] = useState(null);
  const [infoTrait, setInfoTrait] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const professionData = await getProfessionDetails(profession);
        const allSpecs = await getSpecializations(professionData.specializations);
        const traitIds = allSpecs.flatMap((s) => s.major_traits || []);
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
        },
        traits: line.traitIds.map((traitId) => {
          const trait = traitId ? traitsById[traitId] : null;
          return trait
            ? { id: trait.id, name: trait.name, icon: trait.icon, tier: trait.tier }
            : null;
        }),
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
    setHoveredSpecId(null);
    setOpenSlot((prev) => (prev === idx ? null : idx));
  }

  function selectSpec(slotIndex, specId) {
    setLines((prev) =>
      prev.map((l, i) => (i === slotIndex ? { specId, traitIds: [null, null, null] } : l)),
    );
    setOpenSlot(null);
    setHoveredSpecId(null);
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
    setInfoTrait(trait);
  }

  if (loading) return <p className="text-muted">Loading specializations…</p>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className={styles.wrapper}>
      <div className={styles.linesRow}>
        {lines.map((line, idx) => {
          const spec = line.specId ? specsById[line.specId] : null;
          return (
            <div className={styles.line} key={idx}>
              <div className={styles.slotHeader}>
                <button
                  type="button"
                  className={styles.slotButton}
                  onClick={() => toggleSlot(idx)}
                >
                  {spec ? (
                    <>
                      <img src={spec.icon} alt="" className={styles.specIcon} />
                      <span>{spec.name}</span>
                      {spec.elite && <span className={styles.eliteBadge}>Elite</span>}
                    </>
                  ) : (
                    <span className={styles.placeholder}>+ Choose specialization</span>
                  )}
                </button>
                {spec && (
                  <button
                    type="button"
                    className={styles.clearBtn}
                    aria-label="Clear specialization"
                    onClick={(e) => clearSlot(idx, e)}
                  >
                    ×
                  </button>
                )}
              </div>

              {openSlot === idx && (
                <div className={styles.dropdown}>
                  {availableSpecsForSlot(idx).map((option) => (
                    <div
                      key={option.id}
                      className={styles.specOption}
                      onMouseEnter={() => setHoveredSpecId(option.id)}
                      onMouseLeave={() =>
                        setHoveredSpecId((h) => (h === option.id ? null : h))
                      }
                      onClick={() => selectSpec(idx, option.id)}
                    >
                      <div className={styles.specOptionRow}>
                        <img src={option.icon} alt="" className={styles.specIcon} />
                        <span>{option.name}</span>
                        {option.elite && <span className={styles.eliteBadge}>Elite</span>}
                      </div>

                      {hoveredSpecId === option.id && (
                        <div className={styles.traitPreview}>
                          {groupTraitsByTier(option, traitsById).map((tier, tierIdx) => (
                            <div className={styles.previewTierRow} key={tierIdx}>
                              {tier.map((trait) => (
                                <div
                                  key={trait.id}
                                  className={styles.previewTrait}
                                  onMouseEnter={(e) => {
                                    e.stopPropagation();
                                    setInfoTrait(trait);
                                  }}
                                >
                                  <img src={trait.icon} alt="" />
                                  <span>{trait.name}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {availableSpecsForSlot(idx).length === 0 && (
                    <p className={styles.emptyNote}>No more specializations available.</p>
                  )}
                </div>
              )}

              {spec && (
                <div className={styles.tierGrid}>
                  {groupTraitsByTier(spec, traitsById).map((tier, tierIdx) => (
                    <div className={styles.tierRow} key={tierIdx}>
                      {tier.map((trait) => (
                        <button
                          type="button"
                          key={trait.id}
                          className={`${styles.traitButton} ${
                            line.traitIds[tierIdx] === trait.id ? styles.traitSelected : ""
                          }`}
                          onMouseEnter={() => setInfoTrait(trait)}
                          onClick={() => pickTrait(idx, tierIdx, trait)}
                        >
                          <img src={trait.icon} alt={trait.name} />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.infoPanel}>
        {infoTrait ? (
          <>
            <div className={styles.infoHeader}>
              <img src={infoTrait.icon} alt="" />
              <h5>{infoTrait.name}</h5>
            </div>
            <p>{cleanDescription(infoTrait.description)}</p>
          </>
        ) : (
          <p className={styles.infoPlaceholder}>
            Hover a specialization or trait to see its details here.
          </p>
        )}
      </div>
    </div>
  );
}

export default TraitLineSelector;
