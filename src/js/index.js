'use-strict';

// importing the style file
import '../scss/style.scss';

// importing images

import '../assets/img/logo.png';

/*


* We will diverge from Jonas implementation using class based programming paradigm to a functional programming paradigm and make it all work. 

* Afterwards we will refactor all the code in to Jonas class based paradigm, so that we can see the similarities and differences in both project structures.


*/

// Globals for form inputs

const formContainer = document.querySelector('.form__container');
const formEl = document.querySelector('.form');
const workoutsContainer = document.querySelector('.workouts__container');
const workoutEl = document.querySelector('.workouts');
const typeSelection = document.querySelector('.form__input--type');
const distanceInput = document.querySelector('.form__input--distance');
const durationInput = document.querySelector('.form__input--duration');
const cadenceInput = document.querySelector('.form__input--cadence');
const elevationGainInput = document.querySelector('.form__input--elevation');

// Lets create a factory function here

const app = function (handleTrashbinListener) {
  // private variables
  let map;
  let mapEvent;
  const workoutZoomLevel = 13;
  const markers = new Map();
  // we need to the coords lat/lng from the users location
  const getGeoCoords = async function () {
    // if success
    const success = (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;

      const coords = [lat, lng];

      return coords;
    };

    // if error
    const error = (err) => {
      throw new Error(`ERROR(${err.code}: ${err.message})`);
    };

    //  returning a promise object to the function
    return new Promise((resolve, reject) => {
      // navigator.geolocation should be supported by the browser
      if (navigator.geolocation) {
        // this api has a getCurrentPosition method that takes in two arguments: a success and error

        navigator.geolocation.getCurrentPosition(
          (position) => resolve(success(position)),
          (err) => {
            reject(error(err));
          }
        );
      } else {
        reject(error('Geolocation is not supported by your browser.'));
      }
    });
  };

  // We need to create a function to render map

  const renderMap = function (coords) {
    // L is a global namespace that leaflet provides
    map = L.map('map').setView(coords, workoutZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
  };

  //   User clicks on map

  const mapOnClick = function (callback) {
    const newGeoCoords = (latlng) => {
      const { lat, lng } = latlng;

      const newCoords = [lat, lng];

      if (newCoords) {
        callback(newCoords);
      }
    };

    // The above renderMap function instantiates a map object in which there is event objects such as the listener function

    map.on('click', (mapE) => {
      // reassign to mapEvent
      mapEvent = mapE;

      console.log(mapEvent);

      //  invoke the function to pass in the latlng object
      newGeoCoords(mapEvent.latlng);
    });
  };

  //  The above function returns a newCoords array

  // Lets create a mapMarker function here

  const mapMarker = function (coords, workout) {
    if (!map) {
      throw new Error('Map not initialized');
    }

    try {
      const marker = L.marker(coords);
      marker.addTo(map);

      const popup = L.popup({
        maxWidth: 300,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      });

      marker.bindPopup(popup);
      marker.setPopupContent(workout.description);
      marker.openPopup();

      // A weakmap has been initialised as private variable
      markers.set(workout.id, marker);

      return marker;
    } catch (err) {
      throw new Error(`ERROR(${err.code}: ${err.message})`);
    }
  };

  const removeMapMarker = (workoutId) => {
    const marker = markers.get(workoutId);

    if (marker) {
      map.removeLayer(marker);
      markers.delete(workoutId);
    }
  };

  const showForm = function () {
    formContainer.classList.remove('form__hide');
    formEl.classList.add('active');
    formEl.classList.remove('visually-hide');
    workoutsContainer.classList.add('form__not-hidden');
  };

  const hideForm = function () {
    formContainer.classList.remove('form__hide');
    formEl.classList.remove('active');
    formEl.classList.add('visually-hide');
    workoutsContainer.classList.remove('form__not-hidden');
  };

  const renderWorkout = function (workout) {
    const workoutList = document.querySelector('.workouts');

    let html = `
    <li class="workout workout--${workout.type} [ grid-workout ]" data-id=${workout.id}>
    <div class="workout__trash">
    <i class='bx bx-trash'></i>
    </div>
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'}</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🕑</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    
    `;

    if (workout.type === 'running') {
      html += `
      

      <div class="workout__details">
              <span class="workout__icon">⚡</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
      
      `;
    }

    if (workout.type === 'cycling') {
      html += `
        
        <div class="workout__details">
        <span class="workout__icon">⚡</span>
        <span class="workout__value">${workout.speed}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🗻</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>

      `;
    }

    workoutList.insertAdjacentHTML('beforeend', html);

    // The callback function passed to this function will be executed when a workout is rendered
    handleTrashbinListener(removeMapMarker);
  };

  const moveToPopup = function (id, workouts) {
    const workout = workouts.find((work) => work.id === id);

    map.setView(workout.coords, workoutZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  };

  return {
    getGeoCoords,
    renderMap,
    mapOnClick,
    mapMarker,
    removeMapMarker,
    showForm,
    hideForm,
    renderWorkout,
    moveToPopup,
  };
};

const clearInputs = (...fields) => {
  fields.forEach((field) => {
    // because of eslint rule no-reassign
    const temp = field;

    // gaurd clause to check for null value
    if (temp) {
      temp.value = '';
    }
  });
};

// Checking the form selection type

const handleTypeChange = function () {
  typeSelection.addEventListener('change', () => {
    const selectedType = typeSelection.value;

    if (selectedType === 'running') {
      cadenceInput.parentElement.classList.remove('hidden');
      elevationGainInput.parentElement.classList.add('hidden');
    }

    if (selectedType === 'cycling') {
      cadenceInput.parentElement.classList.add('hidden');
      elevationGainInput.parentElement.classList.remove('hidden');
    }
  });
};

// Checking if all inputs are valid numerals
const validInputs = function (...inputs) {
  return inputs.every((inp) => Number.isFinite(inp));
};

// Checking if all inputs are positive numbers

const allPositive = function (...inputs) {
  return inputs.every((inp) => inp > 0);
};

const handleInputs = function (type, distance, duration, cadence, elevation) {
  if (type === 'running') {
    if (
      !validInputs(distance, duration, cadence) ||
      !allPositive(distance, duration, cadence)
    ) {
      throw new Error('Inputs for running must be positive numbers!');
    }
  } else if (type === 'cycling') {
    if (
      !validInputs(distance, duration, elevation) &&
      !allPositive(distance, duration)
    ) {
      throw new Error(
        'Inputs for distance and duration must be positive numbers!'
      );
    }
  }
};

const showModal = function (errorMsg) {
  const modal = document.getElementById('modal');
  const closeModal = document.querySelector('.modal__close');
  const modalMsg = document.querySelector('.modal__message');

  modal.classList.remove('hidden');
  formEl.classList.add('visually-hide');

  modalMsg.textContent = errorMsg;

  closeModal.onclick = function () {
    modal.classList.add('hidden');
  };

  window.onclick = function () {
    modal.classList.add('hidden');
  };
};

const createWorkoutObject = function (
  type,
  distance,
  duration,
  cadence,
  elevation,
  date,
  coords
) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let workout = {
    type,
    distance,
    duration,
    date,
    coords,
    id: '',
    description: '',
    pace: '',
    speed: '',
    elevationGain: '',
    setDescription() {
      this.description = `${this.type.charAt(0).toUpperCase()}${this.type.slice(1)} on ${this.date.getDate()} ${months[this.date.getMonth()]} ${this.date.getFullYear()}`;
    },
    calcPace() {
      this.pace = this.duration / this.distance;
      return this.pace;
    },
    calcSpeed() {
      this.speed = this.distance / (this.duration / 60);
      return this.speed;
    },
    calcElevationGain() {
      this.elevationGain = elevation;
      return this.elevationGain;
    },
    createId() {
      this.id = this.date
        .toISOString()
        .slice(-13, -1)
        .split(':')
        .join('')
        .split('.')
        .join('');
      return this.id;
    },
  };

  if (type === 'running') {
    workout.createId();
    workout.setDescription();
    workout.calcPace();
    workout = { ...workout, cadence };
  }

  if (type === 'cycling') {
    workout.createId();
    workout.setDescription();
    workout.calcSpeed();
    workout.calcElevationGain();
    workout = { ...workout, elevation };
  }

  return workout;
};

const createNewWorkout = function () {
  let workouts = [];

  const addWorkout = (workout) => {
    workouts = [...workouts, workout];
  };

  const saveToLocalStorage = () => {
    localStorage.setItem('workouts', JSON.stringify(workouts));
  };

  const getFromLocalStorage = () => {
    const data = JSON.parse(localStorage.getItem('workouts')) || [];

    if (!data) return;

    workouts = data;
  };

  const deleteFromLocalStorage = (workout) => {
    const workoutId = workout.dataset.id;

    const updatedWorkouts = workouts.filter((work) => work.id !== workoutId);

    workouts = updatedWorkouts;

    saveToLocalStorage();
  };

  const removeWorkoutFromDom = (workout) => {
    workout.remove();
  };

  const getWorkouts = () => workouts;

  return {
    addWorkout,
    saveToLocalStorage,
    getFromLocalStorage,
    deleteFromLocalStorage,
    removeWorkoutFromDom,
    getWorkouts,
  };
};

// Creating a closure here

const workoutManager = createNewWorkout();

const handleFormSubmit = function (event, newCoords, appInstance) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const type = formData.get('type');
  const distance = Number(formData.get('distance'));
  const duration = Number(formData.get('duration'));
  const cadence = Number(formData.get('cadence'));
  const elevation = Number(formData.get('elev-gain'));

  console.log(type, distance, duration, cadence, elevation);

  try {
    if (type === 'running') {
      handleInputs(type, distance, duration, cadence);
    } else if (type === 'cycling') {
      handleInputs(type, distance, duration, elevation);
    }

    // Create a date for the new workout

    const date = new Date();

    const newWorkout = createWorkoutObject(
      type,
      distance,
      duration,
      cadence,
      elevation,
      date,
      newCoords
    );

    console.log(newWorkout);

    workoutManager.addWorkout(newWorkout);
    workoutManager.saveToLocalStorage();

    const coords = newCoords;

    appInstance.renderWorkout(newWorkout);
    appInstance.mapMarker(coords, newWorkout);

    appInstance.hideForm();

    clearInputs(distanceInput, durationInput, cadenceInput, elevationGainInput);
  } catch (error) {
    showModal(error.message);
    clearInputs(distanceInput, durationInput, cadenceInput, elevationGainInput);
  }
};

