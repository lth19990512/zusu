# SportsData.io NBA API v3 -- Endpoint and Response Research

**Date:** 2026-03-22  
**Project:** Zusu NBA Platform

## Executive Summary

SportsData.io provides a comprehensive NBA API (v3) with full team/player profiles, live game scoring, detailed box scores with 50+ stat fields per player, and play-by-play data with shot coordinates. The API uses the `Ocp-Apim-Subscription-Key` header for auth, a `YYYY-MMM-DD` date format (e.g., `2024-JAN-15`), and per-endpoint call intervals rather than a global rate limit. API-Sports is a cheaper alternative but lacks the statistical depth (no advanced metrics, no play-by-play coordinates).

---

## 1. Authentication

| Method | Detail |
|--------|--------|
| **HTTP Header** (preferred) | `Ocp-Apim-Subscription-Key: {your-key}` |
| **Query Parameter** (fallback) | `?key={your-key}` |

Base URLs:
- Scores/schedules: `https://api.sportsdata.io/v3/nba/scores/json/`
- Stats/box scores: `https://api.sportsdata.io/v3/nba/stats/json/`
- Play-by-play: `https://api.sportsdata.io/v3/nba/pbp/json/`

---

## 2. Date Format

The API uses `YYYY-MMM-DD` with a **three-letter month abbreviation in uppercase**:

```
2024-JAN-15
2025-MAR-22
2015-JUL-31
2016-OCT-31
```

This is NOT ISO `YYYY-MM-DD`. A common mistake is passing `2024-01-15` instead of `2024-JAN-15`.

---

## 3. Rate Limits / Call Intervals

SportsData.io uses **per-endpoint call intervals** rather than a global requests-per-second limit:

| Endpoint Category | Recommended Call Interval |
|-------------------|---------------------------|
| Team Profiles | 4 hours (14,400s) |
| Player Profiles (by team) | 5 minutes (300s) |
| Active Players | 15 minutes (900s) |
| Free Agents | 1 hour (3,600s) |
| Standings | 5 minutes (300s) |
| Stadiums / Referees | 4 hours |
| Game/Score data (live) | 15-20 seconds behind broadcast |

**Plan limits (Discovery Lab / Personal Use):**

| Plan | Cost | Daily API Calls | Data Window |
|------|------|-----------------|-------------|
| Free | /usr/bin/bash | ~33/day (1,000/month) | Last season only |
| Fantasy | 9/mo | 100/day | Current + last 3 years |
| Odds | 9/mo | 100/day | Current + last 3 years |
| Fantasy + Odds | 49/mo | 1,000/day | Current + last 3 years |

Annual season passes reduce cost by ~47%.

---

## 4. Common ID Fields

| Field | Type | Notes |
|-------|------|-------|
| `TeamID` | integer | Unique within NBA |
| `GlobalTeamID` | integer | Unique across ALL SportsData.io leagues |
| `PlayerID` | integer | NBA players start with prefix 200xxxxx |
| `GameID` | integer | Unique within NBA |
| `GlobalGameID` | integer | Unique across all leagues |
| `StadiumID` | integer | Venue identifier |
| `StatID` | integer | Unique stat record identifier |
| `QuarterID` | integer | Links plays to quarters |
| `PlayID` | integer | Individual play identifier |

`SeasonType` values: 1=Regular, 2=Preseason, 3=Postseason, 4=Offseason, 5=AllStar, 6=Exhibition

---

## 5. Endpoint: Teams

**URL:** `GET /v3/nba/scores/json/teams`  
**Call interval:** 4 hours  
**Returns:** `Team[]`

### Team Object Fields

