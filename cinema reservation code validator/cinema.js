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
const validateButton = document.getElementById("validateButton");

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

const steps = {
    date: dateSection,
    time: timeSection,
    seats: seatSection
};

function showStep(name, moveFocus) {

    Object.entries(steps).forEach(([key, section]) => {
        section.hidden = key !== name;
    });

    const current = Object.keys(steps).indexOf(name);

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
        steps[name].querySelector("h3").focus();
    }
}

function updateSummary() {

    const parts = [];

    if (selectedDate) {
        parts.push(formatDateLong(selectedDate));
    }

    if (selectedTime) {
        parts.push(selectedTime);
    }

    selectionSummary.textContent = parts.join("  ·  ");
}

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

function formatDateFull(iso) {

    const [year, month, day] = iso.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function openModal(element, content) {

    element.classList.add("open");
    element.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    content.focus();
}

function closeModal(element) {

    element.classList.remove("open");
    element.setAttribute("aria-hidden", "true");

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

function toLocalISO(date) {

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return date.getFullYear() + "-" + month + "-" + day;
}

function formatDateLong(iso) {

    const [year, month, day] = iso.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    });
}

function selectChip(container, chip) {

    container.querySelectorAll(".chip").forEach(item => {
        item.classList.remove("selected");
        item.setAttribute("aria-pressed", "false");
    });

    chip.classList.add("selected");
    chip.setAttribute("aria-pressed", "true");
}


// ==============================
// DATE CHIPS
// ==============================

const today = new Date();

for (let i = 0; i < 30; i++) {

    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);

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

    dateChips.appendChild(chip);
}


// ==============================
// MOVIE
// ==============================

movies.forEach(movie => {

    movie.addEventListener("click", function() {

        selectedMovie = this.dataset.movie;

        modalTitle.textContent = selectedMovie;

        console.log("Movie:", selectedMovie);

        // Reset previous choices
        selectedDate = null;
        selectedTime = null;
        selectedSeats = [];

        document.querySelectorAll("#dateChips .chip, #timeChips .chip").forEach(chip => {
            chip.classList.remove("selected");
            chip.setAttribute("aria-pressed", "false");
        });

        // Reset sections
        showStep("date");
        seatError.textContent = "";

        // Remove old seats
        seatContainer.innerHTML = "";

        lastFocused = this;
        openModal(modal, modalContent);

    });

});

// ==============================
// BACK BUTTON
// ==============================

backButtons.forEach(button => {

    button.addEventListener("click", function() {

        if (this.dataset.back === "date") {
            showStep("date", true);
        }

        if (this.dataset.back === "time") {
            showStep("time", true);
        }

    });

});


// ==============================
// DATE
// ==============================

dateChips.addEventListener("click", function(event) {

    const chip = event.target.closest(".chip");

    if (!chip) {
        return;
    }

    selectedDate = chip.dataset.date;

    selectChip(dateChips, chip);

    console.log("Date:", selectedDate);

    showStep("time", true);

});


// ==============================
// TIME
// ==============================

timeChips.addEventListener("click", function(event) {

    const chip = event.target.closest(".chip");

    if (!chip) {
        return;
    }

    selectedTime = chip.dataset.time;

    selectChip(timeChips, chip);

    console.log("Time:", selectedTime);

    showStep("seats", true);

    seatContainer.innerHTML = "";

    seatError.textContent = "";

    selectedSeats = [];

    updateSeatSummary();

    // Create 30 seats, 6 per row with an aisle after every third seat
    for (let i = 1; i <= 30; i++) {

        const seat = document.createElement("button");

        seat.type = "button";

        seat.classList.add("seat");

        seat.textContent = i;

        seat.setAttribute("aria-label", "Seat " + i);
        seat.setAttribute("aria-pressed", "false");

        seat.addEventListener("click", function() {

            const seatNumber = Number(this.textContent);

            if (selectedSeats.includes(seatNumber)) {

                selectedSeats = selectedSeats.filter(
                    seat => seat !== seatNumber
                );

            } else {

                selectedSeats.push(seatNumber);

            }

            this.classList.toggle("selected");

            this.setAttribute(
                "aria-pressed",
                this.classList.contains("selected")
            );

            seatError.textContent = "";

            updateSeatSummary();

            console.log("Selected seats:", selectedSeats);

        });

        seatContainer.appendChild(seat);

        if (i % 6 === 3) {
            const aisle = document.createElement("span");
            aisle.className = "aisle";
            aisle.setAttribute("aria-hidden", "true");
            seatContainer.appendChild(aisle);
        }
    }
});


