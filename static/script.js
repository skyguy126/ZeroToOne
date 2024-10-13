(function() {
    'use strict';

    const businessIdeaForm = document.querySelector("#business-idea-form");
    const businessIdeaInput = document.querySelector("#business-idea");
    const businessQuestionsForm = document.querySelector("#business-questions-form");
    const page1 = document.querySelector(".page1");

    async function successCallback(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        console.log("lat and lon ", latitude, longitude);
        await generateMap(latitude, longitude);
    }

    function errorCallback(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                document.getElementById('location').textContent = "User denied the request for Geolocation.";
                break;
            case error.POSITION_UNAVAILABLE:
                document.getElementById('location').textContent = "Location information is unavailable.";
                break;
            case error.TIMEOUT:
                document.getElementById('location').textContent = "The request to get user location timed out.";
                break;
            case error.UNKNOWN_ERROR:
                document.getElementById('location').textContent = "An unknown error occurred.";
                break;
        }
    }
    
    // expand textbox on click
    businessIdeaInput.addEventListener('click', function() {
        businessIdeaInput.classList.add('expanded');
    });

    businessIdeaForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent form submission
        
        const textAreaValue = document.querySelector('#business-idea').value;

        try {
            const response = await fetch('/api/idea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: textAreaValue })
            });

            if (response.ok) {
                console.log('Success');
                showSecondPage();
                page1.classList.add('hide');
                document.querySelector('.overlay').classList.add('hide');
                document.body.style.setProperty('--background-image', 'none');
                document.querySelector('#business-idea').value = '';
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(successCallback, errorCallback);
                } else {
                    console.log("Geolocation is not supported by this browser.");
                }
            } else {
                console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    });

    businessQuestionsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const businessTypeValue = document.querySelector('#businesstype').value;
        const fundingValue = document.querySelector('#funding').value;

        try {
            const response = await fetch('/api/extraInfo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ businesstype: businessTypeValue, funding: fundingValue })
            });

            if (response.ok) {
                console.log('Success');
                window.location.href = 'dashboard.html';
                document.querySelector('#businesstype').value = '';
                document.querySelector('#funding').value = '';
                getVCData();
            } else {
                console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    })

    function showSecondPage() {
        const page2 = document.querySelector('.page2');
        page2.classList.add('show');
    }

    async function fetchMapboxAPIKey() {
        // Fetch the value from the Node.js server
        return await fetch('/getMapbox') // Adjust the URL if using ngrok or a different port
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Value from server:', data.apiKey);
                return data.apiKey;
            })
            .catch(error => {
                console.error('Fetch error:', error);
            });
    }

    async function generateMap(lat, lon) {
        mapboxgl.accessToken = await fetchMapboxAPIKey();
        console.log("access token ", mapboxgl.accessToken);
        const map = new mapboxgl.Map({
            container: 'map',
            zoom: 12.5,
            center: [lon, lat],
            // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
            style: 'mapbox://styles/mapbox/streets-v12',
            cooperativeGestures: true
        });

        map.addControl(new mapboxgl.NavigationControl());

        const marker = new mapboxgl.Marker({
            draggable: true,
            color: '#bd0f29'
        })
            .setLngLat([lon, lat])
            .addTo(map);

        marker.on('dragend', await onDragEnd);

        async function onDragEnd() {
            const lngLat = marker.getLngLat();
            const location = await reverseGeocode(lngLat.lng, lngLat.lat, mapboxgl.accessToken);
            console.log("Place name ", location);
            sendCityToApi(location);
        }
    }

    // Function to reverse geocode coordinates
    async function reverseGeocode(lng, lat, accessToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const dataFeature = data.features.find(feature => feature.place_type[0] === "place");
            if (!dataFeature) {
                return 'Location not found';
            }
            return dataFeature.place_name;
        } else {
            return 'Location not found';
        }
    }

    async function sendCityToApi(location) {
        try {
            const response = await fetch('/api/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location: location })
            });

            if (response.ok) {
                console.log('Success');
            } else {
                console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }
})();