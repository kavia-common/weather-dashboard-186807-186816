import React from "react";

/**
 * PUBLIC_INTERFACE
 * WeatherCard
 * Displays current weather information in a styled card.
 * Props:
 * - name: string
 * - tempC: number
 * - description: string
 * - iconUrl?: string
 */
export default function WeatherCard({ name, tempC, description, iconUrl }) {
  return (
    <section className="weather-card" aria-live="polite">
      <div className="weather-card-header">
        <h2 className="city-name" title={name}>
          {name}
        </h2>
      </div>
      <div className="weather-card-body">
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={description ? `Weather icon: ${description}` : "Weather icon"}
            className="weather-icon"
            width={96}
            height={96}
          />
        ) : null}
        <div className="weather-details">
          <div className="temp">
            {Math.round(Number.isFinite(tempC) ? tempC : 0)}
            <span className="unit">°C</span>
          </div>
          <div className="desc" role="note">
            {description || "—"}
          </div>
        </div>
      </div>
    </section>
  );
}