const handleFormSubmitListener = function (event, newCoords, appInstance) {
  handleFormSubmit(event, newCoords, appInstance);
};

const handleTrashbinListener = (removeMapMarker) => {
  const trashbinEl = document.querySelectorAll(
    '.workout__trash > i.bx.bx-trash'
  );

  console.log(trashbinEl);

  if (trashbinEl) {
    trashbinEl.forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation(); // prevents the event from bubbling up to the parent element
        console.log(el.closest('.workout'));
        const workout = el.closest('.workout');
        const workoutId = workout.dataset.id;
        workoutManager.deleteFromLocalStorage(workout);
        workoutManager.removeWorkoutFromDom(workout);
        removeMapMarker(workoutId);
      });
    });
  }
};

const workoutListener = function (event, appInstance) {
  const workout = event.target.closest('.workout');

  // gaurd clause
  if (!workout) return;

  const workoutId = workout.dataset.id;

  const allWorkouts = workoutManager.getWorkouts();

  appInstance.moveToPopup(workoutId, allWorkouts);
};

const init = async () => {
  // Creating an instance of the app function that returns an object with all the methods and properties
  const appInstance = app((removeMapMarker) => {
    // a callback function here to pass in the removeMapMarker function to handleTrashbinListener function
    handleTrashbinListener(removeMapMarker);
  });

  // Lets wrap the rest of the code within a try catch block, to await the Promise object to either resolve or reject

  try {
    const coords = await appInstance.getGeoCoords();
    appInstance.renderMap(coords);

    // Listening to the workout list element; when user clicks a workout in the list, map will be repositioned to the map marker

    workoutEl.addEventListener('click', (event) =>
      workoutListener(event, appInstance)
    );
    // Listening to the map element; when the user clicks on the map, the form will be shown: this is a callback function, whene triggered the newCoords will be passed as an argument to the mapOnClick function
    appInstance.mapOnClick((newCoords) => {
      // show the form when the user clicks on the map

      appInstance.showForm();
      // listens to the form input type and changes the workout type
      handleTypeChange();

      //  the option once:true ensures that the event listener is immediately removed once added
      formEl.addEventListener(
        'submit',
        (event) => handleFormSubmitListener(event, newCoords, appInstance),
        { once: true }
      );
    });

    // Workouts in localStorage will be retrieved and rendered again on the map, when the browser is reloaded. This needs to be done after the map is rendered and before the mapOnClick function is called.

    workoutManager.getFromLocalStorage();

    const storedWorkouts = workoutManager.getWorkouts();

    if (storedWorkouts.length > 0) {
      storedWorkouts.forEach((workout) => {
        appInstance.renderWorkout(workout);
        appInstance.mapMarker(workout.coords, workout);
      });
    }
  } catch (error) {
    showModal(error.message);
  }
};

init();
