const mic = document.getElementById('mic');
//UI buttons and elements for app state handling
const filters = document.querySelector('.filters');
const recordBtn = document.getElementById('record');
const addMusic = document.getElementById('addMusic');
const proceedBtn = document.getElementById('proceed');
const recorderDiv = document.querySelector('.recorder');
const audioInput = document.querySelector('.audioInput');
const karaokeBtn = document.getElementById('karaoke-btn');
const appFeatures = document.getElementById('app-features') 
const ringtoneBtn = document.getElementById('ringtone-btn');
const timeCounter = document.querySelector('.time-counter');
const joinMusicBtn = document.getElementById('join-music-btn');
const previewJoined = document.getElementById('preview-joined');
const audioContainer = document.querySelector('.audio-container');
const singleRecording = document.getElementById('single-recording');
const playbackControls = document.getElementById('playback-controls');
const singleRecordingBtn = document.getElementById('single-recording');
const recordingControls = document.querySelector('.recording-controls');

recordBtn.onclick = () =>{
  appFeatures.style.display = 'none';
  recorderDiv.style.display = 'block';
  playRecordingStartSound();
  const hybridRecorder = new Recorder();
  setTimeout(() => {
    hybridRecorder.init();
    hybridRecorder.recordUponEnabled = true;
  }, 50);
}

karaokeBtn.onclick = () => {
  renderContainerWithFileInput();
  mic.style.display = 'block';
  const karaoke = new Karaoke(); 
}

ringtoneBtn.onclick = () => {
  audioInput.style.display = 'block';
  timeCounter.style.display = 'none';
  renderContainerWithFileInput();
  const rawAudio = new AudioFile(AUDIOCTX);
  addMusic.onchange = (ev) => {rawAudio.loadFile(ev)};
  (async () => {
    await until( () => rawAudio.fileLoaded == true);
    let rawTrack = rawAudio.track;
    const trimmer = new Player(audioContainer, AUDIOCTX);
    setupAppletCreateRingtone(rawTrack, trimmer);
  })();
}

singleRecording.onclick = () => {
  appFeatures.style.display = 'none';
  recorderDiv.style.display = 'block';
  const recorder = new Recorder();
  recorder.player.previewMixed.style.display = 'none';
  recorder.init();
}

joinMusicBtn.onclick = () => {
  renderContainerWithFileInput();
  timeCounter.style.display = 'none';
  files = [];
  soundTracks = [];
  addMusic.onchange = (ev) => {
    files.push(new AudioFile(AUDIOCTX));
    const presentFile = files[files.length - 1];
    presentFile.loadFile(ev);
    if(files.length >= 2){
      proceedBtn.style.display = 'block';
    }
  }
  proceedBtn.onclick = () => {
    audioInput.style.display = 'none';
    proceedBtn.style.display = 'none';
    files.forEach(file => {
      (async () => {
        await until(() => file.fileLoaded == true);
        soundTracks.push(file.track);

        if(files.length === soundTracks.length){
          setupAppletJoinMusic(soundTracks);
        }
      })();
    });
  }
}

function setupAppletCreateRingtone(rawTrack, trimmer){
  trimmer.addTrack(rawTrack);
  trimmer.initializeTrack();
  trimmer.previewMixed.style.display = 'none';
  filters.style.display = 'none';
  audioInput.style.display = 'none';
  playbackControls.style.display = 'block';
}

function setupAppletJoinMusic(soundTracks){
  playbackControls.style.display = 'block';
  filters.style.display = 'none';
  const holder = new Player(audioContainer, AUDIOCTX);
  holder.previewMixed.style.display = 'none';
  previewJoined.style.display = 'block';
  const joiner = new Joiner(soundTracks, holder);
}

function renderContainerWithFileInput(){
  appFeatures.style.display = 'none';
  recorderDiv.style.display = 'block';
  recordingControls.style.display = 'none';
  audioInput.style.display = 'block';
}

async function playRecordingStartSound(){
  const buffer = await getAudioBufferFromFile('./audio/recording-start.mp3');
  const source = AUDIOCTX.createBufferSource();
  source.buffer = buffer;
  source.connect(AUDIOCTX.destination);
  source.start(0);
}
