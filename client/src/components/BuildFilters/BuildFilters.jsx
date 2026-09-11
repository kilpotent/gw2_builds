import { PROFESSIONS, GAME_MODES } from "../../data/constants";
import styles from "./BuildFilters.module.css";

function BuildFilters({ profession, onProfessionChange, gameMode, onGameModeChange }) {
  return (
    <div className={`row g-2 ${styles.filters}`}>
      <div className="col-auto">
        <select
          className="form-select form-select-sm"
          value={profession}
          onChange={(e) => onProfessionChange(e.target.value)}
        >
          <option value="">All classes</option>
          {PROFESSIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="col-auto">
        <select
          className="form-select form-select-sm"
          value={gameMode}
          onChange={(e) => onGameModeChange(e.target.value)}
        >
          <option value="">All modes</option>
          {GAME_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {(profession || gameMode) && (
        <div className="col-auto">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => {
              onProfessionChange("");
              onGameModeChange("");
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default BuildFilters;
