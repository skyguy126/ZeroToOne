(function() {
    const vcData = document.querySelector("#vcData");

    document.addEventListener('DOMContentLoaded', () => {
        getVCDataFromPerplexity();
    });

    function extractList(htmlString) {
        // Create a new DOMParser instance
        const parser = new DOMParser();

        // Parse the HTML string into a document
        const doc = parser.parseFromString(htmlString, 'text/html');
        
        // Get the list elements (both <ul> and <ol>)
        const lists = doc.querySelectorAll('ul, ol');
        
        // If there are no lists, return an empty string
        if (lists.length === 0) {
            return '';
        }
        
        // Create a string to hold the extracted HTML
        let listHtml = '';
    
        // Loop through each list and append its outer HTML to the string
        lists.forEach(list => {
            listHtml += list.outerHTML;
        });
        
        // Return the extracted list HTML
        return listHtml.trim(); // Trim whitespace
    }

    async function getVCDataFromPerplexity() {
        console.log("FUnction call vc data");
        let prompt = "I am launching a businessType business for the following idea: businessIdea. I am going to fund it with businessFunding. Show me a numbered list of venture capitalist firms related to my business in businessLocation. Give me this list and nothing else, and don't say anything before that. I just want the numbered list of VCs and nothing else. Also this list needs to be in html format, format it in html code please.";

        try {
            const response = await fetch('/api/perplexityVcQuery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: prompt })
            });

            if (response.ok) {
                console.log('Success ');
                const data = await response.json();
                console.log("Data ", data);
                vcData.innerHTML = '<h3>Here are some VCs:</h3>' + extractList(data.content);
            } else {
                console.error('Error:', response.statusText);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }
})();