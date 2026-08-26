/* =====================================
   OJT ATTENDANCE CALCULATOR
===================================== */


/* =====================================
   TARGET HOURS
===================================== */

const targetHours = 300;


/* =====================================
   GET ALL HOURS INPUT
===================================== */

const hourInputs =
  document.querySelectorAll(".hours-input");


/* =====================================
   SUMMARY ELEMENTS
===================================== */

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


  /* =====================================
     EMPTY VALUE
  ===================================== */

  if (value === "") {

    return {

      valid: true,

      minutes: 0,

      empty: true

    };

  }


  /* =====================================
     HOURS ONLY

     EXAMPLES:

     8
     5
     10
  ===================================== */

  if (!value.includes(":")) {


    const hours =
      Number(value);


    /* =====================================
       INVALID
    ===================================== */

    if (

      isNaN(hours) ||

      hours < 0 ||

      !Number.isInteger(hours)

    ) {

      return {

        valid: false,

        minutes: 0,

        empty: false

      };

    }


    return {

      valid: true,

      minutes: hours * 60,

      empty: false

    };

  }


  /* =====================================
     HOURS WITH MINUTES

     VALID:

     8:00
     8:20
     7:30

     INVALID:

     8:60
     8:61
     8:99
  ===================================== */

  const parts =
    value.split(":");


  /* =====================================
     ONLY ONE COLON ALLOWED
  ===================================== */

  if (parts.length !== 2) {

    return {

      valid: false,

      minutes: 0,

      empty: false

    };

  }


  const hoursPart =
    parts[0];


  const minutesPart =
    parts[1];


  /* =====================================
     BOTH PARTS REQUIRED
  ===================================== */

  if (

    hoursPart === "" ||

    minutesPart === ""

  ) {

    return {

      valid: false,

      minutes: 0,

      empty: false

    };

  }


  const hours =
    Number(hoursPart);


  const minutes =
    Number(minutesPart);


  /* =====================================
     VALIDATION

     MINUTES MUST BE:

     00 TO 59
  ===================================== */

  if (

    isNaN(hours) ||

    isNaN(minutes) ||

    hours < 0 ||

    minutes < 0 ||

    minutes >= 60 ||

    !Number.isInteger(hours) ||

    !Number.isInteger(minutes)

  ) {

    return {

      valid: false,

      minutes: 0,

      empty: false

    };

  }


  /* =====================================
     VALID TIME
  ===================================== */

  return {

    valid: true,

    minutes:
      (hours * 60) +
      minutes,

    empty: false

  };

}


/* =====================================
   FORMAT TIME

   EXAMPLES:

   300 HOURS
   = 300:00:00

   8 HOURS 20 MINUTES
   = 8:20:00
===================================== */

function formatTime(totalMinutes) {


  const hours =
    Math.floor(totalMinutes / 60);


  const minutes =
    totalMinutes % 60;


  return (

    hours +

    ":" +

    String(minutes).padStart(2, "0") +

    ":00"

  );

}


/* =====================================
   UPDATE ATTENDANCE
===================================== */

function updateAttendance() {


  let totalMinutes = 0;


  /* =====================================
     CHECK EVERY INPUT
  ===================================== */

  hourInputs.forEach(function (input) {


    const value =
      input.value.trim();


    /* =====================================
       CONVERT INPUT
    ===================================== */

    const result =
      convertToMinutes(value);


    /* =====================================
       GET CURRENT ROW
    ===================================== */

    const row =
      input.closest(".calendar-row");


    /* =====================================
       GET STATUS
    ===================================== */

    const status =
      row.querySelector(".status-value");


    /* =====================================
       INVALID

       EXAMPLES:

       8:60
       8:61
       8:99
       abc
       8::20
    ===================================== */

    if (!result.valid) {


      status.textContent =
        "INVALID";


      status.classList.remove(
        "ojt"
      );


      status.classList.remove(
        "absent"
      );


      status.classList.add(
        "invalid"
      );


      /*
        INVALID HOURS ARE NOT
        ADDED TO TOTAL RENDERED
      */

      return;

    }


    /* =====================================
       EMPTY OR ZERO

       EMPTY
       0
       0:00

       = ABSENT
    ===================================== */

    if (

      result.empty ||

      result.minutes === 0

    ) {


      status.textContent =
        "ABSENT";


      status.classList.remove(
        "ojt"
      );


      status.classList.remove(
        "invalid"
      );


      status.classList.add(
        "absent"
      );


      return;

    }


    /* =====================================
       VALID AND NOT ZERO

       = OJT
    ===================================== */

    status.textContent =
      "OJT";


    status.classList.remove(
      "absent"
    );


    status.classList.remove(
      "invalid"
    );


    status.classList.add(
      "ojt"
    );


    /* =====================================
       ADD VALID HOURS ONLY
    ===================================== */

    totalMinutes +=
      result.minutes;


  });


  /* =====================================
     TARGET HOURS IN MINUTES
  ===================================== */

  const targetMinutes =
    targetHours * 60;


  /* =====================================
     COMPUTE REMAINING HOURS
  ===================================== */

  let remainingMinutes =
    targetMinutes -
    totalMinutes;


  /* =====================================
     DO NOT ALLOW NEGATIVE
  ===================================== */

  if (remainingMinutes < 0) {

    remainingMinutes = 0;

  }


  /* =====================================
     UPDATE TARGET HOURS
  ===================================== */

  targetHoursElement.textContent =
    formatTime(targetMinutes);


  /* =====================================
     UPDATE TOTAL RENDERED
  ===================================== */

  totalRenderedElement.textContent =
    formatTime(totalMinutes);


  /* 
     UPDATE REMAINING HOURS
*/

  remainingHoursElement.textContent =
    formatTime(remainingMinutes);


}


/* 
   UPDATE WHILE USER IS TYPING
 */

hourInputs.forEach(function (input) {


  input.addEventListener(

    "input",

    updateAttendance

  );


});


/*
   RUN WHEN WEBSITE OPENS
 */

updateAttendance();
