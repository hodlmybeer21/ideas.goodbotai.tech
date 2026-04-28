# GoodBot Campus — Pokémon-Inspired Exploration Game

## Concept & Vision

A top-down, open-world exploration game for young children (ages 4-8). Kids wander a colorful school campus, discovering buildings, talking to friendly NPCs, and launching learning activities. The feel is Pokémon meets a cozy school — bright, welcoming, safe to explore. Every building has something to do. No fail states, no timers, just exploration and discovery.

---

## Design Language

**Aesthetic:** Pokémon GBC / Pokémon Yellow — chunky pixel tiles, bold outlines, expressive NPCs. Warm and saturated, not dark or scary.

**Color Palette:**
- Grass: `#6ABF40` (bright spring green)
- Path: `#D4A86A` (warm sand/dirt)
- Building walls: `#8B6914` (golden brick)
- Water: `#3A9FD4` (friendly blue)
- Trees: `#2D7A2D` (forest green)
- UI backgrounds: `#1A1A2E` (deep navy)
- UI text: `#FFFFFF`

**Typography:** Fredoka (existing), pixel-rendered via canvas for HUD/dialogue

**Tile size:** 10×10 px base, world scrolls under a fixed 800×600 viewport

**World size:** 100×80 tiles (800×640 px), viewport = 80×60 tiles

---

## World Map — Zones

```
NORTH: Gym + Forest Trail + Lake
         ↑ Gym (columns 30-55, rows 0-15)
         ↑ Forest Trail (columns 60-85, rows 2-20)
         ↑ Lake (columns 55-85, rows 20-40)

WEST:   Art Building + Library
         ↑ Art Building (columns 2-25, rows 20-45)
         ↑ Library (columns 2-20, rows 2-14)

CENTER: Main School + Plaza
         ↑ Main School (columns 28-55, rows 22-50)
         ↑ Plaza (columns 20-65, rows 15-22)

EAST:   Science Building
         ↑ Science Building (columns 65-92, rows 22-45)

SOUTH:  Cafeteria + Garden
         ↑ Cafeteria (columns 25-55, rows 55-73)
         ↑ Garden (columns 55-85, rows 50-73)
```

---

## Buildings & Interiors

### 1. Main School (center) — 27×28 tiles
**Exterior:** Brick school building with windows, red roof trim, main entrance doors  
**Interior:** Grand hallway with 4 classroom doors + lobby  
**Activities:** State Finder (Classroom 1), Story Machine (Library alcove)  
**NPCs:** Teacher Rosa, Principal Bo

### 2. Art Building (west) — 23×25 tiles  
**Exterior:** Colorful murals on walls, paint-splatter decorations  
**Interior:** Art studio with activity stations  
**Activities:** Pixel Canvas, Color Lab  
**NPC:** Paint Bot (friendly robot who talks about colors)

### 3. Gym (north) — 25×15 tiles
**Exterior:** Large brick building with "GYM" sign, bleachers visible  
**Interior:** Basketball court, open floor  
**Activities:** Math Ball mini-game, Sound Lab  
**NPC:** Coach Ziggy

### 4. Library (northwest) — 18×12 tiles
**Exterior:** Cozy stone building with arched windows  
**Interior:** Bookshelves, reading nooks  
**Activities:** Read Along, Syllable Scooper  
**NPC:** Ms. Page (owl character)

### 5. Science Building (east) — 27×23 tiles
**Exterior:** Lab building with beaker signs, bubbling tanks outside  
**Interior:** Lab benches, experiment stations  
**Activities:** Animal Match, True/False Quiz  
**NPC:** Dr. Spark

### 6. Cafeteria (south) — 30×18 tiles
**Exterior:** Warm cafeteria with awning  
**Interior:** Tables, serving line  
**Activities:** Sentence Builder, Tell Time  
**NPC:** Chef Ramon

