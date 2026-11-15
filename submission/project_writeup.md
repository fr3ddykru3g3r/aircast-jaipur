# AirCast: next-day air-quality forecasting for Jaipur
**Track:** AI + Climate  
**Team:** Nitaksh Jain and Kyros Goyal, Neerja Modi School

AirCast predicts next-day mean PM2.5 for Jaipur and lets users examine the evidence behind its model. Its homepage runs frozen machine-learning models on recent provider estimates; its Model lab reports a separate, chronological historical evaluation. It is a research prototype, not an official pollution-warning service.

## Problem and solution
Outdoor activities require advance planning. We chose Jaipur as a specific local setting, with a school sports coordinator preparing an indoor alternative as one possible user. We have not tested that use case with users or measured health benefits. The app shows the predicted concentration, a PM2.5-only India sub-index, source/issue time, model comparisons and downloadable forecast inputs. Historical replay makes failures visible.

## Data and method
We downloaded 26,304 hourly API timestamps covering January 2023–December 2025 on 15 November 2026. CAMS pollution values are gridded model estimates, not CPCB ground-station measurements. Historical weather uses reanalysis. Daily means require 18 valid hours per variable; rainfall is summed. Missing calendar days are retained, without filling from future values. Twelve inputs include origin-day PM2.5, two lags, trailing 3-/7-day means, weather and season.

Historical target-date partitions are training 8 January 2023–30 June 2024 (540 examples), validation July–December 2024 (184), and untouched testing January–December 2025 (365). These dates describe observations, not project development. Models were trained during the hackathon on 15 November 2026. Ridge (training-only scaling, alpha 10) and a random forest (100 trees, depth 8, minimum leaf 5, seed 42) are compared with persistence: tomorrow equals today. Validation MAE selects ridge; the test year does not train or select models.

## Results and failure
| Model | MAE (µg/m³) | RMSE (µg/m³) | R² |
|---|---:|---:|---:|
| Persistence | 7.391 | 10.335 | 0.569 |
| Ridge | 7.085 | 9.661 | 0.624 |
| Random forest | 7.235 | 9.927 | 0.603 |

Ridge lowers MAE by 4.1%; statistical significance was not established. At PM2.5 >60 µg/m³, ridge catches 15 elevated days, misses 15 and produces 7 false alarms: 68.2% precision, 50.0% recall. Persistence misses 14 with 14 false alarms. The empirical nominal-80% interval uses residual rank 148 of 184, radius 10.47 µg/m³, and covers 291/365 test outcomes (79.7%). Validation also selects the model, so coverage is not guaranteed. On 13 June 2025, ridge predicts 25.45 versus an archived 66.79 µg/m³, a missed warning.

## What we added and limitations
Beyond the suggested air-quality baseline, we added a Jaipur setting, transparent replay, warning trade-offs, browser inference and a current next-day pipeline. Live mode uses today's complete provider estimates, including forecast hours remaining today, to predict tomorrow. Tomorrow's pollution is never an AirCast input. This hybrid pipeline is not prospectively validated, and historical scores do not establish live accuracy. CAMS's next-day forecast is only an external comparison. Snapshot fallback is clearly labelled, same-day and at most two hours old.

CAMS is coarse gridded, reanalysis is retrospective, daily means hide spikes, and dust/emissions are not direct inputs. Next: compare with quality-controlled Jaipur CPCB sensors and run prospective, issue-time evaluation. Scenario changes are not causal effects. Code, raw snapshots, outputs, tests and limitations are public.

## Credits
Data: [Open-Meteo/CAMS air quality](https://open-meteo.com/en/docs/air-quality-api), [Open-Meteo historical weather](https://open-meteo.com/en/docs/historical-weather-api), and [Open-Meteo Forecast API](https://open-meteo.com/en/docs). Open-Meteo: CC BY 4.0; contains modified Copernicus Atmosphere Monitoring Service information. [CPCB AQI methodology](https://airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf) supplies PM2.5 sub-index bands, not our pollution observations.

Software: [Python](https://python.org), [NumPy](https://numpy.org), [pandas](https://pandas.pydata.org), [scikit-learn](https://scikit-learn.org), [Matplotlib](https://matplotlib.org); HTML/CSS/JavaScript; [Google Fonts](https://fonts.google.com) DM Sans and Manrope. Submission artifacts: python-pptx, ReportLab, Pillow and FFmpeg. No pretrained prediction model was reused. [OpenAI Codex](https://openai.com/codex/) assisted with implementation, testing, analysis code, interface, documentation and submission preparation. Students must understand and explain the work.
