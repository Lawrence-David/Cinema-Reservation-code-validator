# SM Cinema – Reservation & Code Validator: Design Package

Depth: **Prototype** (static HTML/CSS/JS, no backend). Everything below is derived from the current code in `cinema reservation code validator/` plus explicit assumptions where the code is silent.

## 1. WHY

**Problem.** A moviegoer needs a quick way to reserve seats for a film and get a short code they can present later; cinema staff need a way to check that a presented code is genuine.

**Goals**
- G1. Reserve seats for a movie in ≤ 4 steps (movie → date → time → seats).
- G2. Issue a memorable reservation code at the end.
- G3. Let a code be validated with a clear valid / invalid answer.
- G4. Look and feel like a cinema brand (frontend design goal, owned by the designer).

**Riskiest assumption.** Codes are only "valid" if generated in the same page session (there is no persistence). See §6 Risks.

## 2. WHO

| Actor | Can do |
|---|---|
| Customer | Browse movies, reserve, view receipt, validate a code |
| Staff (assumed, same UI in prototype) | Validate a code |

No login, no roles. Authorization is out of scope.

## 3. WHAT

**In scope:** movie grid, 3-step reservation modal, receipt modal, code validator.
**Out of scope (future):** accounts, payment, real showtimes, per-showtime seat availability, backend, persistence, cancellation, emails/QR.

### Functional requirements
| ID | Requirement | Current status |
|---|---|---|
| FR-001 | Show available movies with poster and title | Done (slice 1) |
| FR-002 | Selecting a movie opens the reservation flow | Done |
| FR-003 | Choose a date from today through the next 29 days | Done |
| FR-004 | Choose one of 7 fixed times (10:00 AM … 10:00 PM, every 2 h) | Done |
| FR-005 | Choose 1..30 seats from a grid of 30 | Done |
| FR-006 | Reserving with 0 seats is refused with a message | Done, inline (slice 2) |
| FR-007 | On reserve, generate a 7-char code and show a receipt (movie, date, time, seats) | Done |
| FR-008 | Back navigation between steps | Done (time→date, seats→time) |
| FR-009 | Validate a typed code and show the result | Done, text only |
| FR-010 | Close the flow without reserving | Done: ✕, Esc, backdrop (slice 2) |
| FR-011 | Format-check the code and tell the user why it's wrong | Done (slice 4) |

### Non-functional requirements
- NFR-001 Responsive from 360px to desktop (currently none).
- NFR-002 Keyboard and screen-reader operable (WCAG 2.1 AA target).
- NFR-003 No build step; opens from static hosting.
- NFR-004 Contrast AA on all text.

### Business rules
- BR-1 Code format: `L D L D L D L` (letter, digit alternating, 7 chars, uppercase letters `A–Z`, digits `0–9`).
- BR-2 A reservation requires movie + date + time + at least one seat.
- BR-3 A code is valid only if it equals the most recently issued code (current behavior).
- BR-4 ~~Code entry is trimmed and uppercased~~ **Superseded:** input is read exactly as typed, so lowercase letters and spaces are outside Σ and are rejected, as the language definition requires.
- BR-5 (proposed) A code should embed no personal data.

## 4. HOW

### Domain model
- **Movie**: `id, title, genre, poster` – currently hard-coded in HTML (proposal: array in JS).
- **Reservation**: `code, movie, date (YYYY-MM-DD, local), time, seats[]`.
- **Seat**: number 1–30; states `available | selected` (add `taken` later).

### State model – reservation flow
```
IDLE ──pick movie──▶ DATE ──pick date──▶ TIME ──pick time──▶ SEATS
  ▲                    ▲◀──back──────────┘  ▲◀──back────────────┘
  │                                                      │ reserve (≥1 seat)
  └────────── OK ◀── RECEIPT ◀───────────────────────────┘
```
Proposed extra transition: any modal step → IDLE via close (✕, Esc, backdrop).

Validator state: `EMPTY → VALID | INVALID_FORMAT | NOT_FOUND`.