| Field | Type | Example |
|-------|------|--------|
| `TeamID` | integer | 1 |
| `Key` | string(10) | "BOS" |
| `Active` | boolean | true |
| `City` | string(50) | "Boston" |
| `Name` | string(50) | "Celtics" |
| `LeagueID` | integer | |
| `StadiumID` | integer | |
| `Conference` | string(20) | "Eastern" |
| `Division` | string(20) | "Atlantic" |
| `PrimaryColor` | string(6) | "007A33" (hex, no #) |
| `SecondaryColor` | string(6) | "BA9653" |
| `TertiaryColor` | string | |
| `QuaternaryColor` | string | |
| `WikipediaLogoUrl` | string | Full URL to logo PNG |
| `WikipediaWordMarkUrl` | string | Full URL to wordmark |
| `GlobalTeamID` | integer | |
| `NbaDotComTeamID` | integer | |
| `HeadCoach` | string(50) | "Joe Mazzulla" |

---

## 6. Endpoint: Players by Team

**URL:** `GET /v3/nba/scores/json/PlayersBasic/{team}`  
**Parameter:** `{team}` = team abbreviation (e.g., BOS, LAL, PHI)  
**Call interval:** 5 minutes  
**Returns:** `PlayerBasic[]`

### PlayerBasic Object Fields

| Field | Type | Example |
|-------|------|--------|
| `PlayerID` | integer | 20000441 |
| `SportsDataID` | string | GUID |
| `Status` | string | "Active" |
| `TeamID` | integer | |
| `Team` | string | "BOS" |
| `Jersey` | integer | 0 |
| `PositionCategory` | string | "G" |
| `Position` | string | "PG" |
| `FirstName` | string | "Jayson" |
| `LastName` | string | "Tatum" |
| `BirthDate` | datetime | "1998-03-03T00:00:00" |
| `BirthCity` | string | "St. Louis" |
| `BirthState` | string | "MO" |
| `BirthCountry` | string | "USA" |
| `GlobalTeamID` | integer | |
| `Height` | integer | 80 (inches) |
| `Weight` | integer | 210 (pounds) |

The **full Player** object (from `/Players/{team}` without "Basic") adds these additional fields:

| Field | Type | Notes |
|-------|------|-------|
| `HighSchool` | string | |
| `College` | string | |
| `Experience` | integer | Years in league |
| `SportRadarPlayerID` | string | |
| `InjuryStatus` | string | "Questionable", "Out", etc. |
| `InjuryBodyPart` | string | "Knee" |
| `InjuryStartDate` | date | |
| `InjuryNotes` | string | |
| `DraftKingsPlayerID` | integer | |
| `FanDuelPlayerID` | integer | |
| `YahooPlayerID` | integer | |
| `NbaDotComPlayerID` | integer | |

---

## 7. Endpoint: Games by Date

**URL:** `GET /v3/nba/scores/json/GamesByDate/{date}`  
**Parameter:** `{date}` = `YYYY-MMM-DD` (e.g., `2024-JAN-15`)  
**Returns:** `Game[]`

### Game Object Fields

| Field | Type | Notes |
|-------|------|-------|
| `GameID` | integer | Primary key |
| `Season` | integer | e.g., 2025 |
| `SeasonType` | integer | 1=Reg, 2=Pre, 3=Post |
| `Status` | string | "Scheduled", "InProgress", "Final" |
| `Day` | date | "2024-01-15T00:00:00" |
| `DateTime` | datetime | Game start in ET |
| `DateTimeUTC` | datetime | Game start in UTC |
| `AwayTeam` | string | "BOS" |
| `HomeTeam` | string | "LAL" |
| `AwayTeamID` | integer |  |
| `HomeTeamID` | integer |  |
| `StadiumID` | integer |  |
| `Channel` | string | "ESPN", "TNT" |
| `Attendance` | integer |  |
| `AwayTeamScore` | integer | null if not started |
| `HomeTeamScore` | integer | null if not started |
| `Updated` | datetime | Last update timestamp |
| `Quarter` | string | "1", "Half", "4", null |
| `TimeRemainingMinutes` | integer |  |
| `TimeRemainingSeconds` | integer |  |
| `PointSpread` | decimal |  |
| `OverUnder` | decimal |  |
| `AwayTeamMoneyLine` | integer |  |
| `HomeTeamMoneyLine` | integer |  |
| `GlobalGameID` | integer |  |
| `GlobalAwayTeamID` | integer |  |
| `GlobalHomeTeamID` | integer |  |
| `LastPlay` | string | Description of last play |
| `IsClosed` | boolean | True when game is finalized |
| `GameEndDateTime` | datetime |  |
| `HomeRotationNumber` | integer |  |
| `AwayRotationNumber` | integer |  |
| `NeutralVenue` | boolean |  |
| `CrewChiefID` | integer |  |
| `UmpireID` | integer |  |
| `RefereeID` | integer |  |
| `AlternateID` | integer |  |
| `SeriesInfo` | Series object | Playoff series data (null in regular season) |
| `InseasonTournament` | boolean | NBA Cup flag |
| `Quarters` | Quarter[] | Nested quarter scores |

### Quarter Object (nested in Game)

| Field | Type |
|-------|------|
| `QuarterID` | integer |
| `GameID` | integer |
| `Number` | integer |
| `Name` | string |
| `AwayScore` | integer |
| `HomeScore` | integer |

---

## 8. Endpoint: Box Scores by Date

**URL:** `GET /v3/nba/stats/json/BoxScores/{date}`  
**Parameter:** `{date}` = `YYYY-MMM-DD`  
**Returns:** `BoxScore[]`

### BoxScore Object Structure

```json
{
  "Game": { /* Game object (same fields as section 7) */ },
  "Quarters": [ /* Quarter[] */ ],
  "TeamGames": [ /* TeamGame[2] -- home + away */ ],
  "PlayerGames": [ /* PlayerGame[] -- all players */ ]
}
```

### TeamGame Object Fields (team-level stats per game)

| Field | Type | Notes |
|-------|------|-------|
| `StatID` | integer | Primary key |
| `TeamID` | integer |  |
| `SeasonType` | integer |  |
| `Season` | integer |  |
| `Name` | string | Team name |
| `Team` | string | Abbreviation |
| `Wins` | integer | Season wins at time of game |
| `Losses` | integer |  |
| `Possessions` | decimal |  |
| `GlobalTeamID` | integer |  |
| `GameID` | integer |  |
| `OpponentID` | integer |  |
| `Opponent` | string |  |
| `Day` | date |  |
| `DateTime` | datetime |  |
| `HomeOrAway` | string | "HOME" or "AWAY" |
| `IsGameOver` | boolean |  |
| `GlobalGameID` | integer |  |
| `GlobalOpponentID` | integer |  |
| `Updated` | datetime |  |
| `Games` | integer |  |
| `FantasyPoints` | decimal |  |
| `Minutes` | integer |  |
| `Seconds` | integer |  |
| `FieldGoalsMade` | decimal |  |
| `FieldGoalsAttempted` | decimal |  |
| `FieldGoalsPercentage` | decimal |  |
| `EffectiveFieldGoalsPercentage` | decimal |  |
| `TwoPointersMade` | decimal |  |
| `TwoPointersAttempted` | decimal |  |
| `TwoPointersPercentage` | decimal |  |
| `ThreePointersMade` | decimal |  |
| `ThreePointersAttempted` | decimal |  |
| `ThreePointersPercentage` | decimal |  |
| `FreeThrowsMade` | decimal |  |
| `FreeThrowsAttempted` | decimal |  |
| `FreeThrowsPercentage` | decimal |  |
| `OffensiveRebounds` | decimal |  |
| `DefensiveRebounds` | decimal |  |
| `Rebounds` | decimal |  |
| `OffensiveReboundsPercentage` | decimal |  |
| `DefensiveReboundsPercentage` | decimal |  |
| `TotalReboundsPercentage` | decimal |  |
| `Assists` | decimal |  |
| `Steals` | decimal |  |
| `BlockedShots` | decimal |  |
| `Turnovers` | decimal |  |
| `PersonalFouls` | decimal |  |
| `Points` | decimal |  |
| `TrueShootingAttempts` | decimal |  |
| `TrueShootingPercentage` | decimal |  |
| `PlayerEfficiencyRating` | decimal |  |
| `AssistsPercentage` | decimal |  |
| `StealsPercentage` | decimal |  |
| `BlocksPercentage` | decimal |  |
| `TurnOversPercentage` | decimal |  |
| `UsageRatePercentage` | decimal |  |
| `FantasyPointsFanDuel` | decimal |  |
| `FantasyPointsDraftKings` | decimal |  |
| `FantasyPointsYahoo` | decimal |  |
| `PlusMinus` | decimal |  |
| `DoubleDoubles` | decimal |  |
| `TripleDoubles` | decimal |  |
| `IsClosed` | boolean |  |
| `LineupConfirmed` | boolean |  |
| `LineupStatus` | string |  |

### PlayerGame Object Fields (player-level stats per game)

Same stat fields as TeamGame above, **plus** these player-specific fields:

| Field | Type | Notes |
|-------|------|-------|
| `PlayerID` | integer |  |
| `Name` | string | Full player name |
| `Position` | string | "PG", "SF", etc. |
| `PositionCategory` | string | "G", "F", "C" |
| `Started` | integer | 1 if started, 0 if bench |
| `Jersey` | integer |  |
| `FanDuelSalary` | integer | DFS salary |
| `DraftKingsSalary` | integer |  |
| `FantasyDataSalary` | integer |  |
| `YahooSalary` | integer |  |
| `InjuryStatus` | string |  |
| `InjuryBodyPart` | string |  |
| `InjuryStartDate` | date |  |
| `InjuryNotes` | string |  |
| `FanDuelPosition` | string |  |
| `DraftKingsPosition` | string |  |
| `YahooPosition` | string |  |
| `OpponentRank` | integer |  |
| `OpponentPositionRank` | integer |  |

---

## 9. Endpoint: Scores by Date (ScoresByDate)

**IMPORTANT FINDING:** There is NO separate `ScoresByDate` endpoint in the v3 NBA API. Based on the OpenAPI specification for nba-v3-scores, the v3 scores API provides:

- `GamesByDate/{date}` -- returns `Game[]` with scores included
- `BoxScores/{date}` (in the stats API) -- returns full box scores

The `GamesByDate` endpoint already includes `HomeTeamScore` and `AwayTeamScore` fields, quarter-by-quarter breakdowns, and live game state. If a separate "ScoresByDate" path is referenced in older documentation, it is likely:
1. An alias for `GamesByDate` in the v3 API, or
2. A deprecated v2 endpoint

**Recommendation:** Use `GamesByDate/{date}` for score data and `BoxScores/{date}` when you need full stat breakdowns.

---

## 10. Endpoint: Play by Play

**URL:** `GET /v3/nba/pbp/json/PlayByPlay/{gameid}`  
**Parameter:** `{gameid}` = integer game ID (e.g., 14620)  
**Returns:** Single `PlayByPlay` object

**Delta endpoint:** `GET /v3/nba/pbp/json/PlayByPlayDelta/{date}/{minutes}`  
(Returns only plays that changed in the last N minutes -- useful for live updates)

### PlayByPlay Response Structure

```json
{
  "Game": { /* Full Game object */ },
  "Quarters": [ /* Quarter[] */ ],
  "Plays": [ /* Play[] in chronological order */ ]
}
```

### Play Object Fields

| Field | Type | Notes |
|-------|------|-------|
| `PlayID` | integer | Unique play identifier |
| `QuarterID` | integer | Links to Quarter |
| `QuarterName` | string | "1", "2", "OT" |
| `Sequence` | integer | Order within game |
| `TimeRemainingMinutes` | integer |  |
| `TimeRemainingSeconds` | integer |  |
| `AwayTeamScore` | integer | Running score |
| `HomeTeamScore` | integer | Running score |
| `PotentialPoints` | integer | Points if shot made |
| `Points` | integer | Points scored on this play |
| `ShotMade` | boolean |  |
| `Category` | string | "FieldGoal", "FreeThrow", "Turnover", "Rebound" |
| `Type` | string | "JumpShot", "Layup", "Dunk", "Block" |
| `TeamID` | integer |  |
| `Team` | string | Abbreviation |
| `OpponentID` | integer |  |
| `Opponent` | string |  |
| `ReceivingTeamID` | integer | For rebounds/turnovers |
| `ReceivingTeam` | string |  |
| `Description` | string | Human-readable play text |
| `PlayerID` | integer | Primary player |
| `AssistedByPlayerID` | integer | Passer on made basket |
| `BlockedByPlayerID` | integer |  |
| `StolenByPlayerID` | integer |  |
| `SubstituteInPlayerID` | integer |  |
| `SubstituteOutPlayerID` | integer |  |
| `AwayPlayerID` | integer |  |
| `HomePlayerID` | integer |  |
| `ReceivingPlayerID` | integer |  |
| `FastBreak` | boolean |  |
| `SideOfBasket` | string |  |
| `BaselineOffsetPercentage` | decimal | Shot chart X coordinate |
| `SidelineOffsetPercentage` | decimal | Shot chart Y coordinate |
| `Coordinates` | string | Raw coordinate string |
| `Updated` | datetime |  |
| `Created` | datetime |  |

---

## 11. Comparison: SportsData.io vs API-Sports

| Feature | SportsData.io (v3) | API-Sports (v2) |
|---------|---------------------|------------------|
| **Free tier** | 1,000 calls/month, last season only | 100 calls/day (3,000/month) |
| **Cheapest paid** | $99/month (100 calls/day) | $15/month (7,500 calls/day) |
| **Mid tier** | $149/month (1,000 calls/day) | $25/month (75,000 calls/day) |
| **Auth method** | `Ocp-Apim-Subscription-Key` header | `x-apisports-key` header |
| **Date format** | `YYYY-MMM-DD` (e.g., `2024-JAN-15`) | `YYYY-MM-DD` (ISO standard) |
| **Advanced stats** | Yes (PER, TS%, USG%, rebound %, etc.) | Basic box score stats only |
| **Play-by-play** | Yes, with shot coordinates | Not available |
| **Fantasy/DFS data** | Yes (salaries, projections, fantasy pts) | Not available |
| **Shot coordinates** | Yes (BaselineOffset, SidelineOffset) | Not available |
| **Injury data** | Yes (status, body part, notes) | Limited |
| **Historical depth** | 3+ years on paid plans | 11 years |
| **Real-time latency** | 15-20 seconds behind broadcast | Not specified |
| **Response format** | JSON + XML | JSON only |
| **ID system** | Integer IDs with Global variants | Integer IDs |
| **Team colors/logos** | Yes (hex colors, Wikipedia URLs) | Logo URLs only |

---

## 12. Recommendation

**For the Zusu NBA platform, SportsData.io is the stronger choice** due to:
- Advanced player metrics (PER, TS%, USG%) that power analytics features
- Play-by-play with shot coordinates for shot charts
- Fantasy/DFS salary data if that is a future feature
- Injury tracking fields baked into player objects

**Caveats:**
1. The free tier is extremely limited (1,000 calls/month, last season only) -- you will need a paid plan for any production use
2. At $99-149/month, it is 5-10x more expensive than API-Sports
3. The `YYYY-MMM-DD` date format is non-standard and will require a helper function
4. Call interval recommendations mean you should cache aggressively (teams every 4 hours, player profiles every 5 minutes)
5. API-Sports is the better value if you only need basic scores/standings and do not need advanced stats or play-by-play

**If budget is a hard constraint**, API-Sports at $15/month gives you 7,500 daily calls with basic scores, standings, and team/player info. You would lose advanced metrics and play-by-play.

---

## Sources

- [SportsData.io NBA API Documentation](https://sportsdata.io/developers/api-documentation/nba)
- [SportsData.io NBA Data Dictionary (download)](https://sportsdata.io/developers/data-dictionary/download/nba)
- [SportsData.io NBA Data Dictionary](https://sportsdata.io/developers/data-dictionary/nba)
- [SportsData.io NBA Workflow Guide](https://sportsdata.io/developers/workflow-guide/nba)
- [SportsData.io Discovery Lab NBA Pricing](https://discoverylab.sportsdata.io/personal-use-apis/nba)
- [SportsData.io NBA Free Trial](https://sportsdata.io/cart/free-trial/nba)
- [SportsData.io Entity Identification Guide](https://support.sportsdata.io/hc/en-us/articles/32140182561815-Entity-Identification-Guide)
- [SportsData.io FAQ](https://sportsdata.io/help/faq)
- [OpenAPI Spec: nba-v3-scores](https://api.apis.guru/v2/specs/sportsdata.io/nba-v3-scores/1.0/openapi.json)
- [OpenAPI Spec: nba-v3-stats](https://api.apis.guru/v2/specs/sportsdata.io/nba-v3-stats/1.0/openapi.json)
- [OpenAPI Spec: nba-v3-play-by-play](https://api.apis.guru/v2/specs/sportsdata.io/nba-v3-play-by-play/1.0/openapi.json)
- [API-Sports NBA Documentation](https://api-sports.io/documentation/nba/v2)
- [API-Sports NBA Info and Pricing](https://api-sports.io/sports/nba)
