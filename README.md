# US Notifiable Disease Surveillance Tracker — CDC NNDSS

Look up weekly reported case counts for any CDC-notifiable disease —
measles, salmonellosis, pertussis, and hundreds more — by state or
nationally, via the official [CDC NNDSS Weekly
Data](https://data.cdc.gov/NNDSS/NNDSS-Weekly-Data/x9gk-5huc) API.
Each record includes the current week's count alongside the previous
52-week maximum and a year-over-year cumulative comparison.

Built for public-health, epidemiology, and news-monitoring teams
tracking a specific disease's trend without pulling CDC's own MMWR
tables by hand.

## Input

```json
{
  "diseaseKeyword": "Measles",
  "area": "U.S. Residents",
  "maxResults": 20
}
```

| Field | Type | Description |
|---|---|---|
| `diseaseKeyword` | string | Case-insensitive match against CDC's official disease label, e.g. `"measles"`, `"salmonella"`, `"pertussis"`. A broad keyword can match several related labels (`"measles"` matches both "Measles, Indigenous" and "Measles, Imported"). Default `"Measles"`. |
| `area` | string | A US state name, HHS region name, or `"U.S. Residents"` for the national total. Must match CDC's reporting-area name exactly. Default `"U.S. Residents"`. |
| `maxResults` | number | Maximum number of weekly records to return, most recent week first. Default `20`, max `200`. |

## Output

One record per disease-label/week match:

```json
{
  "disease": "Measles, Indigenous",
  "reportingArea": "U.S. Residents",
  "mmwrYear": "2026",
  "mmwrWeek": "32",
  "currentWeekCount": 122,
  "currentWeekFlag": null,
  "previous52WeekMax": 255,
  "previous52WeekMaxFlag": null,
  "cumulativeYtdCurrentYear": 2309,
  "cumulativeYtdCurrentYearFlag": null,
  "cumulativeYtdPreviousYear": 1265,
  "cumulativeYtdPreviousYearFlag": null
}
```

A `null` count with a non-null flag means CDC suppressed or didn't
report a value for that cell that week (e.g. a state that doesn't
require reporting for that disease) — this is CDC's own data quality
signal, passed through rather than hidden or defaulted to zero.

## How it works

Direct calls to the official CDC NNDSS Weekly Data API on
`data.cdc.gov` (Socrata) — no proxy, no key, no scraping. CDC
notifiable disease surveillance data is a US federal public health
work product and in the public domain.

## Pricing note

Billed per **search** (one run), not per record returned.

## Related products

- [Medical Device Adverse Event Tracker](https://github.com/timmKal01/medical-device-adverse-event-tracker) — FDA MAUDE reports, a different federal health-data family
- [Consumer Complaint Tracker](https://github.com/timmKal01/consumer-complaint-tracker) — CFPB financial complaints, same Socrata-platform mechanism
