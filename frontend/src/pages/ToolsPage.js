import React from 'react';
import Navbar from './Navbar';
import MovieMarathonPlanner from '../components/MovieMarathonPlanner';
import '../styles/tools.scss';

const ToolsPage = () => {
  return (
    <div className="tools-page">
      <Navbar />
      <div className="tools-content">
        <h1>Tools</h1>
        <div className="tools-list">
          <div className="tool-item">
            <h2>Movie Marathon Planner</h2>
            <p>Search and add up to 30 movies to your marathon bucket, then calculate the total runtime to plan your viewing time.</p>
            <MovieMarathonPlanner />
          </div>
          {/* Add other tools here in the future */}
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;