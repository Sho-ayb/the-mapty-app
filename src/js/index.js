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
const typeSelection = document.querySelector('.form__input--type');
const distanceInput = document.querySelector('.form__input--distance');
const durationInput = document.querySelector('.form__input--duration');
const cadenceInput = document.querySelector('.form__input--cadence');
const elevationGainInput = document.querySelector('.form__input--elevation');

// We need to create global variables for map and mapEvent

let map;
let mapEvent;

// Lets create a factory function here

const app = function () {
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

    throw new Error('Geolocation is not supported by this browser.');
  };

  // We need to create a function to render map

  const renderMap = function (coords) {
    // L is a global namespace that leaflet provides
    map = L.map('map').setView(coords, 13);

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

      console.log(newCoords);

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

  const mapMarker = function (coords) {
    // const { lat, lng } = coords;

    L.marker(coords)
      .addTo(map)
      .bindPopup(
        L.popup({
          maxWidth: 300,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Workout')
      .openPopup();
  };

  const showForm = function () {
    formEl.classList.remove('visually-hide');
  };

  return {
    getGeoCoords,
    renderMap,
    mapOnClick,
    mapMarker,
    showForm,
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

const handleFormSubmit = function (event, newCoords, appInstance) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const type = formData.get('type');
  const distance = formData.get('distance');
  const duration = formData.get('duration');
  const cadence = formData.get('cadence');
  const elevationGain = formData.get('elev-gain');

  console.log(type, distance, duration, cadence, elevationGain);

  const coords = newCoords;

  appInstance.mapMarker(coords);

  formEl.classList.add('visually-hide');

  clearInputs(distanceInput, durationInput, cadenceInput, elevationGainInput);
};

const handleFormSubmitListener = function (event, newCoords, appInstance) {
  handleFormSubmit(event, newCoords, appInstance);
};

const init = async () => {
  const appInstance = app();
  const coords = await appInstance.getGeoCoords();
  appInstance.renderMap(coords);
  appInstance.mapOnClick((newCoords) => {
    //   clear up the formEl event listener - since the form is submitted
    formEl.removeEventListener('submit', handleFormSubmitListener);

    // show the form when the user clicks on the map

    appInstance.showForm();
    handleTypeChange();

    setTimeout(() => {
      formEl.addEventListener('submit', (event) =>
        handleFormSubmitListener(event, newCoords, appInstance)
      );
    }, 1000);
  });
};

init();
