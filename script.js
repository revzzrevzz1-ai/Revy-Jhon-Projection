/* =========================================
   OJT ATTENDANCE CALCULATOR
========================================= */

const TARGET_MINUTES = 300 * 60;


/* =========================================
   CONVERT HH:MM TO MINUTES
========================================= */

function convertToMinutes(value) {

    value = value.trim();

    if (value === "") {
        return { valid: true, minutes: 0, empty: true };
    }

    const match = value.match(/^(\d{2}):(\d{2})$/);

    if (!match) {
        return { valid: false, minutes: 0, empty: false };
    }

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    /* MINUTES 00-59 */
    if (minutes > 59) {
        return { valid: false, minutes: 0, empty: false };
    }

    /* HOURS 00-24 */
    if (hours > 24) {
        return { valid: false, minutes: 0, empty: false };
    }

    return {
        valid: true,
        minutes: (hours * 60) + minutes,
        empty: false
    };

}


/* =========================================
   FORMAT HH:MM
========================================= */

function formatTimeInput(input) {

    let value = input.value;

    /* NUMBERS ONLY */
    value = value.replace(/\D/g, "");

    /* MAX 4 DIGITS */
    value = value.substring(0, 4);

    /* ADD COLON */
    if (value.length > 2) {
        value = value.substring(0, 2) + ":" + value.substring(2);
    }

    input.value = value;

}


/* =========================================
   UPDATE STATUS
========================================= */

function updateStatus(input) {

    const row = input.closest("tr");

    if (!row) return;

    const statusCell = row.querySelector(".status-cell");

    if (!statusCell) return;

    const result = convertToMinutes(input.value);

    statusCell.classList.remove(
        "present-status",
        "absent-status",
        "invalid-status"
    );

    /* INVALID */
    if (!result.valid) {
        statusCell.textContent = "INVALID";
        statusCell.classList.add("invalid-status");
        return;
    }

    /* 00:00 */
    if (result.minutes === 0) {
        statusCell.textContent = "ABSENT";
        statusCell.classList.add("absent-status");
        return;
    }

    /* 00:01 - 24:59
       If the cell has a data-note (custom note), show it
       instead of the plain word PRESENT. */
    statusCell.textContent = statusCell.dataset.note || "PRESENT";
    statusCell.classList.add("present-status");

}


/* =========================================
   CALCULATE TOTAL
========================================= */

function updateSummary() {

    let totalMinutes = 0;
    let daysPresent = 0;
    let daysAbsent = 0;

    document
        .querySelectorAll(".hours-input")
        .forEach(function (input) {

            const result = convertToMinutes(input.value);

            if (result.valid) {

                totalMinutes += result.minutes;

                if (result.minutes > 0) {
                    daysPresent++;
                } else {
                    daysAbsent++;
                }

            }

        });

    const remainingMinutes = Math.max(TARGET_MINUTES - totalMinutes, 0);

    document.getElementById("targetHours").textContent =
        formatSummaryTime(TARGET_MINUTES);

    document.getElementById("totalRendered").textContent =
        formatSummaryTime(totalMinutes);

    document.getElementById("remainingHours").textContent =
        formatSummaryTime(remainingMinutes);


    /* PROGRESS BAR + DAY COUNTS */

    const percent = Math.min(
        Math.round((totalMinutes / TARGET_MINUTES) * 100),
        100
    );

    document.getElementById("progressPercent").textContent = percent + "%";
    document.getElementById("progressFill").style.width = percent + "%";

    document.getElementById("daysPresent").textContent = daysPresent;
    document.getElementById("daysAbsent").textContent = daysAbsent;

    document.getElementById("avgHours").textContent =
        daysPresent > 0
            ? (totalMinutes / 60 / daysPresent).toFixed(1)
            : "0.0";

}


/* =========================================
   HIGHLIGHT TODAY (table row + planner day)
========================================= */

function highlightToday() {

    const now = new Date();

    const monthNames = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];

    const dayNames = [
        "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY",
        "THURSDAY", "FRIDAY", "SATURDAY"
    ];

    /* e.g. "SEP 21, 2026" (same format as the table) */
    const todayText =
        monthNames[now.getMonth()]
        + " "
        + String(now.getDate()).padStart(2, "0")
        + ", "
        + now.getFullYear();

    document
        .querySelectorAll(".attendance-table tbody tr")
        .forEach(function (row) {

            const dateCell = row.querySelector("td");

            row.classList.toggle(
                "today-row",
                !!dateCell && dateCell.textContent.trim() === todayText
            );

        });

    document
        .querySelectorAll(".day-row")
        .forEach(function (row) {

            const dayName = row.querySelector(".day-name");

            row.classList.toggle(
                "is-today",
                !!dayName &&
                dayName.textContent.trim().startsWith(dayNames[now.getDay()])
            );

        });

}


/* =========================================
   FORMAT SUMMARY
========================================= */

