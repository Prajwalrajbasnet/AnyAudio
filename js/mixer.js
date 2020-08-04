class Mixer{
constructor(player, audioCtx){
  this.player = player;
  this.tracks = this.player.tracks;
  this.audioCtx = audioCtx;
  this.sources = {};
  this.buffers = [];
  this.sampleRate = SAMPLE_RATE;
}

init(){
  let startPoint = this.tracks.length - 1; //as track before it would have already been added to sources
  for(var i = startPoint; i < this.tracks.length; i++){
    const srcName = 'source'+i;
    this.sources[srcName] = this.audioCtx.createMediaElementSource(this.tracks[i].srcElement);
    this.buffers.push(this.tracks[i].bufferData);
  }
}

saveMix(){
    let mergedBuffer = this.buffers.length > 1 ? this.mergeSound() : this.buffers[0];
    const totalSamples = this.sampleRate * mergedBuffer.duration;
    const blob = audioBufferToWav(mergedBuffer, totalSamples);
    const url = URL.createObjectURL(blob);
    const finalAudio = document.getElementById('final-audio');
    finalAudio.src = url;

    const downloadBtn = document.getElementById('download-mixed');
    downloadBtn.href = url;
    downloadBtn.download = generateFilename('recording');
}

//merge two different audioBuffers by placing channelData of each one in respective place
mergeSound(){
  let outputSound = this.audioCtx.createBuffer(1, 
    this.sampleRate * this.maxDuration(),
    this.sampleRate );
  this.buffers.map(buffer => {
    for(let i = buffer.getChannelData(0).length - 1; i >= 0; i--){
      outputSound.getChannelData(0)[i] += buffer.getChannelData(0)[i];
    }
  });
  return outputSound;
}

maxDuration(){
  return Math.max.apply(Math, this.buffers.map(buffer => buffer.duration));
}
}