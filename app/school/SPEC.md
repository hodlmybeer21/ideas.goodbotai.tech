# GoodBot Campus — Pokémon-Inspired Exploration Game

## Concept & Vision

A top-down, open-world exploration game for young children (ages 4-10). Kids wander a colorful school campus, discovering buildings, talking to friendly NPCs, and launching learning activities. The feel is Pokémon meets a cozy school — bright, welcoming, safe to explore. Every building has something to do. No fail states, no timers, just exploration and discovery.

---

## Design Language

**Aesthetic:** Pokémon GBC / Pokémon Yellow — chunky pixel tiles, bold outlines, expressive NPCs. Warm and saturated, not dark or scary.

**Color Palette:**
- Grass: `#50A018` (animated two-tone shimmer)
- Path: `#C8A86C` (brick path with mortar)
- Building walls: `#B87C38` (brick with mortar lines)
- Water: `#3898D8` (animated wave lines)
- Trees: rounded layered foliage (dark → mid → light)
- UI backgrounds: `#1A1A2E` (deep navy)
- UI text: `#FFFFFF`

**Typography:** Fredoka, pixel-rendered via canvas for HUD/dialogue

**Tile size:** 10×10 px base, world scrolls under a fixed 800×600 viewport

**World size:** 100×70 tiles (1000×700 px), viewport = 80×60 tiles (800×600 px)

---

## World Map — 7 Zones, 7 Buildings

```
100 wide × 70 tall tiles

ZONES:
  Whispering Woods (forest, northwest) — Trees, quiet paths, Whisper Owl
  North Campus (gym + athletic fields) — Gym, running track, Coach Ziggy
  West Campus (art + library) — Art Building, Library, Paint Bot, Ms. Page
  GoodBot Plaza (center) — Main School, fountain plaza, Teacher Rosa, Principal Bo
  East Campus (science) — Science Building, Dr. Spark
  Crystal Lake (east side) — Bridges, lake, Captain Gill (fish)
  South Campus (café + garden) — Cafeteria, Garden, Chef Ramon, Gardener Fern

BUILDINGS:
  Main School (center)     — 21×15 interior, 4 classrooms → State Finder, Story Machine, Mad Libs, Bossy R Racer
  Art Building (west)     — 19×16 interior, open studio   → Pixel Canvas, Color Lab
  Gym (north)             — 25×14 interior, basketball court → Math Lab, Sound Lab
  Library (northwest)     — 19×17 interior, tall bookshelves → Read Along, Syllable Scooper
  Science Building (east) — 20×16 interior, lab benches   → Animal Match, True/False
  Cafeteria (south)      — 24×15 interior, serving line  → Sentence Builder, Tell Time
  Garden (southeast)     — 19×15 interior, plant beds   → Tell Time

EXTERIOR ZONES (no building):
  Crystal Lake — water tiles, 3 bridges, dock
  Whispering Woods — dense tree cover, forest path
  Athletic Fields — grass with running track path
```

---

## NPCs — 10 Characters

| NPC | Zone | Color | Emoji | Dialogue Theme |
|-----|------|-------|-------|----------------|
| Teacher Rosa | Plaza | `#FF9F9F` | 👩‍🏫 | Welcome, subjects, library |
| Principal Bo | Plaza | `#6B8DD6` | 👨‍💼 | Campus discovery, gym, art |
| Coach Ziggy | North Campus | `#FF6B6B` | 🏃 | Sports, energy, gym activities |
| Paint Bot | West Campus | `#DDA0DD` | 🤖 | Colors, primary mixing, art |
| Ms. Page | West Campus | `#C8A87B` | 🦉 | Stories, books, reading |
| Dr. Spark | East Campus | `#4ECDC4` | 🧪 | Science, experiments, discovery |
| Chef Ramon | South Campus | `#FF9F43` | 👨‍🍳 | Food, nutrition, cafeteria |
| Gardener Fern | South Campus | `#6BCB77` | 🌿 | Plants, bees, garden |
| Captain Gill | Crystal Lake | `#3A9FD4` | 🐟 | Lake, bridges, fishing |
| Whisper Owl | Whispering Woods | `#8FBC8F` | 🦉 | Forest, quiet, paths |

Each NPC: 3 rotating dialogue lines, patrol route, color + hair customization.

---

## Activities (all 23 wired)

