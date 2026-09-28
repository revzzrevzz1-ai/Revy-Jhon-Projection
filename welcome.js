/* =========================================
   WELCOME / LOGIN LOGIC
========================================= */

/* This is the email of the ONE Firebase user account
   (the one you created in Authentication > Users).
   The password field on the login screen is checked
   against THIS account, so whoever knows the password
   can log in from the desktop app or the website and
   see/edit the same data. */
const OWNER_EMAIL = "ochearevyjhon@gmail.com";


/* =========================================
   ELEMENTS
========================================= */

const welcomeScreen = document.getElementById("welcomeScreen");
const appContainer = document.getElementById("appContainer");
const welcomeNameInput = document.getElementById("welcomeNameInput");
const welcomePasswordInput = document.getElementById("welcomePasswordInput");
const welcomeEnterBtn = document.getElementById("welcomeEnterBtn");
const welcomeError = document.getElementById("welcomeError");
const studentNameDisplay = document.getElementById("studentNameDisplay");
const changeNameBtn = document.getElementById("changeNameBtn");

const loginCard = document.querySelector("#welcomeScreen .login-card");
const rootElement = document.documentElement;

let leaveAnimation = null;


/* =========================================
   WINDOW BUTTONS (Electron only)
========================================= */

function callElectron(method) {

    if (
        window.electronAPI &&
        typeof window.electronAPI[method] === "function"
    ) {
        window.electronAPI[method]();
    }

}

document.getElementById("closeBtn").addEventListener("click", function () {
    callElectron("closeWindow");
});

document.getElementById("loginCloseBtn").addEventListener("click", function () {
    callElectron("closeWindow");
});

document.getElementById("minBtn").addEventListener("click", function () {
    callElectron("minimizeWindow");
});


/* =========================================
   ANIMATION HELPERS
========================================= */

/* Wrong / missing input: quick side-to-side shake */
function shakeCard() {

    if (!loginCard || !loginCard.animate) return;

    loginCard.animate(
        [
            { transform: "translateX(0)" },
            { transform: "translateX(-8px)" },
            { transform: "translateX(7px)" },
            { transform: "translateX(-5px)" },
            { transform: "translateX(3px)" },
            { transform: "translateX(0)" }
        ],
        { duration: 420, easing: "ease-in-out" }
    );

}


/* Successful login: card shrinks and fades away */
function playLeaveAnimation() {

    if (!loginCard || !loginCard.animate) return;

    leaveAnimation = loginCard.animate(
        [
            { opacity: 1, transform: "scale(1)" },
            { opacity: 0, transform: "scale(0.94) translateY(12px)" }
        ],
        {
            duration: 320,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "forwards"
        }
    );

}


function resetLoginCard() {

    if (leaveAnimation) {
        leaveAnimation.cancel();
        leaveAnimation = null;
    }

    welcomeEnterBtn.disabled = false;
    welcomeEnterBtn.classList.remove("is-loading");

}


function showError(message, field) {

    welcomeError.textContent = message;

    shakeCard();

    if (field) field.focus();

}


/* =========================================
   DASHBOARD INTRO
   - progress bar fills up
   - attendance list scrolls to today's row
========================================= */

function playDashboardIntro() {

    const fill = document.getElementById("progressFill");
    const finalWidth = fill.style.width;

    fill.style.width = "0%";

    setTimeout(function () {
        fill.style.width = finalWidth;
    }, 250);


    const todayRow = document.querySelector(".attendance-table tr.today-row");

    if (!todayRow) return;

    const column = todayRow.closest('[class*="col-"]');

    if (!column) return;

    setTimeout(function () {

        const rowBox = todayRow.getBoundingClientRect();
        const columnBox = column.getBoundingClientRect();

        column.scrollTo({
            top:
                column.scrollTop
                + (rowBox.top - columnBox.top)
                - (column.clientHeight / 2)
                + (rowBox.height / 2),
            behavior: "smooth"
        });

    }, 450);

}


/* =========================================
   SHOW DASHBOARD
========================================= */

