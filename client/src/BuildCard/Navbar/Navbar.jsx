import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Navbar.module.css";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">
          GW2 Builds
        </Link>

        <div className="d-flex gap-2">
          <Link className="btn btn-outline-light btn-sm" to="/">
            Public Builds
          </Link>
          <Link className="btn btn-outline-light btn-sm" to="/builder">
            Build Editor
          </Link>

          {user ? (
            <>
              <Link className="btn btn-outline-light btn-sm" to="/my-builds">
                My Builds
              </Link>
              <Link className="btn btn-outline-light btn-sm" to="/account">
                Account
              </Link>
              <button
                className="btn btn-outline-light btn-sm"
                onClick={handleLogout}
              >
                Logout ({user.username})
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-light btn-sm" to="/login">
                Login
              </Link>
              <Link className="btn btn-light btn-sm" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
