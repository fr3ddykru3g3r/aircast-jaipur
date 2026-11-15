# AirCast final audit and handoff

Completed 15 November 2026, before the team's 11:30 PM IST target.

**Outcome:** existing application repaired, numerical results independently verified, and version 2 deployed publicly at https://aircast-climate-lab.kyros-g2028.chatgpt.site/. Original architecture, colors, layout and model families retained. No new dataset, live forecast service, backend, API key or paid infrastructure introduced.

## What was actually wrong

The baseline public Forecast page loaded during this audit. Its earlier failure can be reproduced by using double-precision forest inputs: five test dates disagree with scikit-learn's float32 tree traversal, causing the frontend's all-predictions parity check to reject the entire experiment. The baseline already contained the necessary `Math.fround` correction. The audit preserved it and added a regression test. It did not invent a missing-file or unsupported-backend explanation.

The generic loading error was misleading on a hosted site. It now reports the failing stage, distinguishes a direct file:// launch from a hosted load, bounds the request time, checks the experiment structure and provides Retry. Loading failures hide incomplete forecasts. A real browser test deliberately blocked experiment.json, observed the download failure, removed the block and recovered through Retry.

A genuine numerical bug was found and corrected: NumPy's `higher` quantile indexing chose the 149th validation residual rather than the intended 148th. The exact rank now gives a 10.474869 µg/m³ radius and 291/365=79.726% test coverage, replacing 10.754364 and 80.0%. Forecasts and model scores are preserved to numerical precision.

## Independently verified results

| Model | MAE (µg/m³) | RMSE (µg/m³) | R² | TP | FN | FP | TN |
|---|---:|---:|---:|---:|---:|---:|---:|
| Persistence | 7.3911 | 10.3354 | 0.5693 | 16 | 14 | 14 | 321 |
| Ridge, selected on validation | 7.0847 | 9.6610 | 0.6237 | 15 | 15 | 7 | 328 |
| Random forest | 7.2346 | 9.9270 | 0.6027 | 15 | 15 | 11 | 324 |

Warning threshold: unrounded next-day PM2.5 >60 µg/m³. Ridge precision=68.2%, recall=50.0%. These are exploratory warnings against CAMS references, not an official public-health service. The 4.1% MAE reduction is modest and has not been shown statistically significant.

`verify.py` reconstructs all features from raw JSON using separate standard-library aggregation, independently solves standardized ridge's normal equations with training-only scaling, traverses the exported forest with float32 inputs, and recalculates metrics, confusion counts and interval coverage. It does not call train.py preprocessing or sklearn metric functions. All checks pass. Raw hashes match. Samples: 26,304 hourly timestamps; 1,096 calendar days; 1,089 examples; 540 train, 184 validation, 365 test. No conventional future-target leakage found. Tests use later dates, trailing lags and training-only preprocessing.

## Verification completed

- Retrained the original implementation before repairs; model metrics reproduced within 1.8e-15.
- Independent raw-data audit passes after the interval correction.
- Four Python interval regression tests pass.
- Node harness passes: all 730 trained-model predictions, CPCB band endpoints, warning counts and rates, hypothetical scenarios, seven failure modes and retry recovery.
- Notebook Python-cell syntax and real recorded PNG chart checked; raw inputs and training outputs included. Source-ZIP bootstrap added for Colab. The separate Colab cloud upload flow was not executed.
- Local browser: startup, replay, 2025 full-year chart, changing thresholds, scenario inference, invalid-input handling, deliberate network failure and Retry recovery checked.
- Mobile viewport at 390 px: historical/model-source label remains visible; no horizontal overflow. Temporary viewport override was reset; diagnostic network blocking was removed.
- Public post-deployment browser: no sign-in gate, Forecast 15 November 2025 predicts 57.4 with corrected range 46.9–67.8; 13 June replay shows the 41.3 error/missed warning; model lab displays precision 68.2%, recall 50.0% and coverage 79.7%. No public-page console errors observed.
- A non-browser HTTP asset/hash probe returned 403, so exact public-response SHA parity is not claimed. Public browser rendering and expected corrected data were observed directly; the hosting service confirmed the saved archive deployment. No security control was bypassed.

## Release provenance

- Source commit: `10377a7521311ef297943c12cef7b2b2085870d2`
- Sites project: `appgprj_6af9c27fc2f48191ad2491d826661b4c`
- Saved version: `appgprj_6af9c27fc2f48191ad2491d826661b4c~appgver_94232c5aaf508191a38d4f903cb8e86f`
- Deployment: `appgdep_6af9e1f5a4fc819194e90f4a0e51027d`, succeeded at 16:46:59 UTC on 15 November 2026 (10:16:59 PM IST).
- Public access was already configured before the audit; audience was preserved.
- Baseline commit and original ZIP retained. No existing project files were deleted.

## Scientific limits retained

CAMS gridded atmospheric estimates are not CPCB station measurements or street-level exposure. The global source is coarse gridded; hourly API output does not equal independent hourly sensor observations. Exact model-run vintage is not embedded in the responses. Weather reanalysis can be revised retrospectively. This is a historical one-day replay, not live November 2026 forecasting or a strict point-in-time operational backtest. The validation period both selects the model and calibrates the empirical interval; no guaranteed conformal coverage is claimed. Scenario inputs are sensitivity tests, not causal interventions. Independent Jaipur ground-station validation and prospective trials remain future work.

## Submission readiness and manual actions

The application and technical materials are ready for team review. Full competition submission is **not complete**.

1. Fill real team names, emails and schools; confirm eligibility, registration, contributions and understanding. Repository timestamps are consistent with the work window but cannot certify every contribution.
2. Publish the audited source to a viewable GitHub repository or share the notebook in Colab with outputs visible. For Colab, supply the full audited source ZIP for the bootstrap. The dashboard or ZIP alone does not replace the required GitHub/Colab code link.
3. Complete and share `SUBMISSION.md` as the GitHub README, an accessible Google Doc, or an uploaded PDF/Word file.
4. Optional: record the under-two-minute demo from `DEMO.md`.
5. Test final links without signing in, submit the official form and retain confirmation. No form was submitted by this audit.

The team's internal target remains 11:30 PM IST on 15 November, with midnight cutoff. The organizer's written deadline is 11:59 PM ET on 15 November (10:29 AM IST on 16 November). Its website exposes contradictory live/closed template banners, so form availability was not certified from extracted text.

Official references: [submission requirements and confirmations](https://highschoolhackathon.org/briefs), [FAQ](https://highschoolhackathon.org/faq). Dataset references: [Open-Meteo air quality / CAMS](https://open-meteo.com/en/docs/air-quality-api), [historical weather](https://open-meteo.com/en/docs/historical-weather-api). Credits include these datasets, scikit-learn, NumPy, pandas, Matplotlib, Google Fonts and OpenAI Codex assistance.

The audited ZIP contains source, raw snapshots, corrected experiment, notebook, tests, methodology, credits, limitations, the short judges' explanation, demo script and final checklist. This report is included as a separate post-deployment handoff record; it is not part of the already deployed build archive.
