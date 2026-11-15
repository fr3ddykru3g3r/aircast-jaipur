# AirCast — Jaipur air, a day ahead
**Track:** AI + Climate  
**Team:** Nitaksh Jain and Kyros Goyal

**The problem.** Jaipur residents make outdoor plans without knowing tomorrow's fine-particle pollution. A school sports coordinator preparing an indoor alternative is one concrete user. This prototype has not yet been user-tested.

**What we built.** An interactive dashboard forecasts next-day daily-average PM2.5 from the previous full day's pollution and weather. Users replay held-out dates, inspect uncertainty, compare models, adjust warning thresholds and run the frozen model on hypothetical weather inputs. We display an India PM2.5 sub-index, not an official overall AQI.

**What we added.** Beyond suggested project 4.3.2: Jaipur-specific data, historical replay, validation-calibrated intervals, a warning trade-off explorer, browser inference and explicit failure cases.

**How it works.** We downloaded 26,304 hourly timestamps for Jaipur, 2023–2025, from Open-Meteo's CAMS air-quality and historical-weather APIs. These are gridded model estimates and reanalysis, not measured CPCB station data. Daily values require 18 valid hours. Features include current and lagged PM2.5, trailing means, weather and season. We trained on 540 days through June 2024, selected ridge over random forest using 184 validation days in July–December 2024, and evaluated frozen models on all 365 days in 2025. There is no shuffled split or use of tomorrow's weather. Forecasts are issued after the origin day ends.

**Results.** Persistence MAE: **7.391 µg/m³**. Selected ridge MAE: **7.085**; random forest: **7.235**. Ridge's error is **4.1% lower** than persistence; no significance claim is made. At a prototype PM2.5 threshold of >60 µg/m³, ridge misses **15/30** elevated days with **7** false alarms; persistence misses **14/30** with **14** false alarms. Warning precision is 68.2% and recall is 50.0%. Better average error does not improve every decision. Empirical nominal-80% intervals (10.47 µg/m³ radius; the validation period also selected the model) cover 79.7% of test outcomes (291/365). On 13 June 2025, ridge predicts 25.45 versus an archived 66.79 µg/m³, a missed warning. Unobserved dust or emission changes are possible explanations, not established causes.

**Limits and next steps.** We predict another model's pollution estimates, not sensor-validated exposure. Reanalysis is retrospective; daily averages hide spikes. We would next validate on Jaipur CPCB sensors, run a prospective test with issue-time inputs and evaluate decisions with users.

**Sources and tools.** [Open-Meteo / CAMS air quality](https://open-meteo.com/en/docs/air-quality-api), [Open-Meteo weather](https://open-meteo.com/en/docs/historical-weather-api) (CC BY 4.0; contains modified Copernicus Atmosphere Monitoring Service information); [CPCB AQI bands](https://airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf); Python, pandas, NumPy, scikit-learn, Matplotlib; Google Fonts; HTML/CSS/JavaScript. OpenAI Codex assisted with code, analysis implementation, interface and writing. Full sources, parameters and reproducibility steps are in README.md.
