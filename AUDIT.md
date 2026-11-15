# AirCast technical audit — 15 November 2026

## Initial inspection before repairs

Baseline source commit: `c58fec8df1823a2f51fa87f02827f868e55b9f69`; working tree was clean. The original source ZIP is retained, and baseline experiment JSON, predictions and training code were copied to workspace `work/audit-baseline/` before retraining.

Architecture: static HTML/CSS/JavaScript (`dist/`), no server-side backend or runtime data API. `train.py` reads two bundled raw JSON responses, aggregates daily features, fits scikit-learn models, and exports both trained models and held-out predictions to `dist/experiment.json`. The frontend fetches this file and performs parity checks before rendering. CSV is a downloadable copy. `.openai/hosting.json` deploys `dist` through Sites. Python dependencies are needed only for reproduction; browser inference needs no paid service.

Inspected inventory: frontend HTML/CSS/JS; training code; raw air/weather JSON metadata, units, timestamps and hashes; derived CSV; experiment JSON; CSV predictions; notebook cells and outputs; README, submission draft, demo script, provenance, requirements, gitignore and hosting manifest.

Initial findings:

- Public Forecast currently loads with all three model outputs and no browser console errors. The old loading error does not reproduce on the deployed baseline.
- The earlier implementation's forest parity check is sensitive to float32 input conversion: scikit-learn tree prediction casts inputs to float32. The baseline already uses `Math.fround`. Reproduce the legacy double-precision path in `verify.py` rather than guessing at hosting paths.
- The catch-all error message incorrectly assumes every failure needs a local server. Separate network, JSON/schema, model-verification and rendering failures; retain a retry option and actionable hosted wording.
- Retraining the unmodified source reproduces MAE/RMSE/R² within 1.8e-15. All 365 test days remain held out.
- Confirmed interval off-by-one: `quantile(..., method='higher')` converts the finite-sample quantile to the 149th residual instead of the intended 148th. The correct radius is 10.474869 µg/m³; correct 2025 coverage is 291/365 (79.726%). Predictions, model selection, MAE, RMSE and R² do not change.
- Warning confusion counts are present; precision/recall and explicit TP/FP/FN/TN definitions are missing.
- The narrow-screen stylesheet hides the note that says replay is not live. Historical context needs to remain explicit on small screens.
- The notebook shows recorded core results but its chart has no saved output. A Colab upload of the notebook alone cannot import `train.py`; provide a source-ZIP bootstrap and refresh visible outputs.
- No conventional future-target leakage found in the feature design or split. Weather reanalysis is retrospective, and the target is CAMS model output; these limitations already exist and must remain prominent. Overlapping lag windows across chronological partitions are valid for one-day-ahead replay with observed previous days.

## Repairs and verified local results

- Corrected the interval using the exact 1-based order statistic. Added four regression tests, including the failing 148-of-184 case and invalid calibration inputs.
- Retained float32 forest inference and added a regression harness checking all 730 ridge/forest predictions. Replaying the legacy float64 path mismatches five forest predictions and reproduces its parity failure; it is not evidence of missing hosted assets. No current baseline production error was observed.
- Added a bounded data request, explicit download/parse/schema/model-verification/rendering error diagnostics, hosted wording and retry. A real browser test blocked experiment.json, observed the download error, removed the block, and recovered the lab and forecasts through Retry. The diagnostic network block was removed.
- Added TP/FN/FP/TN definitions, threshold-dependent precision and recall, undefined-denominator handling, and exploratory-service wording. At >60 µg/m³: TP=15, FN=15, FP=7, TN=328, precision=68.2%, recall=50.0%.
- Kept historical/source labels visible at a 390-pixel mobile viewport. No horizontal overflow was found; the temporary viewport override was reset. Existing colors, layout and charts were retained.
- Saved a real plot in the notebook and added a source-ZIP Colab bootstrap. Python code-cell syntax and PNG output verified. The cloud Colab upload flow has not been executed in a separate Colab account.

