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
    const downloadAppModal = document.getElementById('download-app-modal');

    let isPlaying = true;
    let lyricsVisible = true;
    let wakeLock = null;

    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';

    playPauseButton.addEventListener('click', function () {
        togglePlay();
    });

    previousButton.addEventListener('click', function () {
        fetchPreviousOrNextAudio('previous');
    });

    nextButton.addEventListener('click', function () {
        fetchPreviousOrNextAudio('next');
    });

    progressBar.addEventListener('input', function () {
        updateCurrentDuration();
    });

    progressBar.addEventListener('change', function () {
        seekToPosition();
    });

    audioPlayer.addEventListener('timeupdate', function () {
        updateProgressBar();
        updateDurationText();
        syncLyrics();
        localStorage.setItem('audioPlaybackPosition', audioPlayer.currentTime);
        requestWakeLock();
    });

    audioPlayer.addEventListener('loadedmetadata', function () {
        setTotalDuration();
        const storedPlaybackPosition = localStorage.getItem('audioPlaybackPosition');
        if (storedPlaybackPosition) {
            audioPlayer.currentTime = parseFloat(storedPlaybackPosition);
        }
        requestWakeLock();
    });

    window.addEventListener('beforeunload', function (event) {
        event.preventDefault();
        event.returnValue = '';
        showDownloadAppModal();
    });

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

    function syncLyrics() {
        const currentTime = audioPlayer.currentTime;
        const lines = lyricsView.textContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const timeMatch = line.match(/\[(\d+):(\d+)\]/);
            if (timeMatch) {
                const minutes = parseInt(timeMatch[1]);
                const seconds = parseInt(timeMatch[2]);
                const lineTime = minutes * 60 + seconds;
                if (lineTime > currentTime) {
                    const prevLine = i > 0 ? lines[i - 1] : '';
                    lyricsView.innerHTML = `<span class="prev-line">${prevLine}</span><span class="current-line">${line}</span><span class="next-line">${lines[i + 1]}</span>`;
                    break;
                }
            }
        }
    }

    function requestWakeLock() {
        if ('wakeLock' in navigator) {
            if (!wakeLock) {
                navigator.wakeLock.request('screen')
                    .then((wl) => {
                        wakeLock = wl;
                        console.log('Screen Wake Lock acquired');
                    })
                    .catch((err) => {
                        console.error(`${err.name}, ${err.message}`);
                    });
            }
        }
    }

    function showDownloadAppModal() {
        downloadAppModal.style.display = 'block';
    }
});
