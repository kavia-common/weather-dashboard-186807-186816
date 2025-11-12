import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * SearchBar
 * Accessible search bar for entering a city name.
 * Props:
 * - onSearch: (query: string) => void
 * - disabled?: boolean
 * - initialQuery?: string
 */
export default function SearchBar({ onSearch, disabled = false, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="searchbar"
      aria-label="Search for a city weather"
    >
      <label className="visually-hidden" htmlFor="city-input">
        City name
      </label>
      <input
        id="city-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search city (e.g., London)"
        aria-label="City name"
        className="search-input"
        disabled={disabled}
      />
      <button
        type="submit"
        className="btn-primary"
        aria-label="Search weather"
        disabled={disabled}
      >
        Search
      </button>
    </form>
  );
}
