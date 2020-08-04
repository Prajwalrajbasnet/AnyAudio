class Modify{
  constructor(audioCtx, track, trackSource){
    this.audioCtx = audioCtx;
    this.track = track;
    this.trackAudioElement = this.track.srcElement;
    this.trackSource = trackSource;
    this.init();
  }

  async init(){
    this.gainNode = this.audioCtx.createGain();
    this.fade = this.audioCtx.createGain();

    this.lowPass = this.audioCtx.createBiquadFilter();
    this.reverbEffect = this.audioCtx.createConvolver();
    this.reverbEffect.buffer = await getAudioBufferFromFile('./audio/impulse-response.wav');
    this.lowPass.type = 'lowpass';
    this.lowPass.frequency.value = 1300;
    this.lowPassActive = false;
    this.reverbActive = false;

    this.trackSource.connect(this.fade);
    this.reverbEffect.connect(this.gainNode);
    this.lowPass.connect(this.gainNode);
    this.fade.connect(this.gainNode);
    this.gainNode.connect(this.audioCtx.destination);
  
  }

  changeGain(){
    this.gainNode.gain.value = this.track.volume;
  }

  setAudioGraph(){
    if(this.lowPassActive){
      this.fade.disconnect(0);
      this.fade.connect(this.lowPass);
    }
    
    else if(this.reverbActive){
      this.fade.disconnect(0);
      this.fade.connect(this.reverbEffect);
    }

    else{
      this.fade.disconnect(0);
      this.fade.connect(this.gainNode);
    }
  }

  configureFadeInEffect(){
    this.fade.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime);
    this.fade.gain.linearRampToValueAtTime(1, this.audioCtx.currentTime + FADE_TIME);
  }

  configureFadeOutEffect(){
    const effectiveDuration = this.track.endTime - this.track.startTime;
    this.fade.gain.linearRampToValueAtTime(1, (this.audioCtx.currentTime + effectiveDuration - FADE_TIME));
    this.fade.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + effectiveDuration);
  }
}