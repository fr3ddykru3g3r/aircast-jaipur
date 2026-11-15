# Technical questions and answers

### Why Jaipur?
A concrete local setting makes the forecast and outdoor-planning use case understandable. No local user study is claimed.

### Why these datasets?
They are accessible, attributable public gridded estimates with pollution and weather coverage. They are not CPCB observations.

### Why ridge and forest?
Ridge is a regularized, inspectable linear baseline; a forest tests nonlinear relationships. Validation selected ridge narrowly.

### Why persistence?
Pollution is temporally persistent. Beating tomorrow-equals-today is more meaningful than reporting a model score alone.

### How was leakage prevented?
Trailing windows, next-calendar-day labels, target-date chronological partitions, training-only scaling, validation-only selection and a held-out test year. Previous observed test days can legitimately inform later one-day predictions.

### Why chronological splits?
A forecast must generalize forward in time. Shuffling can mix future regimes into training.

### What do the metrics mean?
MAE averages absolute errors; RMSE penalizes large errors; R² compares squared errors with the test mean. Concentration errors are in µg/m³.

### How reliable is the interval?
It covers 79.7% of these 365 historical outcomes. The same validation period selects and calibrates; time dependence prevents guaranteed future coverage. We do not display it as a live confidence interval.

### What changes in live mode?
Full origin-day provider estimates include forecast hours. This differs from historical reanalysis. The frozen model predicts the next India-calendar day; its live accuracy has not been measured.

### Do you feed tomorrow pollution into the model?
No. It is displayed only as a separate CAMS comparison. Tests perturb tomorrow pollution and verify model features do not change.

### Can scenarios show causal effects?
No. They show model sensitivity to hypothetical inputs; unusual combinations can be outside the training distribution.

### Where does it fail?
On 13 June 2025 it misses a sharp rise, with 41.34 µg/m³ error. Dust and emissions are not direct inputs; the event cause is unverified.

### How would you validate against CPCB?
Select quality-controlled Jaipur stations, align location and India-local daily averages, require adequate coverage and score a frozen model prospectively. Evaluate station-specific bias and warning costs.

### What did you build during the hackathon?
Data download, model fitting, dashboard, tests and documents on 15 November 2026. The 2023–2025 dates describe data, not development time.

### Who contributed and how was AI used?
Nitaksh Jain and Kyros Goyal report equal contributions. Codex assisted substantially with code, analysis implementation, UI, testing and documentation. Both teammates must be able to explain the result.

### What would you improve?
Sensor validation, a prospective trial, issue-time data capture, more years/sites, and thresholds informed by actual users.