/* =====================================
   OJT ATTENDANCE CALCULATOR
===================================== */


// TARGET HOURS

const targetHours = 300;


// GET ALL HOURS INPUT

const hourInputs =
  document.querySelectorAll(".hours-input");


// SUMMARY ELEMENTS

const targetHoursElement =
  document.getElementById("targetHours");


const totalRenderedElement =
  document.getElementById("totalRendered");


const remainingHoursElement =
  document.getElementById("remainingHours");



/* =====================================
   CONVERT HOURS TO MINUTES
===================================== */

function convertToMinutes(value) {


  value = value.trim();


  // EMPTY = ZERO

  if (value === "") {
    return 0;
  }


  // EXAMPLE:
  // 8 = 8 HOURS

  if (!value.includes(":")) {


    const hours =
      Number(value);


    if (
      isNaN(hours) ||
      hours < 0
    ) {
      return 0;
    }


    return hours * 60;

  }


  // EXAMPLE:
  // 8:30 = 8 HOURS 30 MINUTES

  const parts =
    value.split(":");


  const hours =
    Number(parts[0]);


  const minutes =
    Number(parts[1]);


  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    minutes < 0 ||
    minutes >= 60
  ) {

    return 0;

  }


  return (
    hours * 60
    +
    minutes
  );

}



/* =====================================
   FORMAT TIME
===================================== */

function formatTime(totalMinutes) {


  const hours =
    Math.floor(totalMinutes / 60);


  const minutes =
    totalMinutes % 60;


  return (
    hours
    +
    ":"
    +
    String(minutes).padStart(2, "0")
    +
    ":00"
  );

}



/* =====================================
   UPDATE ATTENDANCE
===================================== */

function updateAttendance() {


  let totalMinutes = 0;


  // CHECK ALL INPUTS

  hourInputs.forEach(function (input) {


    const value =
      input.value.trim();


    const minutes =
      convertToMinutes(value);


    // ADD TO TOTAL

    totalMinutes += minutes;


    // GET ROW

    const row =
      input.closest(".calendar-row");


    // GET STATUS

    const status =
      row.querySelector(".status-value");


    /* =============================
       IF EMPTY OR ZERO
       = ABSENT
    ============================= */

    if (
      value === ""
      ||
      minutes === 0
    ) {


      status.textContent =
        "ABSENT";


      status.classList.remove("ojt");


      status.classList.add("absent");

    }


    /* =============================
       IF NOT ZERO
       = OJT
    ============================= */

    else {


      status.textContent =
        "OJT";


      status.classList.remove("absent");


      status.classList.add("ojt");

    }


  });



  /* =============================
     TARGET MINUTES
  ============================= */

  const targetMinutes =
    targetHours * 60;



  /* =============================
     REMAINING HOURS
  ============================= */

  let remainingMinutes =
    targetMinutes
    -
    totalMinutes;



  // DO NOT SHOW NEGATIVE

  if (remainingMinutes < 0) {

    remainingMinutes = 0;

  }



  /* =============================
     UPDATE SUMMARY
  ============================= */


  targetHoursElement.textContent =
    formatTime(targetMinutes);


  totalRenderedElement.textContent =
    formatTime(totalMinutes);


  remainingHoursElement.textContent =
    formatTime(remainingMinutes);


}



/* =====================================
   UPDATE WHILE TYPING
===================================== */

hourInputs.forEach(function (input) {


  input.addEventListener(
    "input",
    updateAttendance
  );


});



/* =====================================
   RUN WHEN WEBSITE OPENS
===================================== */

updateAttendance();
