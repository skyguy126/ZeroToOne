(function() {
    'use strict';

    const businessIdeaForm = document.querySelector("#business-idea-form");

    businessIdeaForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent form submission
        console.log("Form submitted");
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
                closeModal();
                showSecondPage();
                await generateMap();
            } else {
                console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    });

    function closeModal() {
        const modal = document.querySelector(".modal");
        const background = document.querySelector(".background");
        modal.classList.add('closed');
        background.style.display = 'none';
    }

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

    async function generateMap() {
        mapboxgl.accessToken = await fetchMapboxAPIKey();
        console.log("access token ", mapboxgl.accessToken);
        const map = new mapboxgl.Map({
            container: 'map',
            zoom: 12.5,
            center: [-77.01866, 38.888],
            // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
            style: 'mapbox://styles/mapbox/streets-v12',
            cooperativeGestures: true
        });

        map.addControl(new mapboxgl.NavigationControl());

        const marker = new mapboxgl.Marker({
            draggable: true
        })
            .setLngLat([-77.01866, 38.888])
            .addTo(map);

        marker.on('dragend', await onDragEnd);

        async function onDragEnd() {
            const lngLat = marker.getLngLat();
            const cityName = await reverseGeocode(lngLat.lng, lngLat.lat, mapboxgl.accessToken);
            console.log("City ", cityName);
            sendCityToApi(cityName);
        }
    }

    // Function to reverse geocode coordinates
    async function reverseGeocode(lng, lat, accessToken) {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.features && data.features.length > 0) {
            const dataFeature = data.features.find(feature => feature.place_type[0] === "place");
            return dataFeature.text;
        } else {
            return 'Location not found';
        }
    }

    async function sendCityToApi(city) {
        try {
            const response = await fetch('/api/location', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ city: city })
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