const movies = document.querySelectorAll(".movie");

const modal = document.getElementById("movieModal");
const modalTitle = document.getElementById("modalTitle");

const dateSection = document.getElementById("dateSection");
const timeSection = document.getElementById("timeSection");
const seatSection = document.getElementById("seatSection");

const dateSelect = document.getElementById("dateSelect");
const timeSelect = document.getElementById("timeSelect");
const backButtons = document.querySelectorAll(".backButton");

const seatContainer = document.getElementById("seatContainer");

const reserveButton = document.getElementById("reserveButton");

const receiptModal = document.getElementById("receiptModal");

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


// ==============================
// MOVIE
// ==============================

const today = new Date();

for (let i = 0; i < 30; i++) {

    const date = new Date(today);

    date.setDate(today.getDate() + i);

    const option = document.createElement("option");

    option.value = date.toISOString().split("T")[0];

    option.textContent = date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric"
    });

    dateSelect.appendChild(option);
}


movies.forEach(movie => {

    movie.addEventListener("click", function() {

        selectedMovie = this.dataset.movie;

        modalTitle.textContent = selectedMovie;

        console.log("Movie:", selectedMovie);

        // Reset previous choices
        selectedDate = null;
        selectedTime = null;
        selectedSeats = [];

        // Reset sections
        dateSection.style.display = "block";
        timeSection.style.display = "none";
        seatSection.style.display = "none";

        // Remove old seats
        seatContainer.innerHTML = "";

        // Open modal
        modal.style.display = "block";

    });

});

// ==============================
// BACK BUTTON
// ==============================

backButtons.forEach(button => {

    button.addEventListener("click", function() {

        if (this.dataset.back === "date") {
            timeSection.style.display = "none";
            dateSection.style.display = "block";
        }

        if (this.dataset.back === "time") {
            seatSection.style.display = "none";
            timeSection.style.display = "block";
        }

    });

});


// ==============================
// DATE
// ==============================

dateSelect.addEventListener("change", function() {

    selectedDate = this.value;

    console.log("Date:", selectedDate);

    if (selectedDate !== "") {
        dateSection.style.display = "none";
        timeSection.style.display = "block";
    }

});


// ==============================
// TIME
// ==============================

timeSelect.addEventListener("change", function() {

    selectedTime = this.value;

    console.log("Time:", selectedTime);

    if (selectedTime !== "") {

        timeSection.style.display = "none";

        seatSection.style.display = "block";

        seatContainer.innerHTML = "";

        selectedSeats = [];

        // Create 30 seats
        for (let i = 1; i <= 30; i++) {

            const seat = document.createElement("button");

            seat.classList.add("seat");

            seat.textContent = i;

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

                console.log("Selected seats:", selectedSeats);

            });

            seatContainer.appendChild(seat);
        }
    }
});


// ==============================
// RESERVE
// ==============================

reserveButton.addEventListener("click", function() {

    // Check if no seats were selected
    if (selectedSeats.length === 0) {

        alert("Please select at least one seat.");

        return;
    }

    // Only continue if a seat was selected

    reservationCode = generateReservationCode();

    console.log("Reservation Code:", reservationCode);


    // Put reservation code into receipt

    receiptCode.textContent = reservationCode;


    // Put reservation details into receipt

    receiptMovie.textContent = "Movie: " + selectedMovie;

    receiptDate.textContent = "Date: " + selectedDate;

    receiptTime.textContent = "Time: " + selectedTime;

    receiptSeats.textContent =
        "Seats: " + selectedSeats.join(", ");


    // Close reservation modal

    modal.style.display = "none";


    // Open receipt modal

    receiptModal.style.display = "block";

});

okButton.addEventListener("click", function() {

    receiptModal.style.display = "none";

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

console.log(reservationCode)



function isValidFormat() {

    for (let char = 0; char < inputCode.value.length; char++) {

        if (char % 2 == 0) {

            if (letters.includes(inputCode.value[char])) {
                console.log("is a letter(correct format)");
            }
            else {
                console.log("wrong format");
            }

        }
        else {

            if (numbers.includes(inputCode.value[char])) {
                console.log("is a number(correct format)");
            }
            else {
                console.log("wrong format");
            }

        }
    }
}

function validateReservationCode() {
    isValidFormat();

    if (inputCode.value === reservationCode) {
        console.log("validation success\n");
        validationResult.textContent = "Reservation code is valid!";
    } else {
        console.log("validation failed\n");
        validationResult.textContent = "Invalid reservation code.";
    }
}

validateButton.addEventListener("click", validateReservationCode);

