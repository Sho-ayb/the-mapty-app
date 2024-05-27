'use-strict';

// importing the style file
import '../scss/style.scss';

// importing images

import '../assets/img/logo.png';

/*


* We will diverge from Jonas implementation using class based programming paradigm to a functional programming paradigm and make it all work. 

* Afterwards we will refactor all the code in to Jonas class based paradigm, so that we can see the similarities and differences in both project structures.


*/

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

  return {
    getGeoCoords,
    renderMap,
  };
};

const init = async () => {
  const appInstance = app();
  const coords = await appInstance.getGeoCoords();
  appInstance.renderMap(coords);
};

init();
