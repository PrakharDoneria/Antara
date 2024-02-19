document.addEventListener("DOMContentLoaded", function () {
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const audioThumbnail = document.getElementById('audio-thumbnail');
    const playPauseButton = document.getElementById('play-pause-button');
    const previousButton = document.getElementById('previous-button');
    const nextButton = document.getElementById('next-button');
    const progressBar = document.getElementById('progress-bar');
    const songNameElement = document.getElementById('song-name');
    const artistNameElement = document.getElementById('artist-name');
    const backgroundOverlay = document.getElementById('background-overlay');
    const currentDuration = document.getElementById('current-duration');
    const totalDuration = document.getElementById('total-duration');
    const lyricsView = document.getElementById('lyrics-view');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const durationText = document.getElementById('duration-text');

    let isPlaying = true;
    let lyricsVisible = true;

    // Set initial button display state
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';

    // Initially hide the lyrics view
    lyricsView.innerHTML = "Lyrics are currently not available.";

    playPauseButton.addEventListener('click', function () {
        togglePlay();
    });

    previousButton.addEventListener('click', function () {
        fetchPreviousOrNextAudio('previous');
    });

    nextButton.addEventListener('click', function () {
        fetchPreviousOrNextAudio('next');
    });

    audioPlayer.addEventListener('timeupdate', function () {
        updateProgressBar();

        syncLyrics();
    });

    progressBar.addEventListener('input', function () {
        updateCurrentDuration();
    });

    progressBar.addEventListener('change', function () {
        seekToPosition();
    });

    audioPlayer.addEventListener('loadedmetadata', function () {
        setTotalDuration();
    });

    const urlParams = new URLSearchParams(window.location.search);
    const audioId = urlParams.get('audioId');
    const title = urlParams.get('title').replace("+"," ");
    const author = urlParams.get('author');

    if (audioId) {
        const audioUrl = `https://paxsenixjs.deno.dev/download?id=${audioId}&type=audio`;
        const thumbnailUrl = `https://paxsenixjs.deno.dev/thumbnailHD?id=${audioId}`;

        audioSource.src = audioUrl;
        audioThumbnail.src = thumbnailUrl;
        audioPlayer.load();

        if (title) {
            songNameElement.textContent = title;
        }

        if (author) {
            artistNameElement.textContent = author;
        }

        backgroundOverlay.style.backgroundImage = `url('${thumbnailUrl}')`;

        fetchLyrics(audioId);
    }

    function togglePlay() {
        if (isPlaying) {
            audioPlayer.pause();
            playIcon.style.display = 'block';
            pauseIcon.style.display = 'none';
        } else {
            audioPlayer.play();
            playIcon.style.display = 'none';
            pauseIcon.style.display = 'block';
        }
        isPlaying = !isPlaying;
    }

    function fetchPreviousOrNextAudio(direction) {
        fetch(`https://antara.deno.dev/${direction}?id=${audioId}`)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const nextAudioId = data[0].videoId;
                    const nextAudioUrl = `https://paxsenixjs.deno.dev/download?id=${nextAudioId}&type=audio`;
                    const nextThumbnailUrl = data[0].thumbnail;

                    audioSource.src = nextAudioUrl;
                    audioThumbnail.src = nextThumbnailUrl;
                    audioPlayer.load();
                    audioPlayer.play();

                    const nextTitle = data[0].title;
                    const nextAuthor = data[0].author;

                    if (nextTitle) {
                        songNameElement.textContent = nextTitle;
                    }

                    if (nextAuthor) {
                        artistNameElement.textContent = nextAuthor;
                    }

                    backgroundOverlay.style.backgroundImage = `url('${nextThumbnailUrl}')`;

                    fetchLyrics(nextAudioId);
                } else {
                    console.log(`No ${direction} audio available.`);
                }
            })
            .catch(error => {
                console.error(`Error fetching ${direction} audio:`, error);
            });
    }

    function updateProgressBar() {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;
        currentDuration.textContent = formatTime(currentTime);
        totalDuration.textContent = formatTime(duration);
    }

    function updateCurrentDuration() {
        const progress = progressBar.value;
        const duration = audioPlayer.duration;
        const currentTime = (progress / 100) * duration;
        audioPlayer.currentTime = currentTime;
        currentDuration.textContent = formatTime(currentTime);
    }

    function seekToPosition() {
        const progress = progressBar.value;
        const duration = audioPlayer.duration;
        const currentTime = (progress / 100) * duration;
        audioPlayer.currentTime = currentTime;
        currentDuration.textContent = formatTime(currentTime);
    }

    function setTotalDuration() {
        const duration = audioPlayer.duration;
        totalDuration.textContent = formatTime(duration);
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function fetchLyrics(audioId) {
        fetch(`https://paxsenix.deno.dev/music/lyrics/sync?type=text&id=${audioId}`)
            .then(response => response.text())
            .then(data => {
                if (data) {
                    lyricsView.innerHTML = removeTimestamps(data);
                } else {
                    lyricsView.textContent = "Lyrics not found.";
                }
            })
            .catch(error => {
                console.error('Error fetching lyrics:', error);
            });
    }

    function removeTimestamps(data) {
        // Remove timestamps from the lyrics
        return data.replace(/\[\d+:\d+\.\d+\]/g, '');
    }

    function syncLyrics() {
        const currentTime = audioPlayer.currentTime;
        const lines = lyricsView.textContent.split('\n');

        // Iterate through each line of lyrics
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Extract timestamp from the line
            const timestampMatch = line.match(/\[(\d+:\d+\.\d+)\]/);

            if (timestampMatch) {
                // Extract minutes, seconds, and milliseconds from the timestamp
                const [, timestamp] = timestampMatch;
                const [minutes, seconds, milliseconds] = timestamp.split(/[:.]/).map(Number);

                // Convert timestamp to seconds
                const lineTime = minutes * 60 + seconds + milliseconds / 1000;

                // Check if the current time matches the line time
                if (Math.floor(lineTime) === Math.floor(currentTime)) {
                    // Highlight the matched line
                    lyricsView.innerHTML = lines.map((line, index) => {
                        return index === i ? `<span class="highlighted">${line}</span>` : line;
                    }).join('\n');
                }
            }
        }
    }
});
