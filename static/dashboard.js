(function() {
    document.addEventListener('DOMContentLoaded', async () => {
        await getVCDataFromPerplexity();
        await getAvailableOfficesData();
        // setTimeout(generateImages, 10);
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
})();