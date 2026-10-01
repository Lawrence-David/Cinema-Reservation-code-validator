const movies = document.querySelectorAll(".movie");

const modal = document.getElementById("movieModal");
const modalContent = modal.querySelector(".modal-content");
const modalTitle = document.getElementById("modalTitle");
const closeButton = document.getElementById("closeButton");

const dateSection = document.getElementById("dateSection");
const timeSection = document.getElementById("timeSection");
const seatSection = document.getElementById("seatSection");

const dateChips = document.getElementById("dateChips");
const timeChips = document.getElementById("timeChips");
const backButtons = document.querySelectorAll(".backButton");

const stepItems = document.querySelectorAll(".stepper li");
const selectionSummary = document.getElementById("selectionSummary");

const seatContainer = document.getElementById("seatContainer");
const seatError = document.getElementById("seatError");
const seatSummary = document.getElementById("seatSummary");
const copyButton = document.getElementById("copyButton");

const reserveButton = document.getElementById("reserveButton");

const receiptModal = document.getElementById("receiptModal");
const receiptContent = receiptModal.querySelector(".receipt");

const receiptCode = document.getElementById("receiptCode");
const receiptMovie = document.getElementById("receiptMovie");
const receiptDate = document.getElementById("receiptDate");
const receiptTime = document.getElementById("receiptTime");
const receiptSeats = document.getElementById("receiptSeats");

const okButton = document.getElementById("okButton");

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const numbers = "0123456789";
let reservationCode;

const inputCode = document.getElementById("inputCode");

const validationResult = document.getElementById("validationResult");

// Store the user's choices

let selectedMovie;
let selectedDate;
let selectedTime;
let selectedSeats = [];

// Element to return focus to when a modal closes
let lastFocused = null;


// ==============================
// MODAL HELPERS
// ==============================

// The three steps of the reservation dialog, in order
const stepSections = {
    date: dateSection,
    time: timeSection,
    seats: seatSection
};

function showStep(name, moveFocus) {

    Object.entries(stepSections).forEach(([key, section]) => {
        section.hidden = key !== name;
    });

    const current = Object.keys(stepSections).indexOf(name);

    stepItems.forEach((item, index) => {
        item.classList.toggle("done", index < current);

        if (index === current) {
            item.setAttribute("aria-current", "step");
        } else {
            item.removeAttribute("aria-current");
        }
    });

    updateSummary();

    // The chip or button that was focused is now hidden, so hand focus to the
    // new step's heading (keeps keyboard and screen-reader users in the dialog)
    if (moveFocus) {
        stepSections[name].querySelector("h3").focus();
    }
}

function updateSummary() {

    const parts = [];

    if (selectedDate) {
        parts.push(formatDate(selectedDate, DATE_SHORT));
    }

    if (selectedTime) {
        parts.push(selectedTime);
    }

    selectionSummary.textContent = parts.join("  ·  ");
}

function openModal(element, content) {

    element.classList.add("open");
    element.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    content.focus();
}

function hideModal(element) {

    element.classList.remove("open");
    element.setAttribute("aria-hidden", "true");
}

function closeModal(element) {

    hideModal(element);

    if (!document.querySelector(".modal.open")) {
        document.body.classList.remove("modal-open");

        if (lastFocused) {
            lastFocused.focus();
        }
    }
}

function focusableIn(container) {
    return [...container.querySelectorAll(
        "button, [href], input, select, textarea"
    )].filter(el => !el.disabled && el.offsetParent !== null);
}

