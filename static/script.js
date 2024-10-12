(function() {
    'use strict';

    const businessIdeaForm = document.querySelector("#business-idea-form");

    businessIdeaForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Prevent form submission
        console.log("Form submitted");
        const textAreaValue = document.querySelector('#business-idea').value;

        try {
            const response = await fetch('/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: textAreaValue })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Success:', data);
            } else {
                console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    });
})();