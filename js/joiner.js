class Joiner{
  constructor(soundTracks, holder){
    this.soundTracks = soundTracks;
    this.player = holder;
    this.preview = previewJoined;
    this.preview.addEventListener('click', () => this.previewJoined());
    this.counter = 0;
    this.buffers = [];
    document.getElementById('save-mixed').addEventListener('click', () => this.saveJoined());
    this.init();
  }

  init(){
    this.soundTracks.forEach(soundTrack => {
      this.player.addTrack(soundTrack);
      this.player.initializeTrack();
      this.buffers.push(soundTrack.bufferData);
    });
  }

  previewJoined(){
    const activeTrack = this.soundTracks[this.counter];
    let clickEvent = new Event('click');
    this.player.tracks[this.counter].trackWaveForm.dispatchEvent(clickEvent);
    activeTrack.srcElement.play();
    activeTrack.startProgress();
    const duration = (activeTrack.endTime - activeTrack.startTime) * 1000;
    let nextSongTimer = setTimeout(() => {
      this.counter += 1;
      this.player.tracks[this.counter].trackWaveForm.dispatchEvent(clickEvent);
      this.previewJoined();
    }, duration);
    if(this.counter == (this.soundTracks.length - 1)){
      clearTimeout(nextSongTimer);
      this.counter = 0;
    }
  }

  saveJoined(){
    let concatenatedBuffer = this.getConcatBuffer();

    const totalSamples = this.sampleRate * concatenatedBuffer.duration;
    const blob = audioBufferToWav(concatenatedBuffer, totalSamples);
    const url = URL.createObjectURL(blob);
    const finalAudio = document.getElementById('final-audio');
    finalAudio.src = url;

    const downloadBtn = document.getElementById('download-mixed');
    downloadBtn.href = url;
    downloadBtn.download = generateFilename('joined','');
  }

  getConcatBuffer(){
    let outputBuffer = AUDIOCTX.createBuffer(
      1, this.combinedLength(this.buffers), SAMPLE_RATE);
    let offset = 0;
    this.buffers.map(buffer => {
      outputBuffer.getChannelData(0).set(buffer.getChannelData(0), offset);
      offset += buffer.length;
    });
    return outputBuffer;
  }

  combinedLength(buffers){
    return buffers.map(buffer => buffer.length).reduce((j, k) => j + k, 0);
  }
}