import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/userpage.scss";

const UserPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [watchlist, setWatchlist] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [activeTab, setActiveTab] = useState("watchlist");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchWatchlist();
    fetchWatchedMovies();
  }, [user, navigate]);

  const fetchWatchlist = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/user/watchlist?uid=${user.uid}`);
      setWatchlist(response.data);
    } catch (error) {
      console.error("Error fetching watchlist", error);
    }
  };

  const fetchWatchedMovies = async () => {
    try {
      const response = await axios.get(`/api/user/watched?uid=${user.uid}`);
      setWatchedMovies(response.data);
    } catch (error) {
      console.error("Error fetching watched movies", error);
    }
  };

  const removeFromWatchlist = async (movieId) => {
    await axios.delete(`/api/user/watchlist/remove?uid=${user.uid}&movieId=${movieId}`);
    fetchWatchlist();
  };

  const clearWatchlist = async () => {
    await axios.delete(`/api/user/watchlist/clear?uid=${user.uid}`);
    setWatchlist([]);
  };

  const markAsWatched = async (movie) => {
    await axios.post(`/api/user/watched/add`, { uid: user.uid, movie });
    removeFromWatchlist(movie.id);
    fetchWatchedMovies();
  };

  const removeFromWatched = async (movieId) => {
    await axios.delete(`/api/user/watched/remove?uid=${user.uid}&movieId=${movieId}`);
    fetchWatchedMovies();
  };

  const clearWatchedMovies = async () => {
    await axios.delete(`/api/user/watched/clear?uid=${user.uid}`);
    setWatchedMovies([]);
  };

  return (
    <div className="user-page">
      <div className="sidebar">
        <div className="profile-section">
          <img src={user?.photoURL || "/default-avatar.png"} alt="Profile" className="profile-pic" />
          <h2>{user?.displayName || user?.email}</h2>
          <button onClick={logout} className="logout-btn">Logout</button>
        </div>
        <div className="menu">
          <button onClick={() => setActiveTab("watchlist")} className={activeTab === "watchlist" ? "active" : ""}>Watchlist</button>
          <button onClick={() => setActiveTab("watched")} className={activeTab === "watched" ? "active" : ""}>Watched Movies</button>
          <button onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "active" : ""}>Account Settings</button>
        </div>
      </div>

      <div className="content">
        {activeTab === "watchlist" && (
          <div>
            <h2>Your Watchlist</h2>
            <button onClick={clearWatchlist} className="clear-btn">Clear Watchlist</button>
            <div className="movie-list">
            {watchlist.length ? watchlist.map((movie) => (
             <div key={movie.id} className="movie-card">
               <img src={movie.poster} alt={movie.title} />
               <div className="movie-buttons">
                 <button onClick={() => markAsWatched(movie)}>Mark as Watched</button>
                 <button onClick={() => removeFromWatchlist(movie.id)}>Remove</button>
               </div>
               <p>{movie.title}</p>
               <button 
                 className="details-btn" 
                 onClick={() => navigate(`/movie/${movie.id}`)}>
                 Details
               </button>
             </div>
            )) : <p>Your watchlist is empty</p>}
            </div>
          </div>
        )}

        {activeTab === "watched" && (
          <div>
            <h2>Watched Movies</h2>
            <button onClick={clearWatchedMovies} className="clear-btn">Clear Watched Movies</button>
            <div className="movie-list">
            {watchedMovies.length ? watchedMovies.map((movie) => (
              <div key={movie.id} className="movie-card">
                <img src={movie.poster} alt={movie.title} />
                <div className="movie-buttons">
                  <button onClick={() => removeFromWatched(movie.id)}>Remove</button>
                </div>
                <p>{movie.title}</p>
                <button 
                  className="details-btn" 
                  onClick={() => navigate(`/movie/${movie.id}`)}>
                  Details
                </button>
              </div>
            )) : <p>No movies watched yet</p>}
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="account-settings">
            <h2>Account Settings</h2>
            
            <div className="settings-group">
              <h3>Profile Information</h3>
              <div className="form-field">
                <label>Display Name</label>
                <input type="text" defaultValue={user?.displayName || ""} placeholder="Your display name" />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" defaultValue={user?.email || ""} placeholder="Your email" disabled />
              </div>
            </div>
            
            <div className="settings-group">
              <h3>Security</h3>
              <button className="btn-change-password">Change Password</button>
              <button className="btn-delete-account">Delete Account</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserPage;