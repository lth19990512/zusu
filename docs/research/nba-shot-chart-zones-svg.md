# NBA Shot Chart Zone SVG Implementation Research

## Executive Summary

The standard NBA shot chart uses a 14-zone system (sometimes 16 with rim/dunk split) that divides the half-court into restricted area, paint, 5 mid-range zones, 2 corner threes, 2 wing threes, 2 top threes, and deep three. No single open-source library provides copy-paste SVG path definitions for all 14 zones; however, the mathematical approach to constructing them is well-documented across multiple projects (shotchart.d3.ts, nbashots/charts.py, the NBA Stats API coordinate system). The zones are best built programmatically using SVG arcs and line segments based on NBA court geometry, with angle-based division lines radiating from the basket center.

---

## 1. NBA Court Geometry (Official Dimensions)

All zone boundaries derive from official NBA court measurements. The coordinate system used by the NBA Stats API places the basket at origin (0,0), with 1 unit = 0.1 feet (so 10 units = 1 foot).

| Feature | Real (ft/in) | Real (m) | NBA API coords | Common SVG (500-wide) |
|---|---|---|---|---|
| Court width | 50 ft | 15.24 m | -250 to +250 | 0 to 500 |
| Half-court length | 47 ft | 14.33 m | -47.5 to +422.5 | 0 to 470 |
| Basket from baseline | 5.25 ft (63 in) | 1.575 m | 0 (origin) | ~423 (from top) |
| 3-pt arc radius | 23 ft 9 in (23.75 ft) | 7.24 m | 237.5 | ~222-238 px |
| 3-pt corner distance | 22 ft | 6.7 m | 220 | ~206 px |
| 3-pt sideline offset | 3 ft from sideline | 0.914 m | +/-220 | varies |
| Corner 3 straight length | ~14 ft along sideline | 4.26 m | 140 | ~131 px |
| Restricted area radius | 4 ft | 1.22 m | 40 | ~37 px |
| Paint width | 16 ft (8ft each side) | 4.88 m | -80 to +80 | 175-325 |
| Paint length (FT line) | 15 ft from backboard | 5.79 m | 0 to ~142.5 | ~282-423 |
| Free throw circle radius | 6 ft | 1.83 m | 60 | ~56 px |
| Rim diameter | 18 in | 0.457 m | 7.5 radius | ~7 px |