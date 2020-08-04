class AudioFile{
  constructor(audioCtx){
    this.audioCtx = audioCtx;
  }

  async loadFile(ev){
    const file = ev.target.files[0];
    this.fileURL = URL.createObjectURL(file);
    const trackName = getTrackDisplayName('file', file, '');
    
    this.audioBuffer = await file.arrayBuffer().then(buffer => getAudioBuffer(buffer, this.audioCtx));
    this.track = new Track(this.fileURL, this.audioBuffer, trackName);
    this.element = this.track.srcElement;
    audioContainer.appendChild(this.element);
    audioInput.style.display = 'block';
    this.fileLoaded = true;

    const downloadBtn = document.getElementById('download-mixed');
    downloadBtn.href = this.fileURL;
    downloadBtn.download = generateFilename('recording');
  }
}