// ==============================
// RESERVE
// ==============================

reserveButton.addEventListener("click", function() {

    // Check if no seats were selected
    if (selectedSeats.length === 0) {

        seatError.textContent = "Please select at least one seat.";

        return;
    }

    // Only continue if a seat was selected

    reservationCode = generateReservationCode();

    console.log("Reservation Code:", reservationCode);


    // Put reservation code into receipt

    receiptCode.textContent = reservationCode;


    // Put reservation details into receipt

    receiptMovie.textContent = selectedMovie;

    receiptDate.textContent = formatDateFull(selectedDate);

    receiptTime.textContent = selectedTime;

    receiptSeats.textContent = sortedSeats().join(", ");

    copyButton.textContent = "Copy code";


    // Swap the reservation modal for the receipt. Focus returns to the
    // poster that opened the flow once the receipt is closed.

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

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

function generateReservationCode() {

    let code = "";

    code += letters[Math.floor(Math.random() * letters.length)];
    code += numbers[Math.floor(Math.random() * numbers.length)];
    code += letters[Math.floor(Math.random() * letters.length)];
    code += numbers[Math.floor(Math.random() * numbers.length)];
    code += letters[Math.floor(Math.random() * letters.length)];
    code += numbers[Math.floor(Math.random() * numbers.length)];
    code += letters[Math.floor(Math.random() * letters.length)];

    return code;
}

// ==============================
// VALIDATION
// ==============================

// BR-1: letter, digit, letter, digit, letter, digit, letter
function isValidFormat(code) {

    if (code.length !== 7) {
        return false;
    }

    for (let i = 0; i < code.length; i++) {

        const allowed = i % 2 === 0 ? letters : numbers;

        if (!allowed.includes(code[i])) {
            return false;
        }
    }

    return true;
}

function showResult(state, message) {

    validationResult.dataset.state = state;
    validationResult.textContent = message;
}

function validateReservationCode() {

    // BR-4: ignore spaces and letter case
    const code = inputCode.value.trim().toUpperCase();

    if (code === "") {
        showResult("empty", "Enter your reservation code.");
        return;
    }

    if (!isValidFormat(code)) {
        showResult("error", "That doesn't look right. Codes look like A1B2C3D.");
        return;
    }

    if (!reservationCode) {
        showResult("error", "No reservation has been made yet.");
        return;
    }

    if (code === reservationCode) {
        showResult("success", "Reservation code is valid!");
    } else {
        showResult("error", "No reservation found for that code.");
    }
}

document.getElementById("validatorForm").addEventListener("submit", function(event) {
    event.preventDefault();
    validateReservationCode();
});

inputCode.addEventListener("input", function() {
    showResult("", "");
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

// The inline script in <head> already chose the theme; sync the button label
setTheme(document.documentElement.dataset.theme);

themeToggle.addEventListener("click", function() {

    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";

    setTheme(next);

    try {
        localStorage.setItem("theme", next);
    } catch (error) {
        // private mode: the choice just lasts for this visit
    }
});

// Follow the operating system until the user picks a theme themselves
lightQuery.addEventListener("change", function(event) {

    if (!savedTheme()) {
        setTheme(event.matches ? "light" : "dark");
    }
});