document.addEventListener("keydown", function(event) {

    const openEl = document.querySelector(".modal.open");

    if (!openEl) {
        return;
    }

    if (event.key === "Escape") {
        closeModal(openEl);
        return;
    }

    if (event.key === "Tab") {

        const content = openEl.firstElementChild;
        const items = focusableIn(content);

        if (items.length === 0) {
            event.preventDefault();
            return;
        }

        const first = items[0];
        const last = items[items.length - 1];

        if (!content.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
            return;
        }

        if (event.shiftKey && (document.activeElement === first || document.activeElement === content)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }
});

// Click on the dark backdrop (not the dialog) closes the modal
[modal, receiptModal].forEach(element => {
    element.addEventListener("mousedown", function(event) {
        if (event.target === element) {
            closeModal(element);
        }
    });
});

closeButton.addEventListener("click", function() {
    closeModal(modal);
});


// ==============================
// DATE FORMATTING (local time)
// ==============================

const DATE_SHORT = { weekday: "short", month: "short", day: "numeric" };
const DATE_WITH_YEAR = { ...DATE_SHORT, year: "numeric" };

function toLocalISO(date) {

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return date.getFullYear() + "-" + month + "-" + day;
}

// Build the date from its parts so it stays in local time (not UTC)
function formatDate(iso, options) {

    const [year, month, day] = iso.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-US", options);
}


// ==============================
// CHIPS (date + time)
// ==============================

function clearChips(container) {

    container.querySelectorAll(".chip").forEach(chip => {
        chip.classList.remove("selected");
        chip.setAttribute("aria-pressed", "false");
    });
}

function selectChip(container, chip) {

    clearChips(container);

    chip.classList.add("selected");
    chip.setAttribute("aria-pressed", "true");
}

function createDateChip(date) {

    const chip = document.createElement("button");

    chip.type = "button";
    chip.className = "chip chip-date";
    chip.dataset.date = toLocalISO(date);
    chip.setAttribute("aria-pressed", "false");

    chip.innerHTML =
        "<span class='chip-day'>" +
        date.toLocaleDateString("en-US", { weekday: "short" }) +
        "</span><span class='chip-num'>" + date.getDate() +
        "</span><span class='chip-month'>" +
        date.toLocaleDateString("en-US", { month: "short" }) +
        "</span>";

    return chip;
}

// One chip per day, starting today, for the next 30 days
const today = new Date();

for (let i = 0; i < 30; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    dateChips.appendChild(createDateChip(date));
}


// ==============================
// SEATS
// ==============================

const SEAT_COUNT = 30;
const SEATS_PER_ROW = 6;

function sortedSeats() {
    return [...selectedSeats].sort((a, b) => a - b);
}

function updateSeatSummary() {

    if (selectedSeats.length === 0) {
        seatSummary.textContent = "No seats selected";
    } else {
        seatSummary.textContent =
            (selectedSeats.length === 1 ? "Seat " : "Seats ") +
            sortedSeats().join(", ");
    }
}

function resetSeats() {

    seatContainer.innerHTML = "";
    seatError.textContent = "";
    selectedSeats = [];

    updateSeatSummary();
}

function toggleSeat(seat) {

    const seatNumber = Number(seat.textContent);

    if (selectedSeats.includes(seatNumber)) {
        selectedSeats = selectedSeats.filter(number => number !== seatNumber);
    } else {
        selectedSeats.push(seatNumber);
    }

    seat.classList.toggle("selected");
    seat.setAttribute("aria-pressed", seat.classList.contains("selected"));

    seatError.textContent = "";

    updateSeatSummary();
}

function createSeat(number) {

    const seat = document.createElement("button");

    seat.type = "button";
    seat.className = "seat";
    seat.textContent = number;
    seat.setAttribute("aria-label", "Seat " + number);
    seat.setAttribute("aria-pressed", "false");

    seat.addEventListener("click", function() {
        toggleSeat(this);
    });

    return seat;
}

// Rows of 6 seats with an aisle after every third seat
function renderSeats() {

    for (let i = 1; i <= SEAT_COUNT; i++) {

        seatContainer.appendChild(createSeat(i));

        if (i % SEATS_PER_ROW === SEATS_PER_ROW / 2) {
            const aisle = document.createElement("span");
            aisle.className = "aisle";
            aisle.setAttribute("aria-hidden", "true");
            seatContainer.appendChild(aisle);
        }
    }
}


// ==============================
// RESERVATION FLOW
// ==============================

movies.forEach(movie => {

    movie.addEventListener("click", function() {

        selectedMovie = this.dataset.movie;
        modalTitle.textContent = selectedMovie;

        // Reset previous choices
        selectedDate = null;
        selectedTime = null;

        clearChips(dateChips);
        clearChips(timeChips);
        resetSeats();

        showStep("date");

        lastFocused = this;
        openModal(modal, modalContent);
    });
});

// Each back button names the step it returns to (data-back="date" or "time")
backButtons.forEach(button => {
    button.addEventListener("click", function() {
        showStep(this.dataset.back, true);
    });
});

dateChips.addEventListener("click", function(event) {

    const chip = event.target.closest(".chip");

    if (!chip) {
        return;
    }

    selectedDate = chip.dataset.date;
    selectChip(dateChips, chip);

    showStep("time", true);
});

timeChips.addEventListener("click", function(event) {

    const chip = event.target.closest(".chip");

    if (!chip) {
        return;
    }

    selectedTime = chip.dataset.time;
    selectChip(timeChips, chip);

    showStep("seats", true);

    resetSeats();
    renderSeats();
});


// ==============================
// RESERVE
// ==============================

reserveButton.addEventListener("click", function() {

    if (selectedSeats.length === 0) {
        seatError.textContent = "Please select at least one seat.";
        return;
    }

    reservationCode = generateReservationCode();

    receiptCode.textContent = reservationCode;
    receiptMovie.textContent = selectedMovie;
    receiptDate.textContent = formatDate(selectedDate, DATE_WITH_YEAR);
    receiptTime.textContent = selectedTime;
    receiptSeats.textContent = sortedSeats().join(", ");

    copyButton.textContent = "Copy code";

    // Swap the reservation modal for the receipt. Focus returns to the
    // poster that opened the flow once the receipt is closed.
    hideModal(modal);
    openModal(receiptModal, receiptContent);
});

copyButton.addEventListener("click", function() {

    if (!navigator.clipboard) {
        return;
    }

    navigator.clipboard.writeText(receiptCode.textContent).then(function() {
        copyButton.textContent = "Copied!";
    }).catch(function() {
        copyButton.textContent = "Select the code to copy";
    });
});

okButton.addEventListener("click", function() {
    closeModal(receiptModal);
});

function randomFrom(chars) {
    return chars[Math.floor(Math.random() * chars.length)];
}

// LDLDLDL: a letter at positions 1, 3, 5, 7 and a digit at 2, 4, 6
function generateReservationCode() {

    let code = "";

    for (let i = 0; i < 7; i++) {
        code += randomFrom(i % 2 === 0 ? letters : numbers);
    }

    return code;
}


// ==============================
// VALIDATION
// ==============================

const START_STATE = "q0";
const ACCEPT_STATES = ["q7"];
const DEAD_STATE = "q8";

// One entry per arrow in the diagram
const transitions = {
    q0: { "A-Z": "q1", "0-9": "q8" },
    q1: { "A-Z": "q8", "0-9": "q2" },
    q2: { "A-Z": "q3", "0-9": "q8" },
    q3: { "A-Z": "q8", "0-9": "q4" },
    q4: { "A-Z": "q5", "0-9": "q8" },
    q5: { "A-Z": "q8", "0-9": "q6" },
    q6: { "A-Z": "q7", "0-9": "q8" },
    q7: { "A-Z": "q8", "0-9": "q8" },
    q8: { "A-Z": "q8", "0-9": "q8" }
};

// Which arrow label does this symbol use? null = not in the alphabet
function symbolGroup(ch) {
    if (letters.includes(ch)) return "A-Z";
    if (numbers.includes(ch)) return "0-9";
    return null;
}

function runDFA(input) {

    const log = [];
    const steps = [];
    let state = START_STATE;

    // Requirement 2: every symbol must belong to the alphabet
    for (let i = 0; i < input.length; i++) {
        const ch = input[i];
        if (symbolGroup(ch) === null) {
            return {
                log: ["Invalid symbol '" + ch + "' (not in the alphabet A-Z, 0-9)"],
                steps: [],
                invalid: { index: i, symbol: ch },
                final: "N/A",
                accepted: false
            };
        }
    }

    // Requirements 3 and 4: process symbol by symbol, record each transition
    for (const ch of input) {
        const next = transitions[state][symbolGroup(ch)];
        log.push(state + " --" + ch + "--> " + next);
        steps.push({ from: state, symbol: ch, to: next });
        state = next;
    }

    // Requirements 5 and 6
    return {
        log: log,
        steps: steps,
        invalid: null,
        final: state,
        accepted: ACCEPT_STATES.includes(state)
    };
}

// Index of the first move into the dead state, or -1 if there is none
function firstDeadStep(result) {
    return result.steps.findIndex(step => step.to === DEAD_STATE);
}


// ==============================
// SIMULATOR DISPLAY
// ==============================

// Test cases from the report (Chapter 2, C), plus the empty string
const TEST_CASES = {
    accepted: ["A8F5B3C", "G0D3E8V", "D7U9O6F", "I3K2O0Z", "W8L7P1J",
               "I8F3Y8C", "Y8A9B2T", "N2R6F8J", "T4Q5Z9K", "S3F0U8I"],
    rejected: ["999FnSj", "7B6C8B7", "BBC9D3F", "A8F5B3", "A8F5B3CC",
               "“9B7C9F", " A7F7B2C", "A7F_B2C", "ABCDEF", "1234567", ""]
};

const simResults = document.getElementById("simResults");
const verdictCard = document.getElementById("verdictCard");
const verdictValue = document.getElementById("verdictValue");
const verdictInput = document.getElementById("verdictInput");
const verdictFinal = document.getElementById("verdictFinal");
const verdictRead = document.getElementById("verdictRead");
const verdictReason = document.getElementById("verdictReason");
const inputTape = document.getElementById("inputTape");
const traceBody = document.getElementById("traceBody");
const dfaDiagram = document.getElementById("dfaDiagram");

// Show invisible characters so a leading space or empty input is visible
function displaySymbol(ch) {
    return ch === " " ? "␣" : ch;
}

function displayString(str) {
    return str === "" ? "ε (empty)" : [...str].map(displaySymbol).join("");
}

// Plain-language reason, for the demo and the defense
function explain(input, result) {

    if (result.invalid) {
        return "Position " + (result.invalid.index + 1) + " is '" +
            displaySymbol(result.invalid.symbol) +
            "', which is not in Σ = {A–Z, 0–9}. The input is rejected before any transition is made.";
    }

    if (input === "") {
        return "Empty string ε: no symbols are read, so the automaton stays in q0, which is not an accepting state.";
    }

    if (result.accepted) {
        return "All 7 symbols matched the letter-digit pattern and the automaton ended in q7, the accepting state.";
    }

    const deadIndex = firstDeadStep(result);

    if (deadIndex !== -1) {

        const step = result.steps[deadIndex];

        if (ACCEPT_STATES.includes(step.from)) {
            return "The first 7 symbols formed a valid code, but symbol " + (deadIndex + 1) +
                " ('" + step.symbol + "') is extra. q7 has no outgoing path except to the dead state q8.";
        }

        const expected = transitions[step.from]["A-Z"] !== DEAD_STATE ? "a letter (A–Z)" : "a digit (0–9)";

        return "Position " + (deadIndex + 1) + " is '" + step.symbol + "' but should be " + expected +
            ", so the automaton moved to the dead state q8 and stayed there.";
    }

    return "The input ended after " + input.length + " symbol" + (input.length === 1 ? "" : "s") +
        " in " + result.final + ", which is not an accepting state. A valid code has exactly 7.";
}

// ok = read normally, bad = where it failed, after/skipped = never mattered
function tapeStatus(index, result, deadIndex) {

    if (result.invalid) {
        return index === result.invalid.index ? "bad" : "skipped";
    }

    if (deadIndex === -1 || index < deadIndex) {
        return "ok";
    }

    return index === deadIndex ? "bad" : "after";
}

function renderTape(input, result) {

    inputTape.innerHTML = "";

    const deadIndex = firstDeadStep(result);

    [...input].forEach((ch, i) => {

        const cell = document.createElement("li");

        cell.className = "tape-cell tape-" + tapeStatus(i, result, deadIndex);
        cell.innerHTML = "<span class='tape-pos'>" + (i + 1) + "</span><span class='tape-sym'></span>";
        cell.querySelector(".tape-sym").textContent = displaySymbol(ch);

        inputTape.appendChild(cell);
    });

    inputTape.hidden = input === "";
}

function tableRow(cells) {

    const row = document.createElement("tr");

    cells.forEach(text => {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.appendChild(cell);
    });

    return row;
}

function renderTrace(result) {

    traceBody.innerHTML = "";

    if (result.steps.length === 0) {

        const row = tableRow([
            result.invalid
                ? "No transitions: the input contains a symbol outside the alphabet."
                : "No transitions: no symbols were read."
        ]);

        row.firstChild.colSpan = 4;
        row.firstChild.className = "trace-empty";

        traceBody.appendChild(row);
        return;
    }

    result.steps.forEach((step, i) => {

        const row = tableRow([String(i + 1), step.symbol, step.from, step.to]);

        if (step.to === DEAD_STATE) {
            row.className = "to-dead";
        }

        traceBody.appendChild(row);
    });
}


// ---------- DFA diagram, drawn from the transitions table ----------

const SVG_NS = "http://www.w3.org/2000/svg";
const CHAIN = ["q0", "q1", "q2", "q3", "q4", "q5", "q6", "q7"];
const R = 24;
const POS = {};

CHAIN.forEach((name, i) => {
    POS[name] = { x: 70 + i * 110, y: 70 };
});
POS[DEAD_STATE] = { x: 455, y: 205 };

function svg(tag, attrs, parent) {

    const el = document.createElementNS(SVG_NS, tag);

    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));

    if (parent) {
        parent.appendChild(el);
    }

    return el;
}

