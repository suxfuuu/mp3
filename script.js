const audio = document.getElementById('audio-player');
const playlist = document.getElementById('playlist');
const volumeSlider = document.getElementById('volume');
const volumePercentage = document.getElementById('volume-percentage');
let currentTrackIndex = 0;
let tracks = [];

// Carregar volume salvo
const savedVolume = localStorage.getItem('volume');
if (savedVolume) {
    audio.volume = savedVolume;
    volumeSlider.value = savedVolume;
    updateVolumePercentage();
}

// Event Listeners
document.getElementById('file-input').addEventListener('change', addFiles);
volumeSlider.addEventListener('input', updateVolume);

document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => {
    e.preventDefault();
    addFiles({ target: { files: e.dataTransfer.files } });
});

// Funções de controle
audio.addEventListener('timeupdate', updateProgressBar);
audio.addEventListener('ended', nextTrack);

document.querySelector('.progress-container').addEventListener('click', function(e) {
    const rect = this.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
});

function togglePlayPause() {
    if (audio.paused) {
        audio.play();
        document.getElementById('play-pause').textContent = '⏸';
    } else {
        audio.pause();
        document.getElementById('play-pause').textContent = '▶';
    }
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(currentTrackIndex);
}

function previousTrack() {
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(currentTrackIndex);
}

function playTrack(index) {
    if (tracks.length === 0) return;
    
    currentTrackIndex = index;
    const track = tracks[index];
    audio.src = track.url;
    audio.play();
    document.getElementById('play-pause').textContent = '⏸';
    document.getElementById('current-song').textContent = track.name;
    
    // Atualizar classe de destaque na playlist
    Array.from(playlist.children).forEach((item, i) => {
        item.classList.toggle('playing', i === index);
    });
}

function updateVolume() {
    audio.volume = volumeSlider.value;
    localStorage.setItem('volume', volumeSlider.value);
    updateVolumePercentage();
}

function updateVolumePercentage() {
    volumePercentage.textContent = `${Math.round(volumeSlider.value * 100)}%`;
}

function updateProgressBar() {
    const progress = (audio.currentTime / audio.duration) * 100 || 0;
    document.getElementById('progress-bar').style.width = `${progress}%`;
}

async function addFiles(e) {
    const newFiles = Array.from(e.target.files);
    
    for (const file of newFiles) {
        if (file.type.startsWith('audio/')) {
            tracks.push({
                name: file.name,
                url: URL.createObjectURL(file)
            });
        }
    }
    
    updatePlaylist();
    if (tracks.length === newFiles.length) playTrack(0);
}

function clearPlaylist() {
    tracks = [];
    currentTrackIndex = 0;
    audio.pause();
    audio.src = '';
    updatePlaylist();
    document.getElementById('current-song').textContent = 'Nenhuma música selecionada';
}

function updatePlaylist() {
    playlist.innerHTML = tracks
        .map((track, index) => `
            <li onclick="playTrack(${index})" class="${index === currentTrackIndex ? 'playing' : ''}">
                ${track.name}
            </li>
        `)
        .join('');
}

// Suporte para pastas (WebkitDirectory)
const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', handleDirectory);

async function handleDirectory(e) {
    const files = await getFilesFromDirectory(e.target.files);
    addFiles({ target: { files } });
}

async function getFilesFromDirectory(files) {
    const fileEntries = Array.from(files)
        .filter(file => file.webkitRelativePath)
        .map(file => ({ file, path: file.webkitRelativePath.split('/') }));

    return fileEntries
        .filter(({ file }) => file.type.startsWith('audio/'))
        .map(({ file }) => file);
}
