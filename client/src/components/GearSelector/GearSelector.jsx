import { useState } from "react";
import styles from "./GearSelector.module.css";

// A single-item picker for gear (amulet/rune/sigil/relic): click to open a
// searchable dropdown of icon+name options, hover an option to preview its
// effect before choosing it.
function GearSelector({ label, options, value, onChange, onClear, shape = "circle" }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredId, setHoveredId] = useState(null);

  const iconClass = `${styles.icon} ${shape === "square" ? styles.iconSquare : ""}`;
  const selected = options.find((o) => o.id === value);
  const filtered = search
    ? options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  function toggle() {
    setOpen((o) => !o);
    setSearch("");
  }

  function select(id) {
    onChange(id);
    setOpen(false);
    setSearch("");
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <div className={styles.slotHeader}>
        <button type="button" className={styles.selectButton} onClick={toggle}>
          {selected ? (
            <>
              <img src={selected.icon} alt="" className={iconClass} />
              <span>{selected.name}</span>
            </>
          ) : (
            <span className={styles.placeholder}>-- choose --</span>
          )}
        </button>
        {selected && onClear && (
          <button
            type="button"
            className={styles.clearBtn}
            aria-label={`Clear ${label}`}
            onClick={onClear}
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className={styles.dropdown}>
          <input
            type="text"
            className={styles.search}
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <div className={styles.optionList}>
            {filtered.map((opt) => (
              <div
                key={opt.id}
                className={styles.option}
                onMouseEnter={() => setHoveredId(opt.id)}
                onMouseLeave={() => setHoveredId((h) => (h === opt.id ? null : h))}
                onClick={() => select(opt.id)}
              >
                <div className={styles.optionRow}>
                  <img src={opt.icon} alt="" className={iconClass} />
                  <span>{opt.name}</span>
                </div>
                {hoveredId === opt.id && opt.description && (
                  <p className={styles.optionDescription}>{opt.description}</p>
                )}
              </div>
            ))}
            {filtered.length === 0 && <p className={styles.emptyNote}>No matches.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default GearSelector;
