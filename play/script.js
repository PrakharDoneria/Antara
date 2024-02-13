document.addEventListener("DOMContentLoaded", function () {
    const audioPlayer = document.getElementById('audio-player');
    const audioSource = document.getElementById('audio-source');
    const audioThumbnail = document.getElementById('audio-thumbnail');
    const playPauseButton = document.getElementById('play-pause-button');
    const previousButton = document.getElementById('previous-button');
    const nextButton = document.getElementById('next-button');
    const progressBar = document.getElementById('progress-bar');
    const playImg = document.getElementById('play-img');
    const pauseImg = document.getElementById('pause-img');
    const songNameElement = document.getElementById('song-name');
    const artistNameElement = document.getElementById('artist-name');
    const backgroundOverlay = document.getElementById('background-overlay');
    const currentDuration = document.getElementById('current-duration');
    const totalDuration = document.getElementById('total-duration');
    const lyricsView = document.getElementById('lyrics-view');
    const lyricsToggleButton = document.getElementById('lyrics-toggle-button');

    let isPlaying = false;
    let lyricsVisible = false;

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
        updateLyrics();
    });

    progressBar.addEventListener('input', function () {
        updateCurrentDuration();
    });

    progressBar.addEventListener('change', function () {
        seekToPosition();
    });

    audioPlayer.addEventListener('loadedmetadata', function () {
        setTotalDuration();
        restorePlaybackTime();
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
            songNameElement.textContent = title;
        }

        if (author) {
            artistNameElement.textContent = author;
        }

        backgroundOverlay.style.backgroundImage = `url('${thumbnailUrl}')`;

        fetchLyrics(author, title);
    }

    function togglePlay() {
        if (isPlaying) {
            audioPlayer.pause();
            if (playImg) playImg.style.display = 'block';
            if (pauseImg) pauseImg.style.display = 'none';
        } else {
            audioPlayer.play();
            if (playImg) playImg.style.display = 'none';
            if (pauseImg) pauseImg.style.display = 'block';
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

                    fetchLyrics(nextAuthor, nextTitle);
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
        localStorage.setItem('playbackTime', currentTime);
    }

    function updateCurrentDuration() {
        const progress = progressBar.value;
        const duration = audioPlayer.duration;
        const currentTime = (progress / 100) * duration;
        currentDuration.textContent = formatTime(currentTime);
    }

    function seekToPosition() {
        const progress = progressBar.value;
        const duration = audioPlayer.duration;
        const currentTime = (progress / 100) * duration;
        audioPlayer.currentTime = currentTime;
    }

    function setTotalDuration() {
        totalDuration.textContent = formatTime(audioPlayer.duration);
    }

    function restorePlaybackTime() {
        const storedTime = localStorage.getItem('playbackTime');
        if (storedTime) {
            audioPlayer.currentTime = parseFloat(storedTime);
        }
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

    lyricsToggleButton.addEventListener('click', function () {
        toggleLyricsView();
    });

    function toggleLyricsView() {
        if (lyricsVisible) {
            lyricsView.classList.remove('lyrics-visible');
        } else {
            lyricsView.classList.add('lyrics-visible');
        }
        lyricsVisible = !lyricsVisible;
    }
});
