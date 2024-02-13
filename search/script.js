document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById('search-input');
    const searchResultsList = document.getElementById('search-results');

    // Function to parse URL parameters
    function getUrlParams(url) {
        const params = {};
        const urlSearchParams = new URLSearchParams(url.split('?')[1]);
        for (const param of urlSearchParams) {
            params[param[0]] = param[1];
        }
        return params;
    }

    // Function to perform search and display results
    function performSearch(query) {
        const apiKey = '9c9e247ac8efad7cf0fddc05e0d7223c';
        const apiUrlArtist = `http://ws.audioscrobbler.com/2.0/?method=artist.search&artist=${query}&api_key=${apiKey}&format=json`;
        const apiUrlTrack = `http://ws.audioscrobbler.com/2.0/?method=track.search&track=${query}&api_key=${apiKey}&format=json`;

        // Fetch artist recommendations
        fetch(apiUrlArtist)
            .then(response => response.json())
            .then(data => {
                const artistResults = data.results.artistmatches.artist;
                displayResults(artistResults);
            })
            .catch(error => {
                console.error("Error fetching artist recommendations:", error);
            });

        // Fetch track recommendations
        fetch(apiUrlTrack)
            .then(response => response.json())
            .then(data => {
                const trackResults = data.results.trackmatches.track;
                displayResults(trackResults);
            })
            .catch(error => {
                console.error("Error fetching track recommendations:", error);
            });

        // Function to display search results
        function displayResults(results) {
            searchResultsList.innerHTML = ""; // Clear previous results

            results.forEach(result => {
                const listItem = document.createElement("li");
                const title = document.createElement("span");
                title.textContent = result.name; // Assuming the API response includes a 'name' field for both artists and tracks
                listItem.appendChild(title);
                searchResultsList.appendChild(listItem);
            });
        }
    }

    // Get search query from URL and perform search
    const urlParams = getUrlParams(window.location.href);
    const searchQuery = urlParams.q;
    if (searchQuery) {
        searchInput.value = searchQuery;
        performSearch(searchQuery);
    } else {
        console.error("No search query provided in URL.");
    }

    // Event listener for input field
    searchInput.addEventListener('input', function() {
        const query = searchInput.value;
        performSearch(query);
    });

    // Event listener for click on search result item
    document.getElementById('search-results').addEventListener('click', function(event) {
        if (event.target && event.target.nodeName === 'SPAN') {
            const selectedItem = event.target.textContent;
            searchInput.value = selectedItem;
            performSearch(selectedItem);
        }
    });
});