`verify.py` independently rebuilds all 1,089 feature/target rows from raw JSON using calendar arithmetic and standard-library aggregation, solves training-only standardized ridge via NumPy normal equations, traverses exported trees with float32 inputs, and calculates MAE/RMSE/R², warnings and exact residual rank without importing train.py preprocessing or sklearn metrics. Raw hashes match. All checks pass; no missing raw values were found. Train/validation/test sizes remain 540/184/365. Independent ridge coefficients match within 1e-9. Raw-source metadata identifies India timezone and two nearby returned grid coordinates, not a station. See data/SOURCES.md for provenance limitations.

| Test model | MAE | RMSE | R² | TP | FN | FP | TN |
|---|---:|---:|---:|---:|---:|---:|---:|
| Persistence | 7.3911 | 10.3354 | 0.5693 | 16 | 14 | 14 | 321 |
| Ridge | 7.0847 | 9.6610 | 0.6237 | 15 | 15 | 7 | 328 |
| Random forest | 7.2346 | 9.9270 | 0.6027 | 15 | 15 | 11 | 324 |

Units for MAE/RMSE: µg/m³. The models and test scores did not materially change; last-bit differences from repeated parallel tree averaging are below 1e-12. Only interval endpoints and coverage changed: radius 10.474869, rank 148, coverage 291/365=79.726%. Validation also selects the model, so these are empirical intervals with no guaranteed conformal coverage.

Tests passed: independent raw-data verification; four Python regression tests; Node harness for model parity, CPCB endpoints, thresholds, scenarios, seven error modes and retry; real-browser historical replay, full-year chart, threshold updates, scenario changes, invalid-input handling and network-error recovery. Startup uses the README's static-server command. No backend or API key is required.

## Scientific and compliance assessment

No conventional future-feature/target leakage found: target-date boundaries are ordered, rolling windows are trailing, scaling fits training only, and validation selects the frozen model before test evaluation. Ground-truth claims remain limited: CAMS references are model estimates; reanalysis is retrospective; source model-run vintage is not recorded; the work is not a point-in-time operational forecast evaluation. No causal scenario, health-benefit, street-level or significance claim is supported.

Official requirements were checked against https://highschoolhackathon.org/briefs and https://highschoolhackathon.org/faq on 15 November 2026. Climate alignment, central ML and sourced results are supported by code. AI assistance is permitted with credit and understanding. Public GitHub/Colab code and an accepted-format write-up are still required. Student eligibility, registration, team contributions and full work-window compliance cannot be certified from repository files. The first baseline commit is dated 15 November and consistent with the permitted window; that is not proof of all work. The official site contains contradictory live/closed template banners; submission-form operational status is not certified. See SUBMISSION_CHECKLIST.md.

## Deployment verification

The repaired release is packaged from the verified source. Final deployment IDs and post-publication browser/asset checks are recorded separately in the accompanying AirCast-Final-Audit.md handoff report, so they do not alter the already packaged deployment source. The public baseline was verified before changes.

## Latest follow-up: user-reported Forecast unavailable

Inspected the latest public source and this audit before changes. Public root URL loaded with no console errors; all 730 parity comparisons passed in the existing frontend suite. No model or prediction code was changed and no models were retrained. Independent verification and four Python tests pass. Public replay of 13 June 2025 shows a 41.3 µg/m³ error; 15 November base scenario predicts 57.4, changing wind to 25 km/h predicts 53.9; wind 100 is rejected. Full-year chart and browser downloads of CSV and README work. The specific reported loading failure remains unconfirmed; exact failing-stage text was requested from the user. Team names and equal contributions were updated from the team’s explicit confirmation.

## Next-day mode implementation

Added a distinct current Forecast homepage and moved the unchanged historical dashboard to #replay. Models were not retrained. Full origin-day estimates are fetched from the two documented provider endpoints; the remaining hours are forecasts, clearly disclosed. Tomorrow pollutant values only feed the provider comparison, never model features. Live intervals are not claimed. Snapshot fallback is explicitly labelled and expires after two hours or a change of India calendar day. Exportable forecast records support future prospective scoring. See tests/live.test.cjs and README for validation boundaries.