function svgText(text, attrs, parent) {

    const el = svg("text", attrs, parent);

    el.textContent = text;

    return el;
}

function edgeLine(from, to, cls, parent) {

    const a = POS[from];
    const b = POS[to];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / length;
    const uy = (b.y - a.y) / length;

    return svg("line", {
        x1: a.x + ux * R, y1: a.y + uy * R,
        x2: b.x - ux * (R + 3), y2: b.y - uy * (R + 3),
        class: cls,
        "data-edge": from + ">" + to,
        "marker-end": "url(#arrow)"
    }, parent);
}

function drawDiagram() {

    const defs = svg("defs", {}, dfaDiagram);

    [["arrow", "m-normal"], ["arrowTaken", "m-taken"], ["arrowDead", "m-dead"]].forEach(([id, cls]) => {
        const marker = svg("marker", {
            id: id, viewBox: "0 0 10 10", refX: 8, refY: 5,
            markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse"
        }, defs);
        svg("path", { d: "M0,0 L10,5 L0,10 z", class: cls }, marker);
    });

    const edges = svg("g", { class: "dfa-edges" }, dfaDiagram);

    // start arrow
    svg("line", {
        x1: 8, y1: 70, x2: POS.q0.x - R - 3, y2: 70,
        class: "dfa-edge dfa-start", "marker-end": "url(#arrow)"
    }, edges);

    // every transition, straight from the table (the dead state's loop is drawn below)
    Object.entries(transitions).forEach(([from, row]) => {

        if (from === DEAD_STATE) {
            return;
        }

        Object.entries(row).forEach(([group, to]) => {

            if (to === DEAD_STATE) {
                edgeLine(from, to, "dfa-edge dfa-edge-dead", edges);
                return;
            }

            edgeLine(from, to, "dfa-edge", edges);

            svgText(group, {
                x: (POS[from].x + POS[to].x) / 2, y: POS[from].y - 12,
                class: "dfa-label", "text-anchor": "middle"
            }, edges);
        });
    });

    // dead state self-loop
    const d = POS[DEAD_STATE];
    svg("path", {
        d: "M" + (d.x - 12) + "," + (d.y + 21) +
           " C" + (d.x - 46) + "," + (d.y + 62) + " " + (d.x + 46) + "," + (d.y + 62) + " " +
           (d.x + 13) + "," + (d.y + 23),
        class: "dfa-edge dfa-edge-dead", "data-edge": DEAD_STATE + ">" + DEAD_STATE,
        fill: "none", "marker-end": "url(#arrow)"
    }, edges);
    svgText("A-Z, 0-9", { x: d.x + 44, y: d.y + 52, class: "dfa-label" }, edges);

    // states
    [...CHAIN, DEAD_STATE].forEach(name => {

        const p = POS[name];
        const group = svg("g", { class: "dfa-state", "data-state": name }, dfaDiagram);

        svg("circle", { cx: p.x, cy: p.y, r: R }, group);

        if (ACCEPT_STATES.includes(name)) {
            svg("circle", { cx: p.x, cy: p.y, r: R - 5, class: "dfa-inner" }, group);
        }

        svgText(name, { x: p.x, y: p.y + 5, "text-anchor": "middle" }, group);
    });
}

