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

/*

* The following code is a refactor of the functional programming paradigm which can be found in the main branch, we  diverge from this paradigm to a class based paradigm just so we can see the difference between the two.

* The functional programming paradigm is the one that is used in the main branch.


*/

// The workout object

class Workout {
  date = new Date();

  id = this.date
    .toISOString()
    .split(/[-:T.Z]/)
    .join('')
    .slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    console.log('Id: ', this.id);

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on  ${this.date.getDate()} ${months[this.date.getMonth()]} ${this.date.getFullYear()}`;
  }
}

// The Running class extends the Workout class

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);

    this.cadence = cadence;

    this.calcPace();

    this.setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;

    return this.pace;
  }
}

// The Cycling class extends the Workout class

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);

    this.elevationGain = elevationGain;

    this.calcSpeed();

    this.setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);

    return this.speed;
  }
}

// We need to create a app class which will contain all the methods and properties that we need to use in the app

class App {
  // private properties
  #map;

  #mapZoomLevel = 13;

  #mapEvent;

  #workouts = [];

  #markers = new Map();

  constructor() {
    // this is a constructor function that will be immediately executed when this class is instantiated
    // app methods here will be immediately invoked

    this.#map = null;

    this.#workouts = [];
  }

  // Static methods

  static async #getGeoCoords() {
    // if success
    const success = (position) => {
      const { latitude: lat, longitude: lng } = position.coords;

      const coords = [lat, lng];

      return coords;
    };

    const error = (err) => {
      if (err) {
        throw new Error(`${err.code} : ${err.message}`);
      }
    };

    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(success(position)),
          (err) => reject(error(err))
        );
      } else {
        throw new Error('Geolocation is not supported by your browser');
      }
    });
  }

  static #showForm() {
    formContainer.classList.remove('form__hide');
    formEl.classList.add('active');
    formEl.classList.remove('visually-hide');
    workoutsContainer.classList.add('form__not-hidden');
  }

  static hideForm() {
    formContainer.classList.remove('form__hide');
    formEl.classList.remove('active');
    formEl.classList.add('visually-hide');
    workoutsContainer.classList.remove('form__not-hidden');
  }

  // Checking the form selection type

  static handleTypeChange() {
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
  }

  // Checking if all inputs are valid numerals
  static #validInputs(...inputs) {
    return inputs.every((inp) => Number.isFinite(inp));
  }

  // Checking if all inputs are positive numbers

  static #allPositive(...inputs) {
    return inputs.every((inp) => inp > 0);
  }

  static #handleInputs(type, distance, duration, cadence, elevation) {
    if (type === 'running') {
      if (
        !App.#validInputs(distance, duration, cadence) ||
        !App.#allPositive(distance, duration, cadence)
      ) {
        throw new Error('Inputs for running must be positive numbers!');
      }
    } else if (type === 'cycling') {
      if (
        !App.#validInputs(distance, duration, elevation) &&
        !App.#allPositive(distance, duration)
      ) {
        throw new Error(
          'Inputs for distance and duration must be positive numbers!'
        );
      }
    }
  }

  static #showModal(errorMsg) {
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
  }

  static #getNewGeoCoords(mapObj) {
    const { lat, lng } = mapObj.latlng;

    const newCoords = [lat, lng];

    return newCoords;
  }

  static #renderWorkout(workout) {
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
    // handleTrashbinListener(removeMapMarker);
  }

  static #clearInputs(...fields) {
    fields.forEach((field) => {
      // because of eslint rule no-reassign
      const temp = field;

      // gaurd clause to check for null value
      if (temp) {
        temp.value = '';
      }
    });
  }

  // Instance methods

  #renderMap(coords) {
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
  }

  #mapOnClick(callback) {
    this.#map.on('click', (mapE) => {
      this.#mapEvent = mapE;

      const newCoords = App.#getNewGeoCoords(this.#mapEvent);
      console.log(newCoords);

      callback(newCoords);
    });
  }

  #mapMarker(coords, workout) {
    if (!this.#map) {
      throw new Error('Map not initialized');
    }

    try {
      const marker = L.marker(coords);
      marker.addTo(this.#map);

      const popup = L.popup({
        maxWidth: 300,
        minWidth: 100,
        autoClose: false,
        closeOnClick: false,
        className: `${workout.type}-popup`,
      });

      marker.bindPopup(popup);
      marker.setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♂️'} ${workout.description}`
      );
      marker.openPopup();

      // A Map has been initialised as private variable

      this.#markers.set(workout.id, marker);
    } catch (err) {
      throw new Error(`ERROR(${err.code}: ${err.message})`);
    }
  }

  #removeMapMarker(workoutId) {
    const marker = this.#markers.get(workoutId);

    if (marker) {
      this.#map.removeLayer(marker);
      this.#markers.delete(workoutId);
    }
  }

  #moveToMarker(workout) {
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  // eslint-disable-next-line class-methods-use-this
  #createNewWorkout(type, ...inputs) {
    let workout;

    const addWorkout = () => {
      this.#workouts = [...this.#workouts, workout];
    };

    console.log(type, inputs);

    const [coords, distance, duration, cadenceOrElevation] = inputs;

    console.log(coords, distance, duration, cadenceOrElevation);

    if (type === 'running') {
      workout = new Running(coords, distance, duration, cadenceOrElevation);
    } else if (type === 'cycling') {
      workout = new Cycling(coords, distance, duration, cadenceOrElevation);
    }

    console.log('Workout: ', workout);

    addWorkout();
    App.#renderWorkout(workout);

    console.log('Workouts: ', this.#workouts);

    return workout;
  }

  #createWorkoutManager() {
    // Save to local storage

    const saveToLocalStorage = () => {
      localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    };

    // Get from local storage

    const getFromLocalStorage = () => {
      const data = JSON.parse(localStorage.getItem('workouts')) || [];

      if (!data) return;

      this.#workouts = data;
    };

    // Delete from workouts array
    const removeWorkout = (id) => {
      // Lets use findIndex this time to remove the workout
      const index = this.#workouts.findIndex((workout) => workout.id === id);

      if (index !== -1) {
        this.#workouts.splice(index, 1);
      }
      saveToLocalStorage();
    };

    // Get all workouts

    const getAllWorkouts = () => {
      const allWorkouts = this.#workouts;
      return allWorkouts;
    };

    return {
      saveToLocalStorage,
      getFromLocalStorage,
      removeWorkout,
      getAllWorkouts,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  #handleFormSubmit(event, coords) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const type = formData.get('type');
    const distance = Number(formData.get('distance'));
    const duration = Number(formData.get('duration'));
    const cadence = Number(formData.get('cadence'));
    const elevation = Number(formData.get('elev-gain'));

    try {
      if (type === 'running') {
        App.#handleInputs(distance, duration, cadence);
        const workout = this.#createNewWorkout(
          type,
          coords,
          distance,
          duration,
          cadence
        );
        // Creates the map marker on the map
        this.#mapMarker(coords, workout);
      } else if (type === 'cycling') {
        App.#handleInputs(distance, duration, elevation);
        const workout = this.#createNewWorkout(
          type,
          coords,
          distance,
          duration,
          elevation
        );
        // Creates the map marker on the map
        this.#mapMarker(coords, workout);
        // Clears the form inputs
        App.#clearInputs(
          distanceInput,
          durationInput,
          cadenceInput,
          elevationGainInput
        );
      }
    } catch (error) {
      App.#showModal(error.message);
      return;
    }

    App.hideForm();
  }

  #setupEventListeners(workoutManager) {
    const findWorkout = (event) => {
      const workout = event.target.closest('.workout');

      const workoutId = workout.dataset.id;

      const foundWorkout = this.#workouts.find((work) => work.id === workoutId);

      return foundWorkout;
    };

    this.#mapOnClick((newCoords) => {
      App.#clearInputs(
        distanceInput,
        durationInput,
        cadenceInput,
        elevationGainInput
      );
      App.#showForm();
      App.handleTypeChange();

      // closure to capture the event and pass in newCoords
      const submitHandler = (event) => {
        this.#handleFormSubmit(event, newCoords);
        workoutManager.saveToLocalStorage();
      };

      formEl.addEventListener('submit', submitHandler.bind(this), {
        once: true,
      });
    });

    const workoutListener = (event) => {
      const trashbinEl = event.target.closest(
        '.workout .workout__trash > i.bx.bx-trash'
      );

      if (trashbinEl) {
        event.stopPropagation();
        const workout = trashbinEl.closest('.workout');
        const workoutId = workout.dataset.id;

        // removes from local storage and the workouts array
        workoutManager.removeWorkout(workoutId);
        // removes the workout from the DOM
        workout.remove();
        // removes the map marker
        this.#removeMapMarker(workoutId);
        return;
      }
      // If the user hasn't clicked on the trashbin then the map is moved to the marker

      const foundWorkout = findWorkout(event);
      console.log(foundWorkout);
      if (foundWorkout) {
        this.#moveToMarker(foundWorkout);
      }
    };

    workoutEl.addEventListener('click', workoutListener.bind(this));
  }

  // eslint-disable-next-line class-methods-use-this
  async init() {
    try {
      const coords = await App.#getGeoCoords();

      this.#renderMap(coords);

      console.log(coords);

      const workoutManager = this.#createWorkoutManager();

      // this.#setupEventListeners(workoutManager);

      workoutManager.getFromLocalStorage();
      const storedWorkouts = workoutManager.getAllWorkouts();
      console.log(storedWorkouts);

      if (storedWorkouts) {
        storedWorkouts.forEach((workout) => {
          App.#renderWorkout(workout);
          this.#mapMarker(workout.coords, workout);
        });
      }
      this.#setupEventListeners(workoutManager);
    } catch (error) {
      App.#showModal(error.message);
    }
  }
}

const app = new App();

await app.init().catch((error) => {
  console.error(`${error.code}: ${error.message}`);
});
