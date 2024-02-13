document.addEventListener("DOMContentLoaded", function () {
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const audioThumbnail = document.getElementById('audio-thumbnail');
    const playPauseButton = document.getElementById('play-pause-button');
    const previousButton = document.getElementById('previous-button');
    const nextButton = document.getElementById('next-button');
    const backward10Button = document.getElementById('backward-10-button');
    const forward10Button = document.getElementById('forward-10-button');
    const progressBar = document.getElementById('progress-bar');
    const currentDuration = document.getElementById('current-duration');
    const totalDuration = document.getElementById('total-duration');
    const lyricsView = document.getElementById('lyrics-view');
    const lyricsContainer = document.getElementById('lyrics-container');
    const lyricsToggleButton = document.getElementById('lyrics-toggle-button');
    const backgroundOverlay = document.getElementById('background-overlay');

    let isPlaying = false;
    let lyricsVisible = true; // Set to true to show lyrics by default

    playPauseButton.addEventListener('click', function () {
        togglePlay();
    });

    previousButton.addEventListener('click', function () {
        fetchPreviousOrNextAudio('previous');
    });

    nextButton.addEventListener('click', function () {
        fetchPreviousOrNextAudio('next');
    });

    backward10Button.addEventListener('click', function () {
        backward10Seconds();
    });

    forward10Button.addEventListener('click', function () {
        forward10Seconds();
    });

    audioPlayer.addEventListener('timeupdate', function () {
        updateProgressBar();
        updateCurrentDuration();
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
    const title = urlParams.get('title');
    const author = urlParams.get('author');

    if (audioId) {
        const audioUrl = `https://paxsenixjs.deno.dev/download?id=${audioId}&type=audio`;
        const thumbnailUrl = `https://paxsenixjs.deno.dev/thumbnailHD?id=${audioId}`;

        audioSource.src = audioUrl;
        audioThumbnail.src = thumbnailUrl;
        audioPlayer.load();

        if (title) {
            document.getElementById('song-name').textContent = title;
        }

        if (author) {
            document.getElementById('artist-name').textContent = author;
        }

        fetchLyrics(author, title);
        setBackgroundOverlay(thumbnailUrl);
    }

    function togglePlay() {
        if (isPlaying) {
            audioPlayer.pause();
        } else {
            audioPlayer.play();
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
                        document.getElementById('song-name').textContent = nextTitle;
                    }

                    if (nextAuthor) {
                        document.getElementById('artist-name').textContent = nextAuthor;
                    }

                    fetchLyrics(nextAuthor, nextTitle);
                    setBackgroundOverlay(nextThumbnailUrl);
                } else {
                    console.log(`No ${direction} audio available.`);
                }
            })
            .catch(error => {
                console.error(`Error fetching ${direction} audio:`, error);
            });
    }

    function backward10Seconds() {
        audioPlayer.currentTime -= 10;
    }

    function forward10Seconds() {
        audioPlayer.currentTime += 10;
    }

    function updateProgressBar() {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;
        currentDuration.textContent = formatTime(currentTime);

        const remainingTime = duration - currentTime;
        totalDuration.textContent = '-' + formatTime(remainingTime); // Display remaining time
    }

    function updateCurrentDuration() {
        const progress = progressBar.value;
        const duration = audioPlayer.duration;
        const currentTime = (progress / 100) * duration;
        currentDuration.textContent = formatTime(currentTime);

        const remainingTime = duration - currentTime;
        totalDuration.textContent = '-' + formatTime(remainingTime); // Display remaining time
    }

    function seekToPosition() {
        const progress = progressBar.value;
        const duration = audioPlayer.duration;
        const currentTime = (progress / 100) * duration;
        audioPlayer.currentTime = currentTime;
    }

    function setTotalDuration() {
        const duration = audioPlayer.duration;
        totalDuration.textContent = '-' + formatTime(duration); // Display total duration
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function fetchLyrics(artist, title) {
        fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`)
            .then(response => response.json())
            .then(data => {
                if (data.lyrics) {
                    lyricsView.textContent = data.lyrics;
                } else {
                    lyricsView.textContent = "Lyrics not found.";
                }
            })
            .catch(error => {
                console.error('Error fetching lyrics:', error);
            });
    }

    function setBackgroundOverlay(imageUrl) {
        backgroundOverlay.style.backgroundImage = `url('${imageUrl}')`;
    }
});