function showDashboard(name) {

    studentNameDisplay.textContent = name;

    playLeaveAnimation();

    welcomeScreen.classList.add("fade-out");

    setTimeout(function () {

        welcomeScreen.classList.add("d-none");

        /* transparent login background -> normal gradient background */
        rootElement.classList.remove("login-mode");

        appContainer.classList.remove("d-none");

        /* TELL ELECTRON TO EXPAND */
        if (
            window.electronAPI &&
            typeof window.electronAPI.expandWindow === "function"
        ) {
            window.electronAPI.expandWindow();
        }

        /* REVEAL HEADER + CONTENT (the CSS starts them hidden) */
        setTimeout(function () {
            document.getElementById("mainHeader").classList.add("app-visible");
            document.getElementById("mainContent").classList.add("app-visible");
            playDashboardIntro();
        }, 30);

    }, 350);

}


/* =========================================
   SHOW LOGIN AGAIN
========================================= */

function showWelcomeScreen() {

    appContainer.classList.add("d-none");

    document.getElementById("mainHeader").classList.remove("app-visible");
    document.getElementById("mainContent").classList.remove("app-visible");

    resetLoginCard();

    if (window.electronAPI) {
        rootElement.classList.add("login-mode");
    }

    /* removing d-none replays the card's opening animation */
    welcomeScreen.classList.remove("d-none");
    welcomeScreen.classList.remove("fade-out");

    welcomeNameInput.value = "";
    welcomePasswordInput.value = "";
    welcomeError.textContent = "";

    /* also sign out of Firebase so a new login is required */
    if (typeof auth !== "undefined") {
        auth.signOut();
    }
    window.currentUid = null;

    /* SHRINK ELECTRON WINDOW */
    if (
        window.electronAPI &&
        typeof window.electronAPI.shrinkWindow === "function"
    ) {
        window.electronAPI.shrinkWindow();
    }

    welcomeNameInput.focus();

}


/* =========================================
   LOGIN
   (now checks the password against the real
   Firebase account instead of a local constant)
========================================= */

async function handleEnter() {

    const name = welcomeNameInput.value.trim();
    const password = welcomePasswordInput.value.trim();

    /* NAME EMPTY */
    if (name === "") {
        showError("Please enter your name to continue.", welcomeNameInput);
        return;
    }

    /* PASSWORD EMPTY */
    if (password === "") {
        showError("Please enter the password.", welcomePasswordInput);
        return;
    }

    welcomeError.textContent = "";
    welcomeEnterBtn.disabled = true;
    welcomeEnterBtn.classList.add("is-loading");

    try {

        const credential = await auth.signInWithEmailAndPassword(OWNER_EMAIL, password);

        /* this uid is now the SAME everywhere this account
           logs in, which is what makes the Firestore sync
           between the desktop app and the website work */
        window.currentUid = credential.user.uid;

        document.dispatchEvent(new Event("firebaseReady"));

        showDashboard(name);

    } catch (error) {

        welcomeEnterBtn.disabled = false;
        welcomeEnterBtn.classList.remove("is-loading");

        welcomePasswordInput.value = "";
        showError("Incorrect password. Please try again.", welcomePasswordInput);

        console.error("Firebase login failed:", error.code, error.message);

    }

}


/* =========================================
   ENTER BUTTON
========================================= */

welcomeEnterBtn.addEventListener("click", handleEnter);


/* =========================================
   NAME ENTER KEY
========================================= */

welcomeNameInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        welcomePasswordInput.focus();
    }
});


/* =========================================
   PASSWORD ENTER KEY
========================================= */

welcomePasswordInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        handleEnter();
    }
});


/* =========================================
   CHANGE NAME
========================================= */

changeNameBtn.addEventListener("click", showWelcomeScreen);


/* =========================================
   START
========================================= */

(function init() {

    /* Running inside Electron? The window is transparent + rounded. */
    if (window.electronAPI) {
        rootElement.classList.add("electron-window", "login-mode");
    }

    appContainer.classList.add("d-none");

    welcomeScreen.classList.remove("d-none");

    welcomeNameInput.focus();

})();