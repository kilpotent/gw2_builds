import GearSelector from "../GearSelector/GearSelector";
import styles from "./WeaponSetSelector.module.css";

export const EMPTY_WEAPON_SET = () => ({
  type: "oneHand",
  mainId: null,
  offId: null,
  twoHandId: null,
  sigil1Id: null,
  sigil2Id: null,
});

// Converts the denormalized shape produced by onChange (used for saving)
// back into the internal id-based shape, to preload an edit.
export function toWeaponSetState(weaponSet) {
  if (!weaponSet) return EMPTY_WEAPON_SET();
  return {
    type: weaponSet.type || "oneHand",
    mainId: weaponSet.main?.id ?? null,
    offId: weaponSet.off?.id ?? null,
    twoHandId: weaponSet.twoHand?.id ?? null,
    sigil1Id: weaponSet.sigil1?.id ?? null,
    sigil2Id: weaponSet.sigil2?.id ?? null,
  };
}

// A weapon set is either one two-handed weapon (2 sigil slots) or a
// main-hand + off-hand pair (1 sigil slot each), matching GW2's own rules.
function WeaponSetSelector({ label, weapons, sigils, value, onChange }) {
  const mainOptions = weapons.filter((w) => w.flags.includes("Mainhand"));
  const offOptions = weapons.filter((w) => w.flags.includes("Offhand"));
  const twoHandOptions = weapons.filter((w) => w.flags.includes("TwoHand"));

  function setType(type) {
    onChange({ ...EMPTY_WEAPON_SET(), type });
  }

  return (
    <div className={styles.set}>
      <div className={styles.setHeader}>
        <h6 className="mb-0">{label}</h6>
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={value.type === "oneHand" ? styles.typeActive : ""}
            onClick={() => setType("oneHand")}
          >
            1-Handed
          </button>
          <button
            type="button"
            className={value.type === "twoHand" ? styles.typeActive : ""}
            onClick={() => setType("twoHand")}
          >
            2-Handed
          </button>
        </div>
      </div>

      {/* Fixed 2x2 grid: weapon(s) on top, their sigils directly below them,
          so switching 1H/2H never swaps a sigil into a weapon's old spot. */}
      <div className={styles.slotsGrid}>
        {value.type === "oneHand" ? (
          <>
            <div className={styles.posTopLeft}>
              <GearSelector
                label="Main Hand"
                options={mainOptions}
                value={value.mainId}
                onChange={(id) => onChange({ ...value, mainId: id })}
                onClear={() => onChange({ ...value, mainId: null })}
              />
            </div>
            <div className={styles.posTopRight}>
              <GearSelector
                label="Off Hand"
                options={offOptions}
                value={value.offId}
                onChange={(id) => onChange({ ...value, offId: id })}
                onClear={() => onChange({ ...value, offId: null })}
              />
            </div>
            <div className={styles.posBottomLeft}>
              <GearSelector
                label="Main Hand Sigil"
                options={sigils}
                value={value.sigil1Id}
                onChange={(id) => onChange({ ...value, sigil1Id: id })}
                onClear={() => onChange({ ...value, sigil1Id: null })}
              />
            </div>
            <div className={styles.posBottomRight}>
              <GearSelector
                label="Off Hand Sigil"
                options={sigils}
                value={value.sigil2Id}
                onChange={(id) => onChange({ ...value, sigil2Id: id })}
                onClear={() => onChange({ ...value, sigil2Id: null })}
              />
            </div>
          </>
        ) : (
          <>
            <div className={styles.posTopLeft}>
              <GearSelector
                label="Weapon"
                options={twoHandOptions}
                value={value.twoHandId}
                onChange={(id) => onChange({ ...value, twoHandId: id })}
                onClear={() => onChange({ ...value, twoHandId: null })}
              />
            </div>
            <div className={styles.posBottomLeft}>
              <GearSelector
                label="Sigil 1"
                options={sigils}
                value={value.sigil1Id}
                onChange={(id) => onChange({ ...value, sigil1Id: id })}
                onClear={() => onChange({ ...value, sigil1Id: null })}
              />
            </div>
            <div className={styles.posBottomRight}>
              <GearSelector
                label="Sigil 2"
                options={sigils}
                value={value.sigil2Id}
                onChange={(id) => onChange({ ...value, sigil2Id: id })}
                onClear={() => onChange({ ...value, sigil2Id: null })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default WeaponSetSelector;
