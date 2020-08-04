class Karaoke extends Recorder{
  constructor(){
  super();
  this.addBackground();
  this.childBlinkClicked = 0;
  this.mic = document.getElementById('mic');
  this.mic.onclick = () => {this.startKaraoke()};
  this.backgroundLoaded = false;
  this.recordingLoaded = false;
  }

  async loadFile(ev){
    const file = ev.target.files[0];
    const backgroundmusicUrl = URL.createObjectURL(file);
    const trackName = getTrackDisplayName('file', file, '');

    const audioBuffer = await file.arrayBuffer().then(buffer => this.player.getAudioBuffer(buffer));
    this.backgroundTrack = new Track(backgroundmusicUrl, audioBuffer, trackName);
    this.backgroundMusicElement = this.backgroundTrack.srcElement;
    audioContainer.appendChild(this.backgroundMusicElement);
    audioInput.style.display = 'none';
    this.fileLoaded = true;
  }

  loadRecording(track, elem){
    this.backgroundTrack = track;
    this.backgroundMusicElement = elem;
    this.recordingLoaded = true;
  }

  addBackground(){
    this.addMusic = document.getElementById('addMusic');
    this.addMusic.onchange = (ev) => {this.loadFile(ev)};

  }

  handleRecording(){
    super.handleRecording();
    this.mediaRecorder.addEventListener('stop', () => {
      this.player.addTrack(this.backgroundTrack);
      this.player.initializeTrack();
    });
  }

  pauseRecording(){
    super.pauseRecording();
    if(this.childBlinkClicked == 0){
      this.backgroundMusicElement.pause();
      clearInterval(this.backgroundMusicProgress);
      this.childBlinkClicked++;
    }
    else{
      this.backgroundMusicElement.play();
      this.visualizeBackgroundTrackProgress();
      this.childBlinkClicked = 0;
    }
  }

  startKaraoke(){
    this.startCountdown();
    setTimeout(() => {
      if(this.fileLoaded  || this.recordingLoaded){
        this.backgroundMusicElement.play();
        this.visualizeBackgroundTrackProgress();
        super.init();
        document.querySelector('.recording-controls').style.display = 'block';
        document.getElementById('mic').style.display = 'none';
        this.backgroundMusicElement.addEventListener('ended', () => this.endRecording());
      }
    }, 2400);
  }

  endRecording(){
    super.endRecording();
    this.backgroundMusicElement.load();
    if(this.backgroundMusicProgress) clearInterval(this.backgroundMusicProgress);
    this.backgroundTrack.inactiveLeft.style.width = '0%';
  }

  visualizeBackgroundTrackProgress(){
    const progressBar = this.backgroundTrack.inactiveLeft;
    progressBar.style.background = 'rgba(0, 0, 0, 0.5)';
    const updateTime = 10; //ms
    const dx = (updateTime / (this.backgroundTrack.duration * 1000)) * 100; //percentage to be added per updateTime ms
    this.backgroundMusicProgress = setInterval(() => {
      const widthPercent = parseFloat(progressBar.style.width) || 0;
      progressBar.style.width = (widthPercent + dx) + '%';
      if(parseFloat(progressBar.style.width) >= 100){
        clearInterval(this.backgroundMusicProgress);
        progressBar.style.width = '0%';
      }
    }, updateTime);
  }

  async startCountdown(){
    const countdownScreen = document.querySelector('.countdown-overlay');
    const countNumber = document.getElementById('count-number');
    countdownScreen.style.display = 'block';
    const buffer = await getAudioBufferFromFile('./audio/countdown.mp3');
    let counter = setInterval(() => {
      const count = parseInt(countNumber.innerHTML);
      if(count > 2){
        clearInterval(counter);
        countdownScreen.style.display = 'none';
      }
      countNumber.innerHTML = count + 1;
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);
      source.start(0);
    }, 800);
  }
}