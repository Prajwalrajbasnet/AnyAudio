class Player{
  constructor(container, audioCtx){
    this.audioCtx = audioCtx;
    this.container = container;
    this.playBtn = document.getElementById('preview-play');
    this.btnIcon = document.getElementById('play-status');
    this.volumeSlider = document.getElementById('volume-slider');
    this.lowpassFilter = document.getElementById('lowpass');
    this.reverbFilter = document.getElementById('reverb');
    this.fadeInEffect = document.getElementById('fade-in');
    this.fadeOutEffect = document.getElementById('fade-out');
    this.previewMixed = document.getElementById('preview-mixed');
    this.saveMixed = document.getElementById('save-mixed');
    this.tracks = [];
    this.activeTrack = 0;
    this.playBtn.addEventListener('click', () => this.playPause());
    this.volumeSlider.addEventListener('input', () => this.updateVolume());
    this.lowpassFilter.addEventListener('change', (ev) => this.addFilter(ev));
    this.reverbFilter.addEventListener('change', (ev) => this.addFilter(ev));
    this.fadeInEffect.addEventListener('change', (ev) => this.addEffect(ev));
    this.fadeOutEffect.addEventListener('change', (ev) => this.addEffect(ev));

    this.previewMixed.addEventListener('click', () => this.checkMixed());
    this.mixer = new Mixer(this, this.audioCtx);
  }

  addTrack(track){
    this.tracks.push(track);
    if(!(track.addedToPlayer)){
      track.addedToPlayer = true;
      this.mixer.init();
      const trackSource = this.mixer.sources['source'+this.tracks.indexOf(track)];
      const modification = new Modify(this.audioCtx, track, trackSource);
      track.modification = modification;
    }
  }

  async getAudioBuffer(arrayBuffer){
    return await this.audioCtx.decodeAudioData(arrayBuffer);
  }

  playPause(){
    if(this.playBtn.dataset.playing === 'true'){
      this.tracks[this.activeTrack].stopProgress();
      this.tracks[this.activeTrack].srcElement.pause();
      this.btnIcon.classList = 'fas fa-play';
      this.playBtn.dataset.playing = 'false';
    }
    else if(this.playBtn.dataset.playing === 'false'){
      this.tracks[this.activeTrack].srcElement.play();
      if(this.fadeIn) this.tracks[this.activeTrack].modification.configureFadeInEffect();
      if(this.fadeOut) this.tracks[this.activeTrack].modification.configureFadeOutEffect();
      this.tracks[this.activeTrack].startProgress();
      this.btnIcon.classList = 'fas fa-pause';
      this.playBtn.dataset.playing = 'true';
    }
    if(this.tracks){
      this.tracks[this.activeTrack].srcElement.addEventListener('ended', () => this.resetPlayback());
    }
  }

  resetPlayback(){
    this.playBtn.dataset.playing = 'false';
    this.btnIcon.classList = 'fas fa-play';
  }

  changeTrack(trackNo){
    this.activeTrack = trackNo;
  }

  initializeTrack(){
    this.tracks[this.activeTrack].trackWaveForm.classList = 'track active';
    this.configureHandlers();
    this.changeActive();
    if(this.tracks.length > 1){
      this.loadTracks();
    }
  }

  updateVolume(){
    if(this.tracks){
      this.tracks[this.activeTrack].volume = this.volumeSlider.value;
      this.tracks[this.activeTrack].modification.changeGain();
    }
  }

  addFilter(ev){
    if(ev.target.id.includes('lowpass')){

      if(this.lowpassFilter.checked){
        this.tracks[this.activeTrack].modification.lowPassActive = true;
      }
      else{
        this.tracks[this.activeTrack].modification.lowPassActive = false;
      }
    }
    if(ev.target.id.includes('reverb')){
      if(this.reverbFilter.checked){
        this.tracks[this.activeTrack].modification.reverbActive = true;
      }
      else{
        this.tracks[this.activeTrack].modification.reverbActive = false;
      }
    }
    this.tracks[this.activeTrack].modification.setAudioGraph();
  }

  addEffect(ev){
    if(ev.target.id.includes('fade-in')){

      if(this.fadeInEffect.checked){
        this.fadeIn = true;
      }
      else{
        this.fadeIn = false;
      }
    }
    if(ev.target.id.includes('fade-out')){
      if(this.fadeOutEffect.checked){
        this.fadeOut = true;
      }
      else{
        this.fadeOut = false;
      }
    }
  }

  checkMixed(){
    if(this.previewMixed.dataset.active == 'true'){
      this.previewMixed.dataset.active = 'false';
      this.tracks.forEach(track => {
        track.srcElement.currentTime = 0;
        track.stopProgress();
        track.progressBar.style.left = 0;
        if(this.tracks.indexOf(track) != this.activeTrack)
        track.trackWaveForm.classList.remove('active');
      });
    }
    else{
      this.previewMixed.dataset.active = 'true';
      this.playMixed();
    }
  }

  playMixed (){
    for(var i = 0; i < this.tracks.length; i++){
      this.tracks[i].trackWaveForm.classList.add('active');
      this.tracks[i].progressBar.style.left = 0;
      this.tracks[i].srcElement.currentTime = this.tracks[i].startTime;
      this.tracks[i].startProgress();
      this.tracks[i].srcElement.play();
    }
  }

  createMix(){
    this.mixer.saveMix();
  }

  changeActive(){
    this.tracks[this.activeTrack].setTrimInput(this.tracks[this.activeTrack].endTime, 'end');
    this.tracks.forEach(track => {
      track.trackWaveForm.addEventListener('click',  () => {
        if(!(track.trackWaveForm.classList.contains('active'))){
          const prevActiveTrack = this.tracks[this.activeTrack];
          prevActiveTrack.trackWaveForm.classList.remove('active');

          track.trackWaveForm.classList.add('active');
          track.setTrimInput(track.endTime, 'end');
          this.playBtn.dataset.playing = 'true';
          this.playPause();
          this.activeTrack = this.tracks.indexOf(track);
          this.volumeSlider.value = track.volume;
          this.configureHandlers();
        }        
      });
    });
  }

  loadTracks(){
    for(var i = 0; i < this.tracks.length; i++){
      this.tracks[i].srcElement.load();
    }
  }

  configureHandlers(){
    const track = this.tracks[this.activeTrack];
    document.getElementById('minute-start').oninput = (ev) => track.changeStartTime(ev);
    document.getElementById('second-start').oninput = (ev) => track.changeStartTime(ev);
    document.getElementById('centisecond-start').oninput = (ev) => track.changeStartTime(ev);
    document.getElementById('minute-end').oninput = (ev) => track.changeEndTime(ev);
    document.getElementById('second-end').oninput = (ev) => track.changeEndTime(ev);
    document.getElementById('centisecond-end').oninput = (ev) => track.changeEndTime(ev);
    document.getElementById('minute-end').max = track.endTime / 60;
    document.getElementById('minute-start').max = track.endTime / 60;
  }
}