function highlightDiagram(result) {

    dfaDiagram.querySelectorAll(".dfa-state").forEach(el => {
        el.classList.remove("visited", "final-accept", "final-reject");
    });

    dfaDiagram.querySelectorAll("[data-edge]").forEach(el => {
        el.classList.remove("taken");
        el.setAttribute("marker-end", "url(#arrow)");
    });

    if (result.invalid) {
        dfaDiagram.setAttribute("aria-label",
            "DFA diagram. The input was rejected before any transition, because it contains a symbol outside the alphabet.");
        return;
    }

    const path = [START_STATE, ...result.steps.map(step => step.to)];

    path.forEach(name => {
        dfaDiagram.querySelector("[data-state='" + name + "']").classList.add("visited");
    });

    result.steps.forEach(step => {
        const edge = dfaDiagram.querySelector("[data-edge='" + step.from + ">" + step.to + "']");
        edge.classList.add("taken");
        edge.setAttribute("marker-end", step.to === DEAD_STATE ? "url(#arrowDead)" : "url(#arrowTaken)");
    });

    dfaDiagram.querySelector("[data-state='" + result.final + "']")
        .classList.add(result.accepted ? "final-accept" : "final-reject");

    dfaDiagram.setAttribute("aria-label",
        "DFA diagram. Path: " + path.join(" to ") + ". Final state " + result.final +
        (result.accepted ? ", accepted." : ", rejected."));
}

