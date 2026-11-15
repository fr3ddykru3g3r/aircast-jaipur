# AirCast — Jaipur air, a day ahead

**Current app:** the Forecast homepage predicts the next India-calendar day using recent provider inputs. Historical 2025 replay is under Model lab / Historical replay.
**Track:** AI + Climate  
**Team:** Nitaksh Jain and Kyros Goyal

**The problem.** Jaipur residents make outdoor plans without knowing tomorrow's fine-particle pollution. A school sports coordinator preparing an indoor alternative is one concrete user. This prototype has not yet been user-tested.

**What we built.** An interactive dashboard forecasts next-day daily-average PM2.5 from the previous full day's pollution and weather. Users replay held-out dates, inspect uncertainty, compare models, adjust warning thresholds and run the frozen model on hypothetical weather inputs. We display an India PM2.5 sub-index, not an official overall AQI.

**What we added.** Beyond suggested project 4.3.2: Jaipur-specific data, historical replay, validation-calibrated intervals, a warning trade-off explorer, browser inference and explicit failure cases.

**How it works.** We downloaded 26,304 hourly timestamps for Jaipur, 2023–2025, from Open-Meteo's CAMS air-quality and historical-weather APIs. These are gridded model estimates and reanalysis, not measured CPCB station data. Daily values require 18 valid hours. Features include current and lagged PM2.5, trailing means, weather and season. We trained on 540 days through June 2024, selected ridge over random forest using 184 validation days in July–December 2024, and evaluated frozen models on all 365 days in 2025. There is no shuffled split or use of tomorrow's weather. Forecasts are issued after the origin day ends.

**Results.** Persistence MAE: **7.391 µg/m³**. Selected ridge MAE: **7.085**; random forest: **7.235**. Ridge's error is **4.1% lower** than persistence; no significance claim is made. At a prototype PM2.5 threshold of >60 µg/m³, ridge misses **15/30** elevated days with **7** false alarms; persistence misses **14/30** with **14** false alarms. Warning precision is 68.2% and recall is 50.0%. Better average error does not improve every decision. Empirical nominal-80% intervals (10.47 µg/m³ radius; the validation period also selected the model) cover 79.7% of test outcomes (291/365). On 13 June 2025, ridge predicts 25.45 versus an archived 66.79 µg/m³, a missed warning. Unobserved dust or emission changes are possible explanations, not established causes.

**Limits and next steps.** We predict another model's pollution estimates, not sensor-validated exposure. Reanalysis is retrospective; daily averages hide spikes. We would next validate on Jaipur CPCB sensors, run a prospective test with issue-time inputs and evaluate decisions with users.

**Sources and tools.** [Open-Meteo / CAMS air quality](https://open-meteo.com/en/docs/air-quality-api), [Open-Meteo weather](https://open-meteo.com/en/docs/historical-weather-api) (CC BY 4.0; contains modified Copernicus Atmosphere Monitoring Service information); [CPCB AQI bands](https://airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf); Python, pandas, NumPy, scikit-learn, Matplotlib; Google Fonts; HTML/CSS/JavaScript. OpenAI Codex assisted with code, analysis implementation, interface and writing. Full sources, parameters and reproducibility steps are in README.md.

## Team contributions

Nitaksh Jain and Kyros Goyal contributed equally (50% each), jointly across the data work, machine-learning experiment, dashboard, testing and submission documentation. This allocation was confirmed by the team. OpenAI Codex assistance is credited above.

## Historical Dataset Partition

The 2023–2025 dates describe historical observations, not project-development dates. The bundled Open-Meteo data was downloaded on 15 November 2026. The models were trained and evaluated on 15 November 2026 during the hackathon. Target-date partitions remain: training 8 January 2023–30 June 2024 (540 days), validation 1 July–31 December 2024 (184 days), and testing 1 January–31 December 2025 (365 days). No observations, model results or methodology were changed for this wording update.

## Next-day prediction mode (added during the hackathon)

The Forecast homepage now requests seven recent days plus today/tomorrow from the Open-Meteo air-quality and weather Forecast APIs. It constructs the same 12 features and runs the existing frozen ridge and random forest in the browser to predict the next India-calendar day's mean PM2.5. The date and issue time are computed dynamically. Historical replay is at `#replay`; Model lab retains the held-out results.

Crucial distinction: today's full-day inputs are provider estimates, including forecasts for remaining hours. This lets the application issue tomorrow's prediction before today ends, but is an unvalidated hybrid pipeline. Its inputs differ from the retrospective reanalysis experiment. No live accuracy or calibrated live uncertainty claim is made. Tomorrow's pollution is never a model input; CAMS's separate next-day forecast is displayed only as an external comparator. Historical scores remain unchanged.

Refresh fetches current inputs. If providers fail, a bundled input snapshot may be used only on the same India calendar day and within two hours of issue; the UI explicitly labels it as a saved snapshot. Otherwise it shows a data-unavailable message, never a silent 2025 fallback. A downloadable JSON record includes issue time, feature values, forecasts and source URLs for prospective evaluation.

At implementation on 15 November 2026, the captured inputs produced a ridge prediction of approximately 47.2 µg/m³ for 16 November 2026. This is a prediction, not a verified outcome. Snapshot values may change as provider inputs update. Live tests: `node tests/live.test.cjs` checks exact feature parity on 365 historical examples, India-midnight date rollover, future-target exclusion, missing data and units.

Source documentation: https://open-meteo.com/en/docs/air-quality-api and https://open-meteo.com/en/docs . The model still predicts gridded atmospheric estimates, not CPCB ground-station measurements. A prospective trial and independent station validation remain required.