### Architecture
Single page, no backend. **Business logic lives in `cinema.js`** (client). This is acceptable only because it is a prototype: a client-side check proves nothing to a real cinema. If this ever goes to production, code generation and validation move to a server with a database.

| Concern | Where |
|---|---|
| Structure | `cinema.html` |
| Presentation | `cinema.css` (+ tokens, see §7) |
| Behavior/state | `cinema.js` |
| Assets | `images/` |

### Key workflows
1. **Reserve:** click poster → modal (title) → date → time → seats → Reserve → receipt (code) → OK.
2. **Validate:** type code → Validate → result message.

## 5. WHAT IF IT FAILS?

| Case | Behavior now | Target behavior |
|---|---|---|
| No seat chosen | `alert()` | Inline message in the seat step |
| Empty validator input | "Invalid reservation code." | "Enter a code" |
| Wrong format (e.g. `12345`) | Console log only | "Codes look like A1B2C3D" |
| Lowercase entry | Invalid | Normalize to uppercase |
| No code issued yet | "Invalid" | "No reservation made yet" |
| Page reload | All reservations lost | Persist in `localStorage` (proposal) |
| Two users, same seat | Not applicable (no shared state) | Needs a backend; out of scope |
| Poster image fails | Broken image | `alt` + fallback background |
| Late-evening local time | `toISOString()` (UTC) may show the wrong day | Format the local date parts |
| Code collision | Possible (random) | Ignore for prototype; server uniqueness in production |

Security: no secrets, no user data, no network. XSS risk is minimal because `textContent` is used. Codes come from `Math.random`, which is fine for a demo and not for real tickets.

## 6. HOW DO WE KNOW IT WORKS?

Acceptance checks (manual for the prototype):
- TC-001 Selecting each of the 8 posters opens the modal with the right title. (FR-001, 002)
- TC-002 Dates listed start today and run 30 days. (FR-003)
- TC-003 Time list has 7 entries. (FR-004)
- TC-004 Clicking seats toggles selection; receipt lists them ascending or in click order. (FR-005, 007)
- TC-005 Reserve with none selected shows a message and does not advance. (FR-006, BR-2)
- TC-006 Receipt code matches `^([A-Z][0-9]){3}[A-Z]$`. (BR-1)
- TC-007 Typing that exact code validates; a changed character fails. (FR-009, BR-3)
- TC-008 Back buttons return to the previous step keeping choices. (FR-008)
- TC-009 Layout works at 360, 768, 1280px. (NFR-001)
- TC-010 Full flow is completable by keyboard alone. (NFR-002)

Known risks / assumptions
- R1 Only the last code validates (BR-3). Decide with the logic owner whether a list of codes should be stored.
- R2 `isValidFormat()` checks characters but never reports the result to the UI or blocks validation.
- R3 Seats show no availability, so the "reservation" is not real yet.
- R4 Movie metadata is placeholder ("Action movie" ×8).

## 7. UI design brief (frontend designer's scope)

Structure stays the same; presentation and interaction change.

**Screens / states to design**
1. Home: header + brand, hero/heading, poster grid (with title + genre visible, hover/focus states), validator section, footer.
2. Reservation modal, 3 steps with a stepper and a summary of choices made: date chips, time chips, seat map (screen, legend, aisle), Reserve, Back, Close.
3. Receipt: ticket layout with the code as hero.
4. Validator: labeled input, button, and result states (empty, valid, invalid format, not found).
5. Empty/error: image fallback, no-seat message.

**Design tokens to define first:** color (surface, text, accent, success, error, seat available/selected/taken), type scale and font pair, spacing scale, radius, elevation, motion durations.

**Responsive:** 2 columns of posters ≤ 600px, 3 to ≤ 900px, 4 above. Modal becomes a bottom sheet or full screen on phones.

**Accessibility:** posters as `<button>` with alt text, `role="dialog"` + `aria-modal`, focus trap and restore, Esc closes, seat `aria-pressed` and `aria-label="Seat 12"`, selection not conveyed by color alone, result text in an `aria-live` region.

## 8. Delivery plan (vertical slices)

