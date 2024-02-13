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

    let isPlaying = false;

    playPauseButton.addEventListener('click', function () {
        if (isPlaying) {
            audioPlayer.pause();
            playImg.style.display = 'block';
            pauseImg.style.display = 'none';
        } else {
            audioPlayer.play();
            playImg.style.display = 'none';
            pauseImg.style.display = 'block';
        }
        isPlaying = !isPlaying;
    });

    previousButton.addEventListener('click', function () {
        // Fetch previous audio
        fetchPreviousOrNextAudio('previous');
    });

    nextButton.addEventListener('click', function () {
        // Fetch next audio
        fetchPreviousOrNextAudio('next');
    });

    audioPlayer.addEventListener('timeupdate', function () {
        const currentTime = audioPlayer.currentTime;
        const duration = audioPlayer.duration;
        const progress = (currentTime / duration) * 100;
        progressBar.value = progress;

        // Update current duration text
        currentDuration.textContent = formatTime(currentTime);
    });

    progressBar.addEventListener('input', function () {
        // Update current duration text while seeking
        currentDuration.textContent = formatTime(audioPlayer.currentTime);
    });

    progressBar.addEventListener('change', function () {
        // Seek to the selected position
        const progress = progressBar.value;
        const duration = audioPlayer.duration;
        const currentTime = (progress / 100) * duration;
        audioPlayer.currentTime = currentTime;
    });

    audioPlayer.addEventListener('loadedmetadata', function () {
        // Update total duration text once metadata is loaded
        totalDuration.textContent = formatTime(audioPlayer.duration);
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

        // Set background image and blur effect
        backgroundOverlay.style.backgroundImage = `url('${thumbnailUrl}')`;

        // Fetch lyrics
        fetchLyrics(author, title);
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

                    // Update background image and blur effect
                    backgroundOverlay.style.backgroundImage = `url('${nextThumbnailUrl}')`;

                    // Fetch lyrics
                    fetchLyrics(nextAuthor, nextTitle);
                } else {
                    console.log(`No ${direction} audio available.`);
                }
            })
            .catch(error => {
                console.error(`Error fetching ${direction} audio:`, error);
            });
    }

    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    }

    function fetchLyrics(artist, title) {
        const apiKey = '9e7e11749a9fbba1ea9c7adef4b11ab3'; 
        const apiUrl = `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?format=json&apikey=${apiKey}&q_artist=${encodeURIComponent(artist)}&q_track=${encodeURIComponent(title)}`;

        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                if (data.message.body.lyrics) {
                    const lyrics = data.message.body.lyrics.lyrics_body;
                    displayLyrics(lyrics);
                } else {
                    console.log('Lyrics not found');
                }
            })
            .catch(error => {
                console.error('Error fetching lyrics:', error);
            });
    }

    function displayLyrics(lyrics) {
        lyricsView.textContent = lyrics;
    }
});
