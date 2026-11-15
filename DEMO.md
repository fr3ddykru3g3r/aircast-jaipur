# Two-minute AirCast demo

0:00–0:15 · Forecast view

“AirCast asks a local question: can we help people in Jaipur plan tomorrow's outdoor activities? We forecast next-day fine-particle pollution. A school sports coordinator preparing an indoor backup is one example user.”

0:15–0:45 · Pick 15 November 2025, then 90 days

“This is historical replay, not a live feed. We only use the previous full day's pollution and weather. Here's our prediction, its uncertainty range and the archived outcome. The large number is an India PM2.5 sub-index, not an official overall AQI. The chart compares our forecast, archived values and the simple tomorrow-equals-today baseline.”

0:45–1:10 · Model lab, comparison table

“We trained ridge regression and a random forest on earlier dates, chose ridge using a separate validation period, then tested on all 365 days of 2025. Ridge's mean absolute error is 7.08 micrograms per cubic metre, compared with 7.39 for persistence: a modest 4.1 percent improvement.”

1:10–1:30 · Warning threshold slider

“Accuracy alone isn't enough. At our 60 threshold, ridge halves false alarms from 14 to 7, but misses 15 elevated days versus 14 for persistence. Move this threshold and the trade-off changes. Our uncertainty interval contains 79.7 percent of test outcomes.”

1:30–1:45 · Change a weather input in the scenario explorer

“The trained model also runs in the browser. This is a hypothetical input experiment, not a claim that changing this weather variable would cause pollution to change.”

1:45–2:00 · Replay 13 June 2025 from hardest days

“Here it fails: 25.45 predicted versus 66.79 archived. These archives are CAMS model estimates, not station measurements. Next we'd validate on Jaipur sensors and test forecasts prospectively with users.”

Before recording: read the project and practice explaining lags, persistence, MAE, the chronological split, and why a lower MAE can still miss more warnings. Keep the recording under two minutes. No video has been recorded by this package.
