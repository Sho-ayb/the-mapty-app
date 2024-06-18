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

const formEl = document.querySelector('.form');
const workoutEl = document.querySelector('.workouts');
const typeSelection = document.querySelector('.form__input--type');
const distanceInput = document.querySelector('.form__input--distance');
const durationInput = document.querySelector('.form__input--duration');
const cadenceInput = document.querySelector('.form__input--cadence');
const elevationGainInput = document.querySelector('.form__input--elevation');

// Lets create a factory function here

const app = function () {
  // private variables
  let map;
  let mapEvent;
  const workoutZoomLevel = 13;
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

    // navigator.geolocation should be supported by the browser
    if (navigator.geolocation) {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      return success(position);
    }

    return error('Geolocation is not supported by this browser.');
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
    // const { lat, lng } = coords;

    L.marker(coords)
      .addTo(map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(workout.description)
      .openPopup();
  };

  const showForm = function () {
    formEl.classList.remove('visually-hide');
  };

  const renderWorkout = function (workout) {
    const workoutList = document.querySelector('.workouts');

    let html = `
    
    <li class="workout workout--${workout.type} [ grid-workout ]" data-id=${workout.id} >
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
    showForm,
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

  const getWorkouts = () => workouts;

  return {
    addWorkout,
    saveToLocalStorage,
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

    appInstance.mapMarker(coords, newWorkout);
    appInstance.renderWorkout(newWorkout);

    formEl.classList.add('visually-hide');

    clearInputs(distanceInput, durationInput, cadenceInput, elevationGainInput);
  } catch (error) {
    showModal(error.message);
    clearInputs(distanceInput, durationInput, cadenceInput, elevationGainInput);
  }
};

const handleFormSubmitListener = function (event, newCoords, appInstance) {
  handleFormSubmit(event, newCoords, appInstance);
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
  const appInstance = app();
  const coords = await appInstance.getGeoCoords();
  appInstance.renderMap(coords);
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

    // Listening to the workout list element; when user clicks a workout in the list, map will be repositioned to the map marker

    workoutEl.addEventListener('click', (event) =>
      workoutListener(event, appInstance)
    );
  });
};

init();
