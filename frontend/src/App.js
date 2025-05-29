
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Homepage from "./pages/Homepage";
import UserPage from "./pages/Userpage";
import MoviePage from "./pages/MoviePage";
import RecommendPage from "./pages/RecommendPage";
import ToolsPage from "./pages/ToolsPage";
import FranchiseSearch from './pages/Franchise'; // This is FranchiseSearch.js
// import PopularFranchise from './pages/PopularFranchise';
import FranchisePage from './components/FranchisePage';
import FranchiseDetail from './pages/FranchiseDetail'; // Add this import
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Homepage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user"
          element={
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movie/:id"
          element={
            <ProtectedRoute>
              <MoviePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tools"
          element={
            <ProtectedRoute>
              <ToolsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/franchises"
          element={
            <ProtectedRoute>
              <FranchiseSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/franchises/:collectionId"
          element={
            <ProtectedRoute>
              <FranchisePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/popularfranchises/:collectionId"
          element={
            <ProtectedRoute>
              <FranchiseDetail /> {/* Use FranchiseDetail instead of FranchisePage */}
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
