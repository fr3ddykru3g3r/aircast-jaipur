# AirCast: explain the pipeline in two minutes

**One sentence:** AirCast learns from earlier Jaipur pollution and weather records to predict the next calendar day's mean PM2.5, then tests whether that beats repeating today's value.

1. **Data:** two downloaded Open-Meteo responses cover 2023–2025 in Jaipur time. Pollution references are CAMS atmospheric-model estimates. Weather is historical reanalysis. Neither is a Jaipur CPCB sensor dataset. The global CAMS source is coarse gridded, approximately 45 km; hourly API timestamps do not imply independent hourly sensor measurements.
2. **Preprocessing:** require 18 valid hourly values for each daily variable. Average concentrations and weather; sum rainfall. Keep missing calendar dates rather than shifting later days backwards. No future-value filling is used.
3. **Inputs:** today's PM2.5, the previous two days, trailing 3- and 7-day means, today's weather and known seasonal calendar features. Predict tomorrow's PM2.5. A forecast is made after the origin day finishes; it is not available that morning.
4. **Training:** 540 examples through June 2024. Ridge fits a regularized linear relationship; the random forest averages 100 decision trees. Ridge scaling is fitted only on training inputs. Persistence predicts tomorrow equals today.
5. **Selection:** choose between the two fixed models using July–December 2024 validation MAE. Ridge wins narrowly. Freeze both models before evaluating 2025. In one-day replay, already observed earlier test days can become inputs for later test days; this is not a recursive year-ahead forecast.
6. **Evaluation:** all 365 days of 2025. MAE is the average absolute concentration error; RMSE penalizes large misses more; R² compares squared errors with predicting the test mean. Ridge MAE is 7.085 µg/m³, versus persistence's 7.391: a modest 4.1% reduction, without a significance claim.
7. **Warnings:** the exploratory cutoff is unrounded PM2.5 >60 µg/m³. Ridge's TP=15, FN=15, FP=7, TN=328. Precision is 15/(15+7)=68.2%; recall is 15/(15+15)=50.0%. It misses half of elevated reference days, so it is not an official warning service. Sub-index categories round the concentration to integer; the exploratory cutoff uses the unrounded concentration.
8. **Intervals:** sort 184 absolute validation errors and select rank ceil(185×0.8)=148. Radius=10.474869 µg/m³; clip the lower bound to zero. The range contains 291/365 test outcomes, or 79.7%. The validation period also selected the model, and residuals are time dependent; do not call this a guaranteed conformal interval.
9. **Application:** a static website loads the frozen models and predictions. Ridge coefficients and forest trees run locally in JavaScript for hypothetical scenarios. Tree inputs use float32 conversion to match scikit-learn. Browser parity tests compare all 730 trained-model predictions before the dashboard appears.

**The failure to show:** 13 June 2025: 25.45 predicted, 66.79 archived. Sudden dust/emission changes are possible explanations because those inputs are absent; the cause has not been verified.

**What not to claim:** live November 2026 forecasting; CPCB measurement accuracy; street-level exposure; health benefits or safe outdoor conditions; a statistically significant improvement; causal effects from scenario sliders; guaranteed interval coverage.

**Next experiment:** validate on quality-controlled Jaipur ground stations and run a prospective trial with inputs captured at issue time. Ask users about the consequences of missed warnings and false alarms before setting an operational threshold.

**Reproduce:** `python train.py`, `python verify.py`, `python -m unittest discover -s tests -p 'test_*.py'`, and `node tests/frontend.test.cjs`. All results are derived from the bundled raw snapshots, with hashes recorded in the experiment.
