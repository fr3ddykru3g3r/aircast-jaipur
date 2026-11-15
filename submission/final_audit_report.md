# Final technical audit

Inspected source, raw JSON, derived CSV, experiment/model exports, tests, documentation, Git state and deployment manifest. Application source is frozen at GitHub commit faad587 before this documentation pass; an archive backup was created. No model was retrained for final packaging.

Verified: raw-data verification passes; 4 Python unit tests pass; frontend checks cover 730 predictions; live feature tests match 365 historical cases and check India midnight, units, missing data and target exclusion. Historical MAE/RMSE/R² match the table in README. The public homepage was observed using fresh API inputs to predict 16 November 2026 at approximately 47.2 µg/m³. Historical replay, charts, model comparisons, scenarios, invalid-input handling and downloads were tested. Public GitHub contains actual source/data/notebook. Current loading failure was not reproduced.

Fixed earlier: exact interval residual rank, hosted error diagnostics, float32 tree parity and historical wording. Final pass adds documentation and media without changing model results. Live mode's full-day estimated inputs are clearly distinguished from historical evaluation. No known reproducible application failure remains from these checks. Colab cloud execution, sensor accuracy and prospective live performance remain unverified.

Credentials: no API key is required by the app. Public source should be scanned before final push; personal emails are retained only in the form and local confirmation. Code/model data are public sources. Team confirmed equal contributions and rules; school is Neerja Modi School. Climate is selected on the form. Public code and README links satisfy the organizer's required link format. Video is optional and requires a suitable share URL if included.

Manual responsibility: both students must understand the work and respond to judges. A successful form confirmation must be saved before claiming submission. Do not claim the generated video has student narration or continuous interaction.

Final demo: revised to a 101-second edited capture of actual browser interactions, replacing the initial static walkthrough. Required project submission was accepted by Airtable and confirmation saved locally. A final revision includes the publicly viewable Drive demo.
