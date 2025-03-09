import React, { useState } from 'react';

// Define types for our filters
type FilterName = 'dateRange' | 'gameMode' | 'difficulty';
type FilterValue = string;

type Filters = {
  dateRange: FilterValue;
  gameMode: FilterValue;
  difficulty: FilterValue;
};

const AnalyticsFilters = () => {
  const [filters, setFilters] = useState<Filters>({
    dateRange: 'lastWeek',
    gameMode: 'all',
    difficulty: 'all',
  });

  const handleFilterChange = (filterName: FilterName, value: FilterValue) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterName]: value,
    }));
  };

  return (
    <div>
      <label>
        Date Range:
        <select value={filters.dateRange} onChange={e => handleFilterChange('dateRange', e.target.value)}>
          <option value="lastWeek">Last Week</option>
          <option value="lastMonth">Last Month</option>
          <option value="lastYear">Last Year</option>
        </select>
      </label>
      <label>
        Game Mode:
        <select value={filters.gameMode} onChange={e => handleFilterChange('gameMode', e.target.value)}>
          <option value="all">All</option>
          <option value="memorization">Memorization</option>
          <option value="solution">Solution</option>
        </select>
      </label>
      <label>
        Difficulty:
        <select value={filters.difficulty} onChange={e => handleFilterChange('difficulty', e.target.value)}>
          <option value="all">All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>
    </div>
  );
};

export default AnalyticsFilters;