| Activity | Building | Component |
|----------|----------|-----------|
| Pixel Canvas | Art Building | `PixelCanvas.tsx` |
| Color Lab | Art Building | `ColorLab.tsx` |
| State Finder | Main School | `StateFinder.tsx` |
| Story Machine | Main School | `StoryMachine.tsx` |
| Mad Libs | Main School | `MadLibs.tsx` |
| Bossy R Racer | Main School | `BossyRRacer.tsx` |
| Math Lab | Gym | `MathLab.tsx` |
| Sound Lab | Gym | `SoundLab.tsx` |
| Read Along | Library | `ReadAlong.tsx` |
| Syllable Scooper | Library | `SyllableScooper.tsx` |
| Animal Match | Science Building | `AnimalMatch.tsx` |
| True/False | Science Building | `TrueFalse.tsx` |
| Sentence Builder | Cafeteria | `SentenceBuilder.tsx` |
| Tell Time | Cafeteria + Garden | `TellTime.tsx` |
| Character Traits | Plaza (unpinned) | `CharacterTraits.tsx` |
| Equal Parts | (unpinned) | `EqualParts.tsx` |
| Coin Challenge | (unpinned) | `CoinChallenge.tsx` |
| Plant Life Cycle | (unpinned) | `PlantLifeCycle.tsx` |
| Story Q&A | (unpinned) | `StoryQA.tsx` |
| Sentence Fixer | (unpinned) | `SentenceFixer.tsx` |
| Tens & Ones | (unpinned) | `TensOnesExplorer.tsx` |

---

## Technical Architecture

### Files
```
app/school/
  page.tsx         — Main game (~570 lines, handles all rendering + input)
  lib/
    worldData.ts   — Tiles, zones, buildings, world map builder (100×70)
    interiors.ts   — 7 building interiors with activity tile triggers
    npcs.ts        — 10 NPC definitions + state factory
    renderer.ts    — Draw functions for all 24 tile types
    camera.ts      — Smooth lerp camera
  SPEC.md          — This file
app/components/    — All 23 activity components (reused)
```

### Tile Types
```
T_GRASS=0, T_PATH=1, T_WALL=2, T_FLOOR=3, T_DOOR=4,
T_WATER=5, T_TREE=6, T_FLOWER=7, T_FENCE=8, T_BENCH=9,
T_BOOKSHELF=10, T_LABBENCH=11, T_COUNTER=12, T_STAIR=13,
T_WINDOW=14, T_MURAL=15, T_SIGN=16, T_LAKE=17, T_BRIDGE=18,
T_HEDGE=19, T_STATUE=20, T_FOUNTAIN=21, T_POND=22, T_ROCK=23
Activity tiles: 20–34 (all render as glowing 4-point star)
```

### Controls
- **WASD / Arrow keys** — Move player
- **E** — Enter building when near door
- **Q** — Talk to NPC when adjacent
- **ESC** — Exit building / close dialogue
- **Click** — Walk to location

### State Machine
```
INTRO (character picker) → EXPLORING_EXTERIOR (100×70 world)
                          → INSIDE_BUILDING (per-building interior)
                          → ACTIVITY (React component overlay)
```

### Activity Tile Detection
Uses `interior.activities[]` array (keyed by tile coords) instead of hardcoded tile checks. Walk onto any 20–34 tile → nearest matching activity activates.

---

## Visual Features

- **Animated grass** — two-tone shimmer every 400ms
- **Animated water** — sine wave on surface
- **Glowing activity stars** — 4-point star with shimmer animation
- **NPC patrol animation** — 2-frame walk cycle
- **Smooth camera lerp** (0.08 factor) — no jitter
- **Minimap** — exterior shows all tile types (walls=棕色, paths=沙色, water=蓝); interior shows walls + floor
- **Zone name HUD** — updates as player crosses zone boundaries
- **NPC talk prompt** — "Q to Talk" bubble when adjacent

---

## Progress Tracker

- [x] 100×70 expanded world map with 7 zones
- [x] 7 building exteriors with distinct visual styles
- [x] 7 fully mapped building interiors
- [x] All 23 activity components imported and routed
- [x] Activity tile system generalized via `activities[]` array
- [x] 10 NPCs with zones, patrol routes, contextual dialogue
- [x] New tile renderers: lake, bridge, hedge, statue, fountain, pond, rock
- [x] Interior minimap (80×66 px) in all buildings
- [x] Exterior minimap with NPC blips
- [x] Larger campus with connecting paths between all zones
- [x] Forest zone (Whispering Woods), Crystal Lake, Athletic fields
- [x] Git committed and pushed

**Still to do:**
- [ ] Vercel deploy (API token issue — needs re-auth)
- [ ] NPC face direction toward player when nearby
- [ ] Sound effects (footsteps, door creak, activity start chime)
- [ ] Building name signs on exterior
- [ ] Playwright test suite for campus navigation