class Recorder{
  constructor(){
    this.audioCtx = AUDIOCTX;
    this.player = new Player(audioInput, this.audioCtx);
    this.canvas = document.getElementById('realtime');
    this.blinkClicked = 0;
    this.pauseBlink = 0;
    this.pause = document.getElementById('pause');
    this.pause.onclick = () => this.pauseRecording();
    this.end = document.getElementById('end');
    this.end.onclick = () => this.endRecording();
    this.recordUpon = document.getElementById('mic');
    this.recordUpon.onclick = () => this.recordUponPrevious();
    this.recordUponEnabled = false;
  }

  init(){
    navigator.mediaDevices.getUserMedia({ audio: true})
    .then(stream => {
      this.mediaRecorder = new MediaRecorder(stream);
      this.initiateWebform(stream);
      this.handleRecording();
    });
    this.startCounter();
  }

  handleRecording(){
      this.mediaRecorder.start();
      this.audioChunks = [];
      this.mediaRecorder.addEventListener('dataavailable', event => {
        this.audioChunks.push(event.data);
    });

    this.mediaRecorder.addEventListener('stop', async () => {
      this.realtimeWaveForm.style.display = 'none';
      const audioBlob = new Blob(this.audioChunks, {type: 'audio/mpeg-3'});
      const audioURL = URL.createObjectURL(audioBlob);
      const recordingNo = this.player.tracks.length > 1 ? (this.player.tracks.length - 1) : 0;
      const recordingName = getTrackDisplayName('recording', '', recordingNo);

      const downloadBtn = document.getElementById('download-mixed');
      downloadBtn.href = audioURL;
      downloadBtn.download = generateFilename('recording');
      const audioBuffer = await audioBlob.arrayBuffer().then(buffer => this.player.getAudioBuffer(buffer));
      this.recording = new Track(audioURL, audioBuffer, recordingName);
      this.player.addTrack(this.recording);
      this.player.initializeTrack();
    })

  }

  startCounter(){
    const sd = new Date();
    this.startTime = sd.getTime();
    this.updateTimer();
  }

  initiateWebform(stream){
    this.realtimeWaveForm = document.querySelector('.realtime-wave-container');
    this.realtimeWaveForm.style.display = 'block';
    const source = this.audioCtx.createMediaStreamSource(stream);
    this.visualizer = new WaveVisualizer(this.canvas, '', this.audioCtx, source );
    this.visualizer.renderRealTime();
  }

  updateTimer(){
    this.timerInterval = setInterval(() => {
      const ad = new Date();
      this.rTime = ad.getTime() - this.startTime;
      const minutes = Math.floor(this.rTime / 60000); //calculate minutes from milliseconds
      const seconds = Math.floor((this.rTime % 60000) / 1000); //calculate seconds from milliseconds

      const timer = document.getElementById('timer');
      timer.innerHTML = minutes.toString().padStart(2, 0) + ':' +seconds.toString().padStart(2, 0);
    }, 100);
  }

  pauseRecording(){
    if(this.blinkClicked == 0){
      this.pauseBlink = setInterval(() => {
      this.pause.classList.toggle('pause-blink');
      }, 700);
      clearInterval(this.timerInterval);
      this.mediaRecorder.pause();
      this.canvas.style.visibility = 'hidden';
      this.blinkClicked++;
      
    }
    else if (this.blinkClicked > 0){
      clearInterval(this.pauseBlink);
      this.pause.classList.remove('pause-blink');
      this.blinkClicked = 0;
      const ed = new Date();
      let elapsed = ed.getTime() - this.startTime;
      this.startTime += elapsed - this.rTime;
      this.mediaRecorder.resume();
      this.canvas.style.visibility = 'visible';
      this.updateTimer();
    }
    }

  endRecording(){
    if(this.mediaRecorder.state != 'inactive'){
      this.mediaRecorder.stop();
    }
    clearInterval(this.timerInterval);
    if(!this.setUpRecording){
      this.playRecordingEndSound();
    }
    recordingControls.style.display = 'none';
    playbackControls.style.display = 'block';
    if(this.recordUponEnabled){
      this.recordUpon.style.display = 'block';
    }
    this.setUpRecording = true;
  }

  recordUponPrevious(){;
    const recordedAudioElem = this.recording.srcElement;
    const recordedAudioBuff = this.recording.bufferData;
    const recordedTrack = this.recording;
    const recordingOnRecorded = new Karaoke();
    recordingOnRecorded.player = this.player;
    recordingOnRecorded.loadRecording(recordedTrack, recordedAudioElem);
    recordingOnRecorded.startKaraoke();
  }

  async playRecordingEndSound(){
    const buffer = await getAudioBufferFromFile('./audio/recording-end.mp3');
    const source = AUDIOCTX.createBufferSource();
    source.buffer = buffer;
    source.connect(AUDIOCTX.destination);
    source.start(0);
  }
}