function formatSummaryTime(totalMinutes) {

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return (
        String(hours).padStart(2, "0")
        + ":"
        + String(minutes).padStart(2, "0")
        + ":00"
    );

}


/* =========================================
   FIRESTORE: DATE KEY

   Firestore field paths (used with update()) treat "."
   as a nesting separator, so we turn the visible date
   text ("AUG 17, 2026") into a safe key ("AUG_17_2026")
   before storing or reading it as a field name.
========================================= */

function dateKeyFromRow(input) {

    const row = input.closest("tr");

    if (!row) return null;

    const dateCell = row.querySelector("td");

    if (!dateCell) return null;

    return dateCell.textContent.trim().replace(/[^A-Za-z0-9]/g, "_");

}


/* =========================================
   FIRESTORE: SAVE ONE DAY'S HOURS

   Stored at:  users/{uid}  ->  field "attendance"
               attendance.<dateKey> = "08:00"

   This matches the security rule:
     match /users/{uid} {
       allow read, write: if request.auth.uid == uid;
     }
========================================= */

function saveHoursToFirestore(input) {

    /* not signed in yet (Firebase still connecting) -> skip silently,
       updateSummary() below already keeps the on-screen totals correct */
    if (!window.currentUid || typeof db === "undefined") return;

    const key = dateKeyFromRow(input);

    if (!key) return;

    const value = input.value;

    db.collection("users").doc(window.currentUid)
        .update({ [`attendance.${key}`]: value })
        .catch(function () {

            /* update() fails if the document doesn't exist yet ->
               create it instead */
            db.collection("users").doc(window.currentUid)
                .set({ attendance: { [key]: value } }, { merge: true })
                .catch(function (error) {
                    console.error("Failed to save attendance:", error);
                });

        });

}


/* =========================================
   FIRESTORE: LOAD SAVED HOURS

   Runs once Firebase has signed the user in. Pulls the
   saved "attendance" map and applies it on top of the
   hardcoded HTML values, then refreshes every status
   cell and the summary panel.
========================================= */

function loadHoursFromFirestore() {

    if (!window.currentUid || typeof db === "undefined") return;

    db.collection("users").doc(window.currentUid).get()
        .then(function (doc) {

            const data = doc.exists ? doc.data() : {};
            const attendance = data.attendance || {};

            document
                .querySelectorAll(".hours-input")
                .forEach(function (input) {

                    const key = dateKeyFromRow(input);

                    if (key && attendance[key] !== undefined) {
                        input.value = attendance[key];
                    }

                    updateStatus(input);

                });

            updateSummary();

        })
        .catch(function (error) {
            console.error("Failed to load attendance from Firestore:", error);
        });

}


/* =========================================
   INITIALIZE HOURS INPUTS
========================================= */

document
    .querySelectorAll(".hours-input")
    .forEach(function (input) {


        /* ================================
           INPUT
        ================================= */

        input.addEventListener("input", function () {

            formatTimeInput(this);
            updateStatus(this);
            updateSummary();

        });


        /* ================================
           KEYBOARD
        ================================= */

        input.addEventListener("keydown", function (event) {

            const allowedKeys = [
                "Backspace",
                "Delete",
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown",
                "Home",
                "End",
                "Tab"
            ];

            if (allowedKeys.includes(event.key)) {
                return;
            }

            /* ONLY NUMBERS */
            if (!/^[0-9]$/.test(event.key)) {
                event.preventDefault();
            }

        });


        /* ================================
           PASTE
        ================================= */

        input.addEventListener("paste", function (event) {

            event.preventDefault();

            const pasted = event.clipboardData.getData("text");

            let numbers = pasted
                .replace(/\D/g, "")
                .substring(0, 4);

            if (numbers.length > 2) {
                numbers = numbers.substring(0, 2) + ":" + numbers.substring(2);
            }

            this.value = numbers;

            updateStatus(this);
            updateSummary();
            saveHoursToFirestore(this);

        });


        /* ================================
           BLUR
           (this is when we save to Firestore -
           after the user finishes typing/editing
           a cell, not on every keystroke)
        ================================= */

        input.addEventListener("blur", function () {

            let value = this.value.trim();

            /* 8:00 -> 08:00 */
            if (/^\d:\d{2}$/.test(value)) {
                this.value = "0" + value;
            }

            updateStatus(this);
            updateSummary();
            saveHoursToFirestore(this);

        });


        /* ================================
           INITIAL STATUS
        ================================= */

        updateStatus(input);

    });


/* =========================================
   INITIAL SUMMARY
========================================= */

updateSummary();

highlightToday();


/* =========================================
   WAIT FOR FIREBASE, THEN LOAD SAVED DATA

   firebase-init.js fires "firebaseReady" once
   signInAnonymously() finishes. If that already
   happened before this script ran (unlikely, but
   possible on a fast connection), currentUid will
   already be set, so we load right away too.
========================================= */

document.addEventListener("firebaseReady", function () {
    loadHoursFromFirestore();
});

if (window.currentUid) {
    loadHoursFromFirestore();
}