1. Tokens + page shell + responsive poster grid (FR-001, NFR-001).
2. Reservation modal restyle + close controls + inline errors (FR-002…FR-006, FR-010).
3. Seat map + receipt ticket (FR-005, FR-007).
4. Validator section + states + input normalization (FR-009, FR-011, BR-4).
5. Accessibility and cross-size pass (NFR-002, NFR-004, TC-009/010).

## 9. Decisions

- ADR-001 Stay with plain HTML/CSS/JS. **Why:** no backend or build requirement (NFR-003), small scope; a framework adds nothing yet. Revisit if a backend or persistence is added.

## 10. Build log

| Slice | Delivered |
|---|---|
| 1 | Design tokens, dark theme, sticky header, responsive poster grid (2/3/4 cols), poster cards as buttons with visible title and genre |
| 2 | Dialog modal: stepper, date and time chips, inline error, close via ✕/Esc/backdrop, focus trap and return, local-date fix |
| 3 | Seat map (screen, aisle, legend, live summary), ticket-style receipt with copy button |
| 4 | Validator section: labeled input, five result states, trim + uppercase normalization |
| 5 | Accessibility and cross-size pass (below) |
| 6 | Modal fade (opacity + slight rise, bottom-sheet slide on phones, off for `prefers-reduced-motion`) and light theme: token overrides under `:root[data-theme="light"]`, header toggle, choice saved in `localStorage`, follows the OS until the user picks |

### Slice 5 findings and fixes
- Contrast: white on the old accent was exactly 4.5:1 and failed on hover (3.3:1). Accent is now `#2563eb` (5.2:1), button hover uses `--accent-strong` `#1d4fd8` (6.6:1).
- Control edges (inputs, chips, seats, secondary buttons) were 1.3-1.4:1 against their background. They now use `--control-border` (≥3.2:1 on every surface).
- Keyboard: focus was lost to `<body>` after choosing a date or time (the focused chip was hidden), which let Tab escape the dialog. Focus now moves to the new step's heading, and the trap pulls stray focus back in.
- Landmarks: validator moved into `<main>`, skip link added, decorative logo alt emptied (text sits next to it), © added to the footer.
- Targets: chips, seats, copy button and close button are ≥44px at 360px width.
- Verified at 360, 768 and 1280px: no horizontal scroll, no target under 44px, one `h1`, ordered headings, no unlabeled controls, no images without alt.

### Still open
- R1: only the last code issued in the session validates.
- R3: no taken seats; there is no shared availability without a backend.
- R4: movie genres are placeholders ("Action" for all).
- Not tested with a real screen reader (NVDA/VoiceOver); checks so far are programmatic plus keyboard.

### Theme notes
- The theme is set by a tiny inline script in `<head>` before first paint, so there is no flash. It reads `localStorage.theme`, else the OS setting.
- Light palette is contrast-checked: text 5.5:1+, control borders 3.2:1+, success/error text 5.2:1+ on their tinted boxes. Semantic colors (header, ticket notches, screen glow, focus glow, result tints) are tokens, so a new theme is one override block.

## 11. Automaton simulator display

The DFA (`transitions`, `runDFA()`, added by Lawrence-David) decides whether the input is in the language. The page now shows that decision separately from the reservation lookup, so a valid code with no booking no longer shows an error next to "ACCEPTED".

| Course requirement | Shown as |
|---|---|
| Accept user input | Code field; Enter or Validate code |
| Check symbols are in Σ | First symbol outside {A-Z, 0-9} is marked on the input tape; final state "None (not run)" |
| Process symbol by symbol | Input tape, one cell per position, the failing position in red |
| Display the state transitions | Step / Symbol / From / To table; rows into q8 in red |
| Identify the final state | "Final state" in the result card and the highlighted state in the diagram |
| ACCEPTED or REJECTED | Large verdict with a plain-language reason |
| Multiple test cases | Type and validate as many inputs as needed; a collapsed "Demo inputs" panel holds the report's 21 test strings (10 accept, 11 reject incl. the empty string) as one-click buttons for the live demo |

The DFA diagram is drawn from the same `transitions` table the simulator runs, so the picture cannot drift from the logic.