drawDiagram();


// ---------- running one input ----------

function showResult(state, message) {

    validationResult.dataset.state = state;
    validationResult.textContent = message;
}

function logToConsole(code, result) {

    console.log("Input:", code);
    result.log.forEach(line => console.log(line));
    console.log("Final state:", result.final);
    console.log(result.accepted ? "ACCEPTED" : "REJECTED");
    console.log("-----");
}

// Reservation lookup is separate from the automaton: the DFA only decides
// whether the string is in the language, not whether a booking exists
function showLookup(code, result) {

    if (!result.accepted) {
        showResult("info", "Reservation lookup skipped: the code is not in the valid format.");
    } else if (!reservationCode) {
        showResult("info", "Valid format. No reservation has been made in this session yet.");
    } else if (code === reservationCode) {
        showResult("success", "Valid format, and it matches your reservation.");
    } else {
        showResult("info", "Valid format, but no reservation was issued with this code.");
    }
}

function validateReservationCode() {

    const code = inputCode.value;
    const result = runDFA(code);

    logToConsole(code, result);

    // Automaton verdict (requirements 2 to 6)
    verdictCard.dataset.verdict = result.accepted ? "accepted" : "rejected";
    verdictValue.textContent = result.accepted ? "ACCEPTED" : "REJECTED";
    verdictInput.textContent = displayString(code);
    verdictFinal.textContent = result.invalid ? "None (not run)" : result.final;
    verdictRead.textContent = result.steps.length + " of " + code.length;
    verdictReason.textContent = explain(code, result);

    renderTape(code, result);
    renderTrace(result);
    highlightDiagram(result);

    simResults.hidden = false;

    showLookup(code, result);
}


