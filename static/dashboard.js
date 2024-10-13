(function() {
    document.addEventListener('DOMContentLoaded', async () => {
        getVCDataFromPerplexity();
        getAvailableOfficesData();
        setTimeout(generateImages, 10);
        getSummary();
    });

    async function getVCDataFromPerplexity() {
        await fetch('/api/getVcs', {
            method: 'GET'
        }).then(function (res) {
            console.log(res.status, res.statusText);
            if (res.ok) {
                console.log(JSON.stringify(res));
                return res.json();
            } else {
                console.log("Error getting response");
            }
        }).then(data => {
            console.log('Value from server vc data:', data.vcs);
            generateVCListElements(data.vcs);
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }

    async function getAvailableOfficesData() {
        await fetch('/api/getOffices', {
            method: 'GET'
        }).then(function (res) {
            console.log(res.status, res.statusText);
            if (res.ok) {
                console.log(JSON.stringify(res));
                return res.json();
            } else {
                console.log("Error getting response");
            }
        }).then(data => {
            console.log('Value from server officer:', data.office_spaces);
            const officeContainer = document.querySelector("#offices");
            generateOfficeElements(data.office_spaces);
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }

    function generateVCListElements(list) {
        const vcContainer = document.querySelector("#vcs");
        for(let i=0; i < list.length; i++) {
            const listElement = document.createElement('li');
            listElement.innerHTML = list[i].name + ', ' + list[i].location.split(',')[0] + '<i class="fa-solid fa-chevron-down"></i>';
            vcContainer.appendChild(listElement);

            listElement.addEventListener('click', function() {
                if (!listElement.classList.contains('open')) {
                    console.log("Adding child");
                    const details = document.createElement('p');
                    details.id = `vc${i}`;
                    details.textContent = list[i].reason;
                    listElement.appendChild(details);
                    listElement.classList.add('open');
                } else {
                    console.log("removing child");
                    const details = document.getElementById(`vc${i}`);
                    listElement.removeChild(details);
                    listElement.classList.remove('open');
                }
            });
        }
    }

    function generateOfficeElements(list) {
        const officeContainer = document.querySelector("#offices");
        for(let i=0; i < list.length; i++) {
            const listElement = document.createElement('li');
            console.log("creating list element");
            listElement.innerHTML = list[i].name + ', ' + list[i].location.split(',')[0] + '<i class="fa-solid fa-chevron-down"></i>';
            officeContainer.appendChild(listElement);

            console.log("appended list element");

            listElement.addEventListener('click', function() {
                if (!listElement.classList.contains('open')) {
                    console.log("Adding child");
                    const details = document.createElement('p');
                    details.id = `office${i}`;
                    details.innerHTML = list[i].location + '<br>Rent: ' + list[i].rent + '<br>Sq ft: ' + list[i].square_footage;
                    listElement.appendChild(details);
                    listElement.classList.add('open');
                } else {
                    console.log("removing child");
                    const details = document.getElementById(`office${i}`);
                    listElement.removeChild(details);
                    listElement.classList.remove('open');
                }
            });
        }
    }

    function generateImages() {
        const imageContainer = document.querySelector(".images");
        fetch('/api/getLogos', {
            method: 'GET'
        }).then(function (res) {
            console.log(res.status, res.statusText);
            if (res.ok) {
                console.log(JSON.stringify(res));
                return res.json();
            } else {
                console.log("Generating again");
                setTimeout(generateImages, 10000);
            }
        }).then(data => {
            var imageUrls = Object.values(data);
            console.log('Value from server images:', imageUrls);

            // set divs here
            for (let i=0; i < imageUrls.length; i++) {
                const img = document.createElement('img');
                img.src = imageUrls[i];
                imageContainer.appendChild(img);
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }

    async function getSummary() {
        await fetch('/api/getSummary', {
            method: 'GET'
        }).then(function (res) {
            console.log(res.status, res.statusText);
            if (res.ok) {
                console.log(JSON.stringify(res));
                return res.json();
            } else {
                console.log("Error getting response");
            }
        }).then(data => {
            console.log('Value from server summary:', data.message);
            const summaryContainer = document.querySelector("#trailer");
            let summary = document.createElement('p');
            summary.textContent = data.message;
            summaryContainer.appendChild(summary);
            // populate the container here
        })
        .catch(error => {
            console.error('Fetch error:', error);
        });
    }
})();