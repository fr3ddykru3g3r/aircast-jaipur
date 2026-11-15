# Final submission checklist

Internal target requested by the team: **15 November 2026, 11:30 PM IST**. Team cutoff: **midnight at the end of 15 November**. Keep these stricter preparation limits even though the official published deadline is 15 November, 11:59 PM ET (16 November, 10:29 AM IST).

## Technical readiness

- [x] Existing design and static Sites architecture retained.
- [x] Source preserved in Git and an earlier ZIP; audit baseline backed up before retraining.
- [x] Raw snapshots match recorded SHA-256 hashes; no replacement dataset introduced.
- [x] Training reproduced and independently checked against raw-data reconstruction.
- [x] 540 training, 184 validation, 365 test examples; no shuffled split or future-target feature leakage found.
- [x] All displayed model metrics reproduced; original model scores retained.
- [x] Interval rank bug corrected; radius 10.47 µg/m³ and coverage 79.7%.
- [x] TP/FP/FN/TN, precision and recall visible; warning feature marked exploratory.
- [x] Historical context and model-estimate limitation remain visible on the forecast.
- [x] Loading failures diagnosed by stage, with retry; no backend or paid service required.
- [x] Notebook contains a recorded real result summary and chart, plus a source-ZIP bootstrap for Colab.
- [x] Dataset, libraries and Codex assistance credited.

## Required team actions — still open

- [ ] Add each contributing student's full name to the write-up; provide actual emails and schools on the form. No team identities have been invented.
- [ ] Confirm high-school eligibility, registration and that every listed member contributed. The audit cannot certify these personal facts.
- [ ] Confirm all project work occurred within the permitted hackathon window. The first saved commit is on 15 November and consistent with the window, but timestamps cannot prove every contribution or absence of prior work.
- [ ] Upload the audited `aircast/` source to a publicly viewable **GitHub repository**, or share **AirCast.ipynb in Colab** with outputs visible. If sharing Colab alone, provide the complete audited ZIP too so the bootstrap can load code and data. A dashboard or ZIP download alone does not satisfy the organizer's specified code-link format.
- [ ] Use `SUBMISSION.md` as a GitHub README or accessible Google Doc, or upload a PDF/Word version. Complete the team field. Raw Markdown on a website is not one of the specified standalone upload formats.
- [ ] Both members should read `JUDGES_GUIDE.md`, run the demo and explain the limitations in their own words.
- [ ] Optional: record an under-two-minute video using `DEMO.md`; make its link viewable without signing in. No video has been recorded.
- [ ] Open the final code, write-up and demo links in an incognito window. Verify current public dashboard access too.
- [ ] Submit using the official form and retain its confirmation. No competition submission has been performed.

## Official sources checked

- [Briefs, deliverables and team confirmations](https://highschoolhackathon.org/briefs)
- [FAQ: eligibility, permitted work window and AI-tool use](https://highschoolhackathon.org/faq)
- [Submission form linked by the organizer](https://airtable.com/appypCyHN77hElIcS/shrXA5VBFdugmoXl6)

The organizer's page exposes both live and closed template banners in extracted text. Deadline wording is consistent with the supplied official PDF, but the audit does not infer the form's operational status from those contradictory banners. The team must verify the form while submitting. Code and a write-up are required; the video is optional. AI assistance is permitted with credit and understanding. Climate alignment and central ML functionality are supported by the implementation; eligibility and contribution attestations remain the team's responsibility.
