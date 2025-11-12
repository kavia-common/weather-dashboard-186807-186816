import React from "react";

/**
 * PUBLIC_INTERFACE
 * ForecastPlaceholder
 * Placeholder component for future forecast feature.
 */
export default function ForecastPlaceholder() {
  return (
    <section className="forecast-placeholder" aria-describedby="forecast-hint">
      <h3 className="section-title">Forecast</h3>
      <p id="forecast-hint" className="muted">
        Forecast coming soon. This section will display the multi-day forecast
        once the backend endpoint is available.
      </p>
    </section>
  );
}
