//convert provided audiobuffer to a blob with WAVE representation
function audioBufferToWav(audioBuffer,totalSamples){
  let noOfChannel = audioBuffer.numberOfChannels, 
  length = totalSamples * noOfChannel * 2 + 44,
  buffer = new ArrayBuffer(length),
  dataView = new DataView(buffer), 
  channels = [], 
  sample,
  offset = 0, 
  pos = 0,
  sampleRate = audioBuffer.sampleRate;

  function setUint16(data){
    dataView.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data){
    dataView.setUint32(pos, data, true);
    pos += 2;
  }

  //writing WAVE headers
  setUint32(0x46464952);                            // "RIFF"
  setUint32(length - 8);                            //file length - 8
  setUint32(0x45564157);                            //"WAVE"
  setUint32(0x20746d66);                            //"fmt" chunk
  setUint32(16);                                    //length
  setUint16(1);                                     //PCM
  setUint16(noOfChannel);                           
  setUint32(sampleRate);                            
  setUint32(sampleRate * 2 * noOfChannel);          //bytes/sec
  setUint16(noOfChannel * 2);                       //align block
  setUint16(16);                                    //16 bit

  setUint32(0x61746164);                            //"data" chunk
  setUint32(length - pos - 4);                       //length of chunk

  for(let i = 0; i < noOfChannel; i++){
    channels.push(audioBuffer.getChannelData(i));
  }

  while(pos < length){
    for(let j = 0; j < noOfChannel; j++){
      sample = Math.max(-1, Math.min(1, channels[j][offset])); //clamp for greatest minimum sample
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; //scale to 16-bit signed int
      dataView.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }
  return new Blob([buffer], {type: 'audio/wav'});
}