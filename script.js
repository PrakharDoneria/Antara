document.addEventListener("DOMContentLoaded", function() {
    const songsList = document.getElementById("songs-list");
    const loadingSpinner = document.createElement("div");
    loadingSpinner.classList.add("loading-spinner");
    songsList.appendChild(loadingSpinner);

    const progressContainer = document.createElement("div");
    progressContainer.classList.add("progress-container");
    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar");
    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);

    function showLoadingSpinner() {
        loadingSpinner.style.display = "block";
    }

    function hideLoadingSpinner() {
        loadingSpinner.style.display = "none";
    }

    function showProgressBar() {
        progressContainer.style.display = "block";
    }

    function updateProgressBar(percent) {
        progressBar.style.width = percent + "%";
    }

    function hideProgressBar() {
        progressContainer.style.display = "none";
    }

    function showError(message) {
        const errorMessage = document.createElement("div");
        errorMessage.classList.add("error-message");
        errorMessage.textContent = message;
        songsList.appendChild(errorMessage);
    }

    function getCountryCode() {
        return new Promise((resolve, reject) => {
            fetch("https://ipapi.co/json/")
                .then(response => response.json())
                .then(data => {
                    const countryCode = data.country;
                    resolve(countryCode);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    function getGreeting() {
        const hour = new Date().getHours();
        let greeting;

        if (hour >= 5 && hour < 12) {
            greeting = "Good Morning";
        } else if (hour >= 12 && hour < 17) {
            greeting = "Good Afternoon";
        } else if (hour >= 17 && hour < 20) {
            greeting = "Good Evening";
        } else {
            greeting = "Good Night";
        }

        return greeting;
    }

    showLoadingSpinner();
    showProgressBar();

    getCountryCode()
        .then(countryCode => {
            const url = `https://antara-in.deno.dev/home?gl=${countryCode}`;
            const greeting = getGreeting();
            document.querySelector(".heading").textContent = greeting;

            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                updateProgressBar(progress);
                if (progress >= 100) {
                    clearInterval(interval);
                    hideProgressBar();
                    hideLoadingSpinner();
                }
            }, 500);

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    hideLoadingSpinner();
                    const quickPicks = data.results.quick_picks;
                    songsList.innerHTML = ""; // Clear previous content

                    quickPicks.forEach(song => {
                        const listItem = document.createElement("li");
                        listItem.classList.add("song-item");

                        const thumbnail = document.createElement("img");
                        thumbnail.classList.add("thumbnail");
                        thumbnail.src = song.thumbnail;
                        listItem.appendChild(thumbnail);

                        const songDetails = document.createElement("div");
                        songDetails.classList.add("song-details");

                        const title = document.createElement("span");
                        title.textContent = song.title;
                        songDetails.appendChild(title);

                        const artist = document.createElement("span");
                        artist.textContent = song.author;
                        songDetails.appendChild(artist);

                        // Song info popup
                        const songInfoPopup = document.createElement("div");
                        songInfoPopup.classList.add("song-info-popup");
                        // Add content to the popup as needed
                        // For example: songInfoPopup.textContent = song.title + ' - ' + song.author;
                        listItem.appendChild(songInfoPopup);

                        listItem.appendChild(songDetails);
                        songsList.appendChild(listItem);

                        // Redirect to play/index.html on click
                        listItem.addEventListener('click', function() {
                            const audioId = song.videoId; // Assuming videoId is equivalent to audioId
                            window.location.href = `play/index.html?audioId=${audioId}&title=${encodeURIComponent(song.title)}&author=${encodeURIComponent(song.author)}`;
                        });

                        // Long press event listener for each song item
                        let longPressTimer;
                        listItem.addEventListener('mousedown', function(event) {
                            longPressTimer = setTimeout(() => {
                                listItem.classList.add('long-press');
                            }, 500); // Adjust the duration as needed
                        });

                        listItem.addEventListener('mouseup', function(event) {
                            clearTimeout(longPressTimer);
                        });

                        listItem.addEventListener('mouseleave', function() {
                            clearTimeout(longPressTimer);
                            listItem.classList.remove('long-press');
                        });
                    });
                })
                .catch(error => {
                    showError("Failed to fetch data. Please try again later.");
                    hideProgressBar();
                    hideLoadingSpinner();
                });
        });
});
