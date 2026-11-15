# Raw data provenance

Downloaded 15 November 2026. Coordinates are a Jaipur city reference point, not a user's personal location. Both requests use Asia/Kolkata calendar days and 1 January 2023–31 December 2025.

Air quality request:
https://air-quality-api.open-meteo.com/v1/air-quality?latitude=26.9124&longitude=75.7873&start_date=2023-01-01&end_date=2025-12-31&hourly=pm2_5&timezone=Asia%2FKolkata

Weather request:
https://archive-api.open-meteo.com/v1/archive?latitude=26.9124&longitude=75.7873&start_date=2023-01-01&end_date=2025-12-31&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,surface_pressure&timezone=Asia%2FKolkata

The responses preserve returned grid coordinates, units, timezone and time series. Exact grid points can differ between products. Air quality: CAMS global gridded estimates. Weather: API's default best-match historical reanalysis. Neither is a station-level Jaipur observation dataset. Source products may change over time; use bundled snapshots and SHA-256 hashes for reproduction.

Attribution: Open-Meteo, CC BY 4.0; contains modified Copernicus Atmosphere Monitoring Service information. See API documentation linked in README.md. Download only for noncommercial student research under the public API terms.

The official Air Quality API documentation identifies the global CAMS product as approximately 45 km and three-hourly at source. This response exposes hourly timestamps; these are model-provided hourly values, not 26,304 independent sensor measurements. Returned coordinate precision is not evidence of street-level resolution. Raw metadata does not identify a unique model-run vintage or guarantee real-time availability.
