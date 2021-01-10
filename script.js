'use strict';

// prettier-ignore


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

// let map;
// let mapEvent;

class Workout{
    date = new Date();
    Id = (Date.now() + '').slice(-10);
    clicks = 0;
    constructor(coords, distance, duration){
        this.coords = coords;      // An array of lattitude and longitude - [lat, lng]
        this.distance = distance;  //in km
        this.duration = duration;  // in min
    }

    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]}`;
    }

    _clicks(){
        this.clicks ++;
    }
}

class Running extends Workout{
    type = 'running';
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace()
        this._setDescription()
    }

    calcPace (){
        // min/km
        this.pace = this.duration / this.distance;
        return this
    }
}

class Cycling extends Workout{
    type = 'cycling';
    constructor(coords, distance, duration, elevationgains){
        super(coords, distance, duration)
        this.elevationgains = elevationgains;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        this.speed = this.distance / (this.duration /60)
        return this.speed;
    }
}


const run1 = new Running([39, -12], 6.7, 24, 178)
const cyc1 = new Cycling([39, -12], 22, 100, 652)
console.log(run1)
console.log(cyc1)

/////////////////////////////////////
// APPLICATION ARCHITECHTURE
class App {
    #map;
    #mapEvent;
    #workout = [];
    
    constructor(){
        // Get user's position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        // Attach event handler
        form.addEventListener('submit', this._newWorkout.bind(this))
        inputType.addEventListener('change',this._toggleElevationField)
        containerWorkouts.addEventListener('click', this._moveToPopUp.bind(this));

    }
    
    _getPosition(){
        if(navigator.geolocation)
        navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function(){
            alert('Could not get Your Location!')
        })
    }

    _loadMap(position){
        console.log(position)
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        console.log(latitude,longitude)
        // console.log(`https://www.google.com/maps/place/20%C2%B021'32.9%22N+85%C2%B054'11.9%22E/@20.3576567,85.9030554,256a,35y,39.47t/data=!3m1!1e3!4m5!3m4!1s0x0:0x0!8m2!3d20.3592045!4d85.9033074`)

        // const coords = [20.3576567, 85.9030554];
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        // Handling Clicks on maps
        this.#map.on('click', this._showForm.bind(this));

        this.#workout.forEach(work => {
            this._renderWorkout(work);
            this._renderWorkoutMarker(work)
        })
     
    }    

    _showForm(mapE){
            console.log(mapE)
            this.#mapEvent = mapE;  // Here we assigned the function parameter to the global variable to use it outside of the scope
            form.classList.remove('hidden')  // Wher user clicks on the map The input form appear
            inputDistance.focus()     // This makes the input element blink on the first load

    }

    _hideForm(){
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '' ;
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => form.style.display = 'grid', 1000)
    }

    _toggleElevationField(){
        
            inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
            inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
        
    }

    _newWorkout(e){
        const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const allPositive = (...inputs) => inputs.every(inp => inp > 0);

        e.preventDefault()

        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value
        const duration = +inputDuration.value;

        const {lat, lng} = this.#mapEvent.latlng;

        let workout;

        
        // If workout running, create running Object
        if( type === 'running'){
            const cadence = +inputCadence.value;
            // Check if data is valid    // Guard clause
            // if(!Number.isFinite(distance) || !Number.isFinite(duration) || !Number.isFinite(cadence)) 
            if(!validInput(distance, duration, cadence) || (!allPositive(distance,duration))){ 
                return alert('Inputs have to be positive numbers!')  
            }

            workout = new Running([lat, lng], distance, duration, cadence);
            
        }
        
        //If workout cycling, create cycling Object
        if( type === 'cycling'){
            const elevation = +inputElevation.value;
            // Check if data is valid    // Guard clause
            // 
            if(!validInput(distance,duration,elevation) || (!allPositive(distance,duration))) { 
                return alert('Inputs have to be positive numbers!')  
            }

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        // Add new object to workout Array
        this.#workout.push(workout);
        console.log(workout)

        // Render workout on map as marker
        this._renderWorkoutMarker(workout)

        // Render workout on list
        this._renderWorkout(workout)

        // Hide form + Clear the input fields
        this._hideForm();
        
        // Set local Storage to all workouts
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout){
        // Display marker
        // console.log(mapEvent)
        // const {lat, lng} = this.#mapEvent.latlng
        L.marker(workout.coords).addTo(this.#map)
                            .bindPopup(L.popup({
                                maxWidth: 250,
                                minWidth: 100,
                                autoClose: false,
                                closeOnClick: false,
                                className: `${workout.type}-popup`
                            }))
                            .setPopupContent(`${workout.type === 'running'? '🏃‍♂' : '🚴🏼‍♂️'} ${workout.description}`)
                            .openPopup();
    }

    _renderWorkout(workout){
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.Id}">
                        <h2 class="workout__title">${workout.description}</h2>
                      <div class="workout__details">
                        <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂' : '🚴🏼‍♂️'}</span>
                        <span class="workout__value">${workout.distance}</span>
                        <span class="workout__unit">km</span>
                      </div>
                      <div class="workout__details">
                        <span class="workout__icon">⏱</span>
                        <span class="workout__value">${workout.duration}</span>
                        <span class="workout__unit">min</span>
                      </div>`;

        if(workout.type === 'running'){
              html += `<div class="workout__details">
                            <span class="workout__icon">⚡️</span>
                            <span class="workout__value">${workout.pace.toFixed(1)}</span>
                            <span class="workout__unit">min/km</span>
                        </div>
                        <div class="workout__details">
                            <span class="workout__icon">🦶🏼</span>
                            <span class="workout__value">${workout.cadence}</span>
                            <span class="workout__unit">spm</span>
                        </div>
                        </li>`
        }

        if(workout.type === 'cycling'){
             html +=    `<div class="workout__details">
                            <span class="workout__icon">⚡️</span>
                            <span class="workout__value">${workout.speed.toFixed(1)}</span>
                            <span class="workout__unit">km/h</span>
                         </div>
                         <div class="workout__details">
                            <span class="workout__icon">⛰</span>
                            <span class="workout__value">${workout.elevationgains}</span>
                            <span class="workout__unit">m</span>
                         </div>
                         </li>`
        }

        form.insertAdjacentHTML('afterend', html)
    }

    _moveToPopUp(e){
        const workoutElement = e.target.closest('.workout')
        console.log(workoutElement)

        if(!workoutElement) return;  // Guard clutch

        const workout = this.#workout.find((work) => work.Id === workoutElement.dataset.id)
        console.log(workout);

        // Move the map view according to the coordintes
        this.#map.setView(workout.coords, 13, {
            animate : true,
            pan : {
                duration : 1
            }
        });

        // workout._clicks()
    }
        // TO set data to the localStorage
    _setLocalStorage(){
        localStorage.setItem('workout', JSON.stringify(this.#workout))
    }
        //To getdata from the local storage
    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workout'))
        console.log(data)

        if(!data) return;
        this.#workout = data;
        // this.#workout.forEach(work => {
        //     this._renderWorkout(work);
        //     this._renderWorkoutMarker(work)
        // })
    }

    reset(){
        localStorage.removeItem('workout');
        location.reload();
    }
}

const app = new App()



//////////////////////////////////////////////////////////////////////////////////////////////////////
// Using the Geolocation API ✅✅✅
/* if(navigator.geolocation)
navigator.geolocation.getCurrentPosition(function(position){
    console.log(position)
    const {latitude} = position.coords;
    const {longitude} = position.coords;
    console.log(latitude,longitude)
    console.log(`https://www.google.com/maps/place/20%C2%B021'32.9%22N+85%C2%B054'11.9%22E/@20.3576567,85.9030554,256a,35y,39.47t/data=!3m1!1e3!4m5!3m4!1s0x0:0x0!8m2!3d20.3592045!4d85.9033074`)

    const coords = [20.3576567, 85.9030554];

    map = L.map('map').setView(coords, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Handling Clicks on maps
    map.on('click', function(mapE){
        mapEvent = mapE;  // Here we assigned the function parameter to the global variable to use it outside of the scope
        form.classList.remove('hidden')  // Wher user clicks on the map The input form appear
        inputDistance.focus()     // This makes the input element blink on the first load


        
    })


}, function(){
    alert('Could not get Your Location!')
})  */
//

/*form.addEventListener('submit', function(e){
    e.preventDefault()
    // Clear the input fields
    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '' 
    
    // Display marker
    console.log(mapEvent)
    const {lat, lng} = mapEvent.latlng

    L.marker([lat, lng]).addTo(map)
                        .bindPopup(L.popup({
                            maxWidth: 250,
                            minWidth: 100,
                            autoClose: false,
                            closeOnClick: false,
                            className: 'running-popup'
                        }))
                        .setPopupContent('workout')
                        .openPopup();
}) */

/*  inputType.addEventListener('change',function(){
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
}) */