const videoGrid = document.getElementById('videoGrid');
const muteBtn = document.getElementById('muteBtn');
const participantsList = document.getElementById('participants');

let localStream = null;
let audioEnabled = true;
const participants = new Set();

/**
 * Gestiona la creación y eliminación de elementos de video
 * y nuevas funciones de UI (mute, lista de participantes, etc.)
 */
export const UIManager = {
    // ====== VIDEO ======
    createVideoElement: (userId) => {
        const videoElement = document.createElement('video');
        videoElement.id = `video-${userId}`;
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.style.backgroundColor = 'black';
        videoGrid.appendChild(videoElement);
        return videoElement;
    },

    removeVideoElement: (userId) => {
        const videoElement = document.getElementById(`video-${userId}`);
        if (videoElement) videoElement.remove();
    },

    // ====== MUTE / UNMUTE ======
    setLocalStream: (stream) => {
        localStream = stream;
    },

    toggleMute: () => {
        if (!localStream) return;

        const audioTracks = localStream.getAudioTracks();
        if (audioTracks.length === 0) return;

        audioEnabled = !audioEnabled;
        audioTracks[0].enabled = audioEnabled;

        if (muteBtn) muteBtn.textContent = audioEnabled ? '🔊 Mic On' : '🔇 Mic Off';
        console.log(audioEnabled ? '🎙️ Mic activado' : '🤫 Mic silenciado');
    },

    // ====== PARTICIPANTES ======
    addParticipant: (userId) => {
        participants.add(userId);
        UIManager.updateParticipantsUI();
    },

    removeParticipant: (userId) => {
        participants.delete(userId);
        UIManager.updateParticipantsUI();
    },

    updateParticipantsUI: () => {
        if (!participantsList) return;
        participantsList.innerHTML = '';
        participants.forEach(id => {
            const li = document.createElement('li');
            li.textContent = `${id.substring(0, 8)}`;
            participantsList.appendChild(li);
        });
    }
};

// Si el botón existe, conectamos el evento
if (muteBtn) {
    muteBtn.addEventListener('click', UIManager.toggleMute);
}
