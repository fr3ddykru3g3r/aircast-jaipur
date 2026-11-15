# AirCast — Jaipur air, a day ahead

**Current app:** the Forecast homepage predicts the next India-calendar day using recent provider inputs. Historical 2025 replay is under Model lab / Historical replay.

[![Open in Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/fr3ddykru3g3r/aircast-jaipur/blob/main/AirCast.ipynb)

**Colab:** run the first cell to load the project files, then run the remaining cells.

**Track:** AI + Climate · Veritas AI International High School Hackathon 2026  
**Team:** Nitaksh Jain and Kyros Goyal

## The problem
Jaipur residents plan sports, commutes and other outdoor activities with limited advance information about fine-particle pollution. One concrete user is a school sports coordinator deciding whether to prepare an indoor alternative. AirCast explores whether yesterday's pollution and weather can improve on “tomorrow equals today.” The prototype has not been user-tested.

## What we built
A working machine-learning experiment and interactive dashboard forecasting next-day daily-average PM2.5 for Jaipur (26.9124 N, 75.7873 E). Users replay any held-out 2025 date, inspect input conditions, compare forecast with the archived outcome, explore uncertainty and warning trade-offs, and change weather inputs to run the trained model in the browser. The interface translates predicted PM2.5 into an **India PM2.5 sub-index**, not an official multi-pollutant AQI.

## What we added
We started from brief 4.3.2 and added a Jaipur setting, a local planning use case, chronological historical replay, empirical uncertainty intervals, adjustable warning thresholds, browser-based inference and a failure audit. The model's warning recall is shown alongside error: better average predictions do not necessarily mean fewer missed warnings.

## How it works
**Data:** 26,304 hourly timestamps, 1,096 calendar days, January 2023–December 2025, in Asia/Kolkata. PM2.5 comes from Open-Meteo's CAMS air-quality model; weather from Open-Meteo historical reanalysis. These are real archived **model estimates, not ground-station measurements**. Daily aggregates require 18 valid hours per variable. Rainfall is summed; other variables are averaged. Gaps remain in the calendar; no future interpolation. Seven days are lost to initial lags and the final missing next-day target, leaving 1,089 usable examples.

**Inputs:** origin-day PM2.5; 1- and 2-day lags; trailing 3- and 7-day PM2.5 means; temperature, relative humidity, rainfall, wind speed and pressure; target-day seasonal sine/cosine. A forecast is issued **after the origin day ends**; it is not a forecast available that morning. Tomorrow's weather and pollution are excluded.

**Models:** standardized ridge regression (alpha=10) and random forest (100 trees, depth 8, minimum leaf size 5, seed 42). The persistence baseline is origin-day PM2.5. All negative model predictions are clipped to zero.

**Split by target date:** train 8 January 2023–30 June 2024 (540 examples); validation 1 July–31 December 2024 (184); untouched test 1 January–31 December 2025 (365). Select by validation MAE: ridge 6.673, forest 6.730 µg/m³. Models remain frozen; no fitting or selection uses the test year.

## Results

| Model | Test MAE (µg/m³) | Test RMSE (µg/m³) | R² | Missed warnings | False alarms |
|---|---:|---:|---:|---:|---:|
| Persistence | 7.391 | 10.335 | 0.569 | 14 | 14 |
| **Ridge (validation-selected)** | **7.085** | **9.661** | **0.624** | **15** | **7** |
| Random forest | 7.235 | 9.927 | 0.603 | 15 | 11 |

Ridge reduces MAE by **4.1%** versus persistence. This is a modest result; we did not estimate its statistical significance. Warnings here mean PM2.5 **above 60 µg/m³**, a prototype planning threshold aligned with the upper Satisfactory PM2.5 band, not an official school closure rule. There are 30 elevated test days. Ridge has 68.2% precision (15/22 predicted warnings) and 50.0% recall (15/30 elevated reference days). These are exploratory warnings against CAMS estimates, not an official public-health service. Ridge catches 15/30, versus persistence's 16/30: fewer false alarms, but one extra missed warning. The dashboard lets users explore other thresholds.

**Uncertainty:** the finite-sample-adjusted 80th percentile of absolute validation residuals gives a radius of 10.47 µg/m³. The range includes the archived outcome on 79.7% of test days (291/365). The 148th smallest of 184 validation residuals is used exactly. This validation period also selected the model; the interval is empirical, not an independent conformal calibration. Time dependence and distribution shift prevent a guaranteed future coverage claim.

**Failure:** 13 June 2025 was predicted at 25.45 µg/m³, versus an archived 66.79: a 41.34 error and a missed warning. Sudden emissions or dust changes are plausible failure modes because neither is directly observed by our inputs; we have not established the cause of this event.

## Limitations and next steps
The experiment predicts CAMS estimates, so it partly learns another model's behavior. It does not establish accuracy against Jaipur sensors, street-level exposure, or real-world health outcomes. Weather reanalysis can be revised retrospectively, so this is not a strict real-time backtest. Daily averages hide hourly extremes. The dataset covers one location and three years. Hypothetical input changes are model sensitivity tests, not causal interventions.

Next: compare with quality-controlled Jaipur CPCB observations; evaluate a prospective period using only inputs available at issue time; test warning thresholds with actual users and their costs for missed warnings versus false alarms.

## Run the project

The dashboard is static and needs no API key or build step:

```sh
cd aircast
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000. Open the site through a web server, because browser security blocks JSON loading via file://. All predictions and trained models are bundled; forecasts and scenario inference work without data API calls. Optional Google Fonts require internet; system fonts are the fallback.

To reproduce the ML experiment:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train.py
```

For an exact audit environment, `requirements-lock.txt` records the tested Python 3.14 environment. Use `requirements.txt` for compatible versions on Colab; rerun verification after installation.

The raw source responses are bundled in `data/`. `train.py` writes `dist/experiment.json`, `dist/test_predictions.csv`, `data/daily_features.csv` and `AirCast.ipynb`. The notebook includes the recorded experiment summary and a real saved prediction chart. It can rerun training and the independent verification script. In Colab, open `AirCast.ipynb` and run its first cell. If the source files are absent, it asks you to upload `AirCast-Jaipur-audited.zip` and safely extracts it. Then run the installation, training, chart and verification cells. In a local notebook, open it from the `aircast` directory. Use `SUBMISSION.md` as the one-page write-up. See `JUDGES_GUIDE.md` for a short pipeline explanation and `SUBMISSION_CHECKLIST.md` for manual steps.

## Data provenance and credits

- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api): PM2.5 estimates, CAMS global product at Jaipur. CC BY 4.0; contains modified Copernicus Atmosphere Monitoring Service information. Not CPCB observations.
- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api): gridded reanalysis, daily aggregation from hourly values. CC BY 4.0.
- [CPCB: About the National AQI](https://airquality.cpcb.gov.in/ccr_docs/About_AQI.pdf): India PM2.5 concentration bands and sub-index interpolation. Concentrations are rounded to integer for the published integer bands; above 250 µg/m³ the interface shows “401+ / Severe” without inventing an upper concentration breakpoint. This is not the overall official AQI.
- [scikit-learn](https://scikit-learn.org/), [pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/), [Matplotlib](https://matplotlib.org/): training, evaluation, tabular analysis and notebook plotting.
- [Google Fonts](https://fonts.google.com/): DM Sans and Manrope; browser UI otherwise uses plain HTML, CSS and JavaScript with an original vector skyline illustration.
- [OpenAI Codex](https://openai.com/codex/): coding assistance, experiment implementation, interface and writing assistance. The student team must review, understand and disclose this assistance.
- Competition brief supplied by the user: *Veritas AI International High School Hackathon 2026 Project Briefs*, sections 3, 4.3.2, 5 and 6. No existing project or pretrained prediction model was reused.

Exact API queries are in `data/SOURCES.md`; raw-file SHA-256 hashes and library versions are recorded in `dist/experiment.json`.

## Submission checklist

- Add actual contributing team members, emails and schools on the form; no identities are invented here.
- Upload code to a publicly viewable GitHub repository or share a runnable Colab notebook with recorded outputs. The hosted dashboard alone does **not** meet the code requirement.
- Share `SUBMISSION.md` as a README or accessible document; review every claim.
- Optional: record the two-minute demo in `DEMO.md` and upload it with view access.
- Test all submission links in an incognito window.
- Submit through the official competition form. According to the supplied brief, the deadline is **16 November 2026, 10:29 AM IST**. No competition submission has been made by this build.

## Audit and checks

`AUDIT.md` records findings and repairs; `audit/verification.json` is the independent result. Run `python verify.py`, `python -m unittest discover -s tests -p 'test_*.py'`, and `node tests/frontend.test.cjs` (Node 18+ for frontend tests). Browser use itself needs no Node installation. The 2025 replay and warning counts have been browser-tested; Colab cloud execution still depends on its package availability and upload permissions.

## Team contributions

Nitaksh Jain and Kyros Goyal contributed equally (50% each), jointly across the data work, machine-learning experiment, dashboard, testing and submission documentation. This allocation was confirmed by the team. OpenAI Codex assistance is credited above.

## Current public verification

The current public URL loaded successfully during the latest browser check. Historical replay, date selection, the full-year chart, browser inference, invalid scenario inputs, CSV download and README download were checked. `python verify.py`, four Python unit tests and the frontend test suite passed without retraining. Original MAE/RMSE/R² match the experiment and dashboard. A user-reported intermittent “Forecast unavailable” could not be reproduced; its cause remains unconfirmed pending the exact error-stage message. Do not describe this as a proven loading-error repair. Colab cloud execution and external third-party link availability are not comprehensively verified.

## Historical Dataset Partition

The 2023–2025 dates describe historical observations, not project-development dates. The bundled Open-Meteo data was downloaded on 15 November 2026. The models were trained and evaluated on 15 November 2026 during the hackathon. Target-date partitions remain: training 8 January 2023–30 June 2024 (540 days), validation 1 July–31 December 2024 (184 days), and testing 1 January–31 December 2025 (365 days). No observations, model results or methodology were changed for this wording update.

## Next-day prediction mode (added during the hackathon)

The Forecast homepage now requests seven recent days plus today/tomorrow from the Open-Meteo air-quality and weather Forecast APIs. It constructs the same 12 features and runs the existing frozen ridge and random forest in the browser to predict the next India-calendar day's mean PM2.5. The date and issue time are computed dynamically. Historical replay is at `#replay`; Model lab retains the held-out results.

Crucial distinction: today's full-day inputs are provider estimates, including forecasts for remaining hours. This lets the application issue tomorrow's prediction before today ends, but is an unvalidated hybrid pipeline. Its inputs differ from the retrospective reanalysis experiment. No live accuracy or calibrated live uncertainty claim is made. Tomorrow's pollution is never a model input; CAMS's separate next-day forecast is displayed only as an external comparator. Historical scores remain unchanged.

Refresh fetches current inputs. If providers fail, a bundled input snapshot may be used only on the same India calendar day and within two hours of issue; the UI explicitly labels it as a saved snapshot. Otherwise it shows a data-unavailable message, never a silent 2025 fallback. A downloadable JSON record includes issue time, feature values, forecasts and source URLs for prospective evaluation.

At implementation on 15 November 2026, the captured inputs produced a ridge prediction of approximately 47.2 µg/m³ for 16 November 2026. This is a prediction, not a verified outcome. Snapshot values may change as provider inputs update. Live tests: `node tests/live.test.cjs` checks exact feature parity on 365 historical examples, India-midnight date rollover, future-target exclusion, missing data and units.

Source documentation: https://open-meteo.com/en/docs/air-quality-api and https://open-meteo.com/en/docs . The model still predicts gridded atmospheric estimates, not CPCB ground-station measurements. A prospective trial and independent station validation remain required.