### 7. Garden (southeast) — 30×23 tiles
**Exterior:** Flowery paths, small pond, butterfly statues  
**No interior — outdoor exploration zone**  
**Activity:** Tell Time (sundial), nature observation  
**NPC:** Gardener Fern

---

## NPC System

- **6 named NPCs** with distinct personalities:
  - Teacher Rosa — warm, welcoming
  - Principal Bo — friendly authority
  - Paint Bot — quirky robot artist
  - Coach Ziggy — energetic sports coach
  - Ms. Page — wise owl librarian
  - Dr. Spark — excitable scientist
  - Chef Ramon — jolly cafeteria chef
  - Gardener Fern — gentle nature guide

- Each NPC has: name, color, hair style, greeting phrase, 3 rotating dialogue lines
- NPCs patrol short routes OR stand in one spot
- Q to talk — dialogue box with typewriter effect
- NPCs face the player when nearby

---

## Activities (embedded React components)

| Activity | Location | Component |
|----------|----------|-----------|
| Pixel Canvas | Art Building | `PixelCanvas.tsx` |
| Color Lab | Art Building | `ColorLab.tsx` |
| State Finder | Main School | `StateFinder.tsx` |
| Read Along | Library | `ReadAlong.tsx` |
| Syllable Scooper | Library | `SyllableScooper.tsx` |
| Math Ball | Gym | `MathLab.tsx` |
| Sound Lab | Gym | `SoundLab.tsx` |
| Animal Match | Science Building | `AnimalMatch.tsx` |
| True/False | Science Building | `TrueFalse.tsx` |
| Sentence Builder | Cafeteria | `SentenceBuilder.tsx` |
| Tell Time | Cafeteria + Garden | `TellTime.tsx` |
| Story Machine | Main School | `StoryMachine.tsx` |
| Mad Libs | Plaza (outdoor) | `MadLibs.tsx` |
| Character Traits | Plaza (outdoor) | `CharacterTraits.tsx` |

---

## Technical Architecture

### World Data System
```
world/
  zones.ts       — Zone definitions (bounds, name, color, buildings)
  tiles.ts       — Tile types and draw functions
  interiors.ts   — Each building's interior map
  npcs.ts        — NPC definitions, patrol routes, dialogue
```

### Rendering
- Single canvas, 800×600 viewport
- World scrolls (camera follows player with lerp)
- Only visible tiles rendered each frame
- Layered rendering: ground → objects → NPCs → player → UI

### Zone Transitions
- Buildings trigger interior map when player walks through door
- Interior has its own map + exit door
- Seamless transition — no loading screens

### State Machine
```
INTRO → EXPLORING_EXTERIOR → INSIDE_BUILDING → ACTIVITY
```

### Player
- WASD / Arrow keys + click-to-walk
- Q to talk to NPC
- E to enter building / interact
- ESC to exit building / close dialogue

### Camera
- Smooth lerp toward player center
- Clamped to world bounds
- No dead zones — always centered on player

---

## Components

- `school/page.tsx` — Main game (refactored, ~400 lines core engine)
- `school/world/zones.ts` — World zone definitions
- `school/world/interiors.ts` — Building interior maps  
- `school/world/npcs.ts` — NPC data
- `school/engine/renderer.ts` — Tile drawing functions
- `school/engine/camera.ts` — Camera system
- `school/engine/collision.ts` — Walkability checks
- `school/components/` — All activity components reused

---

## Scope — Phase 1 (this build)

1. ✅ Expanded world map (100×80 tiles, 7 zones)
2. ✅ Smooth scrolling camera over large world
3. ✅ Main School + Art Building + Gym interiors with working doors
4. ✅ 6 NPCs with dialogue
5. ✅ 6 activities linked to rooms
6. ✅ Minimap updated for larger world
7. ✅ Zone names shown on HUD

**Phase 2:** Library, Science Building, Cafeteria, Garden interiors + activities  
**Phase 3:** More NPCs, world secrets, collection elements
