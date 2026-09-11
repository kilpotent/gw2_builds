import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./BuildCard/pages/Login/Login";
import Register from "./BuildCard/pages/Register/Register";
import PublicBuilds from "./BuildCard/pages/PublicBuilds/PublicBuilds";
import Dashboard from "./BuildCard/pages/Dashboard/Dashboard";
import BuildEditor from "./BuildCard/pages/BuildEditor/BuildEditor";
import MyBuilds from "./BuildCard/pages/MyBuilds/MyBuilds";
import BuildDetail from "./BuildCard/pages/BuildDetail/BuildDetail";
import Navbar from "./BuildCard/Navbar/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<PublicBuilds />} />
        <Route path="/build/:id" element={<BuildDetail />} />
        <Route path="/builder" element={<BuildEditor />} />
        <Route path="/builder/:buildId" element={<BuildEditor />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-builds"
          element={
            <ProtectedRoute>
              <MyBuilds />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