// ---------- demo inputs ----------

function makeChip(value, expected) {

    const chip = document.createElement("button");

    chip.type = "button";
    chip.className = "tc-chip";
    chip.textContent = displayString(value);
    chip.setAttribute("aria-label", "Run test case " + displayString(value) + ", expected " + expected);

    chip.addEventListener("click", function() {
        inputCode.value = value;
        validateReservationCode();
    });

    return chip;
}

document.getElementById("tcAccepted").append(...TEST_CASES.accepted.map(v => makeChip(v, "accepted")));
document.getElementById("tcRejected").append(...TEST_CASES.rejected.map(v => makeChip(v, "rejected")));


// ---------- form ----------

inputCode.addEventListener("input", function() {
    showResult("", "");
    simResults.hidden = true;
});

document.getElementById("validatorForm").addEventListener("submit", function(event) {
    event.preventDefault();
    validateReservationCode();
});


// ==============================
// THEME (dark / light)
// ==============================

const themeToggle = document.getElementById("themeToggle");
const lightQuery = window.matchMedia("(prefers-color-scheme: light)");

function setTheme(theme) {

    document.documentElement.dataset.theme = theme;

    themeToggle.setAttribute(
        "aria-label",
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
    );
}

function savedTheme() {

    try {
        return localStorage.getItem("theme");
    } catch (error) {
        return null;
    }
}

function saveTheme(theme) {

    try {
        localStorage.setItem("theme", theme);
    } catch (error) {
        // private mode: the choice just lasts for this visit
    }
}

// The inline script in <head> already chose the theme; sync the button label
setTheme(document.documentElement.dataset.theme);

themeToggle.addEventListener("click", function() {

    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";

    setTheme(next);
    saveTheme(next);
});

// Follow the operating system until the user picks a theme themselves
lightQuery.addEventListener("change", function(event) {

    if (!savedTheme()) {
        setTheme(event.matches ? "light" : "dark");
    }
});
