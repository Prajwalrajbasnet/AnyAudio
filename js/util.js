async function getAudioBuffer(arrayBuffer, audioCtx){
  return await audioCtx.decodeAudioData(arrayBuffer);
}

async function getAudioBufferFromFile(url){
  let response = await fetch(url);
  let arrBuffer = await response.arrayBuffer();
  let audioBuffer = await AUDIOCTX.decodeAudioData(arrBuffer);
  return audioBuffer;
}

function audioBufferToArray(audioBuffer){
  let buffer = audioBuffer.getChannelData(0);
  let len = buffer.length * 2;
  let output = new Float32Array(len);
  let rIndex = 0;
  let inputIndex = 0;

  while(rIndex < len){
    output[rIndex++] = buffer[inputIndex];
    output[rIndex++] = buffer[inputIndex];
    inputIndex++;
  }
  return output;
}

function generateFilename(type, file = ''){
  let generatedName;
  if(type == 'file'){
    let originalName = file.name;
    const lastPositionBeforeExtension = originalName.lastIndexOf('.');
    let withoutExtension = originalName.slice(0, lastPositionBeforeExtension);
    generatedName = 'AnyAudio - '+withoutExtension;
  }
  else if(type == 'recording'){
    const d = new Date();
    let timestamp  = d.toLocaleString();
    const mark = 'AnyAudio Recording ';
    generatedName = mark + timestamp +'.wav';
  }
  else if(type == 'joined'){
    const d = new Date();
    let timestamp  = d.toLocaleString();
    const mark = 'AnyAudio Mix ';
    generatedName = mark + timestamp +'.wav';
  }
  return generatedName;
}

function getTrackDisplayName(type, file = '', trackNo = ''){
  let displayName;
  if(type == 'file'){
    displayName = file.name;
  }
  else if(type == 'recording'){
    displayName = 'Recording '+ trackNo;
  }
  return displayName;
}

function createAudioBuffer(file, audioCtx){
  let reader = new FileReader();
  let output;
  reader.onload = ev => {
    audioCtx.decodeAudioData(ev.target.result).then( audioBuffer => {
      return audioBuffer;
    });
  }
  reader.readAsArrayBuffer(file);
}

function timeRelativeToPosition(leftPercent, duration){
  //returns time according to the left position
  return (leftPercent * duration) / 100;
}

function positionRelativeToTime(time, duration){
  //return how much percent a element should be left or right respective to the time
  return (time / duration) * 100;
}

function timestampMinute(timeInSeconds){
  const mins = Math.floor(timeInSeconds / 60); //converting to minutes
  const seconds = Math.floor(timeInSeconds % 60); //converting to seconds
  const centiSeconds = Math.floor((timeInSeconds * 100) % 100); //converting to centiseconds 100cs = 1s
  return mins.toString().padStart(2, 0) + ':' + seconds.toString().padStart(2, 0) + ':' + centiSeconds.toString().padStart(2, 0);
}

function timestampHour(timeInSeconds){
  const hrs = Math.floor(timeInSeconds / 3600); //converting to hours
  const mins = Math.floor((timeInSeconds % 3600)/60); //converting to minutes
  const seconds = Math.floor(timeInSeconds % 60); //converting to seconds
  return hrs.toString().padStart(2, 0) + ':' + minutes.toString().padStart(2, 0) + ':' + seconds.toString().padStart(2, 0);
}

function until (conditionFunc){
  const poll = resolve => {
    if(conditionFunc()){
      resolve();
    }
    else{
      setTimeout(() => poll(resolve), 400);
    }
  }
  return new Promise(poll);
}