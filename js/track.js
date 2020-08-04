class Track{
  constructor(srcURL, audioBuffer, trackName){
    this.srcURL = srcURL;
    this.srcElement = document.createElement('audio');
    this.srcElement.src = this.srcURL;
    this.trackName = trackName;
    this.trackWaveForm = this.createTrackElement();

    this.startingMinute = document.getElementById('minute-start');
    this.startingSecond = document.getElementById('second-start');
    this.startingCentisecond = document.getElementById('centisecond-start');
    this.endingMinute = document.getElementById('minute-end');
    this.endingSecond = document.getElementById('second-end');
    this.endingCentisecond = document.getElementById('centisecond-end');

    this.srcElement.onloadedmetadata = () => { //duration gives NaN if accessed without having metadata loaded
      this.duration = this.srcElement.duration;
      //hacky support code for chromium 
      // chromium bug gives Infinity as duration for audio created from a blob
      if(this.duration === Infinity){
        this.srcElement.currentTime = Number.MAX_SAFE_INTEGER; //setting currenttime to very big number
        this.srcElement.ontimeupdate = () => { //once currenttime is changed get the duration
          this.srcElement.ontimeupdate = null; //removing the event listener
          this.duration = this.srcElement.duration;
          this.srcElement.currentTime = 0;
          this.srcElement.load();
          this.rightHandle.dataset.timestamp = timestampMinute(this.duration);
          this.endTime = this.duration;
          this.setTrimInput(this.duration, 'end');
        }
      }
      this.rightHandle.dataset.timestamp = timestampMinute(this.duration);
      this.setTrimInput(this.duration, 'end');
      this.endTime = this.duration;
      this.srcElement.onloadedmetadata = null; //removing the onloadedmetadata listener
    }

    this.volume = 1.5;
    this.modification = {};
    this.bufferData = audioBuffer;
    this.trackWaveForm.appendChild(this.srcElement);
    document.querySelector('.audio-container').appendChild(this.trackWaveForm);
    this.visualize(this.bufferData);
    this.progressBarClickEvent = this.handles.addEventListener('click', (ev) => this.repositionProgressBar(ev));

    this.makeResizeable();

    this.startTime = 0;
    this.leftPer = 0;
    this.rightPer = 0;
    this.trimmed = false;
    this.addedToPlayer = false;
    // this.trimmedByHandle = false;
  }

  createLoop(){
    this.srcElement.loop = true;
  }

  createTrackElement(){
    const track = document.createElement('div');
    track.dataset.title = this.trackName;
    track.classList = 'track';
    const waveform = document.createElement('div');
    waveform.className = 'waveform';
    this.canvas = document.createElement('canvas');
    this.handles = document.createElement('div');
    this.handles.className = 'handles';
    this.leftHandle = document.createElement('div');
    this.rightHandle = document.createElement('div');
    this.leftHandle.classList = 'handle left-handle';
    this.leftHandle.dataset.timestamp = '00:00:00';
    this.rightHandle.classList = 'handle right-handle';
    this.rightHandle.dataset.timestamp = '00:00:00';
    const progress = document.createElement('div');
    progress.classList = 'progress';

    this.inactiveLeft = document.createElement('div');
    this.inactiveLeft.classList = 'inactive inactive-left';
    this.inactiveRight = document.createElement('div');
    this.inactiveRight.classList = 'inactive inactive-right';
    this.progressBar = document.createElement('div');
    this.progressBar.style.left = '0%';
    this.progressBar.dataset.timestamp = '00:00:00';
    this.progressBar.id = 'progress-bar';
    
    progress.appendChild(this.progressBar);
    this.handles.appendChild(this.leftHandle);
    this.handles.appendChild(this.rightHandle);
    this.handles.appendChild(progress);
    track.appendChild(this.inactiveLeft);
    track.appendChild(this.handles);
    waveform.appendChild(this.canvas);
    track.appendChild(waveform);
    track.appendChild(this.inactiveRight);

    return track;
  }

  visualize(audioBuffer){
    this.bufferData = audioBuffer;
    this.trackVisualizer = new WaveVisualizer(this.canvas, this.bufferData);
    this.trackVisualizer.renderRecording();
  }

  startProgress(){
    const incrementTime = 10; //ms
    let duration;
    if(this.startTime != 0 || this.endTime != this.duration){
      duration = this.endTime - this.startTime;
    }
    else{
      duration = this.duration;
    }
    const dx = (incrementTime / (duration * 1000));
    //move bar every 100 ms
    this.moveBar = setInterval(() => {
      if(parseFloat(this.progressBar.style.left) >= 100 || parseInt(this.progressBar.style.left) + 
      (dx * 100) >= 100 || parseInt(this.progressBar.style.left <= 0)){
        this.progressBar.style.left = 0;
        this.progressBar.dataset.timestamp = timestampMinute(timeRelativeToPosition((parseInt(this.progressBar.style.left))
        , this.duration));
        clearInterval(this.moveBar);
        this.resetProgress();
        // return;
      }
      else{
        let last = parseFloat(this.progressBar.style.left);
        let updated = ((dx * 100) + last); //percentage
        let time = timeRelativeToPosition((updated), duration);
        this.progressBar.style.left = updated + '%';
        this.progressBar.dataset.timestamp = timestampMinute(time);
      }
    }, 600/60);
  }

  stopProgress(){
    clearInterval(this.moveBar);
  }

  repositionProgressBar(ev){
    const offsetX = ev.offsetX;
    const progressWidth = document.querySelector('.progress').offsetWidth;
    const leftPer = ((offsetX / progressWidth) * 100);
    const time = timeRelativeToPosition((leftPer + this.leftPer), this.duration);
    this.srcElement.currentTime = time;
    this.progressBar.style.left = leftPer + '%';
    this.progressBar.dataset.timestamp = timestampMinute(time);
  }

  resetProgress(){
    this.srcElement.pause();
    this.srcElement.currentTime = this.startTime;
    document.getElementById('play-status').classList = 'fas fa-play';
    document.getElementById('preview-play').dataset.playing = 'false';
    this.stopProgress();
  }

  changeStartTime(ev){
    const minute = this.startingMinute.value;
    const seconds = this.startingSecond.value;
    const centisecond = this.startingCentisecond.value;
    this.startTime = (minute * 60) + Number(seconds) + (centisecond / 100);
    this.srcElement.currentTime = this.startTime;
    this.trimmed = true;
    const leftPer = positionRelativeToTime(this.startTime, this.duration);
    this.moveHandles(leftPer, '');
    this.progressBar.style.left = 0 + '%';
  }
  
  changeEndTime(ev){
    const minute = this.endingMinute.value;
    const seconds = this.endingSecond.value;
    const centisecond = this.endingCentisecond.value;
    this.endTime = (Number(minute) * 60) + Number(seconds) + (Number(centisecond) / 100);
    this.trimmed = true;
    const rightPer = positionRelativeToTime(this.endTime, this.duration);
    this.moveHandles('',rightPer);
    this.progressBar.style.left = 0 + '%';
  }

  moveHandles(leftPer = '', rightPer = ''){
    if((leftPer + this.rightPer) != 100 || (this.leftPer + rightPer) != 100){
      this.resetProgress();
      if(leftPer != '' || leftPer === 0){
        this.leftPer = leftPer;
        if(this.leftPer <= 100 && this.leftPer >= 0){
          this.handles.style.left = this.leftPer + '%';
          this.inactiveLeft.style.width = this.leftPer + '%';
          const time = timeRelativeToPosition(this.leftPer, this.duration);
          this.leftHandle.dataset.timestamp = timestampMinute(time);
          this.setTrimInput(time,'start');
        }
        else if(this.leftPer >= 100){
          this.leftPer = 100;
        }
        else if(this.leftPer <= 0){
          this.leftPer = 0;
        }
      }
      if(rightPer != '' || rightPer === 0){
        this.rightPer = this.trimmedByHandle ? rightPer : 100 - rightPer;
        if(this.rightPer >= 0 && this.rightPer <= 100){
          this.handles.style.right = (this.rightPer) + '%';
          this.inactiveRight.style.width =(this.rightPer) + '%';
          const handlePosition = 100 - this.rightPer; //calculating percentage
          const time = timeRelativeToPosition(handlePosition, this.duration);
          this.rightHandle.dataset.timestamp = timestampMinute(time);
          this.setTrimInput(time, 'end');
        }
        else if(this.rightPer >= 100){
          this.rightPer = 100;
        }
        else if(this.rightPer <= 0){
          this.rightPer = 0;
        }
      }
    }
    this.handles.style.width = (100 - (this.leftPer + this.rightPer)) + '%';
    this.progressBar.dataset.timestamp = timestampMinute(timeRelativeToPosition(this.leftPer, this.duration));
  }
  
  setTrimInput(seconds, of){
    const timestamp = timestampMinute(seconds).split(':');
    eval('this.'+of+'ingMinute.value = timestamp[0]; this.'+of+'ingSecond.value = timestamp[1]; this.'+
    of+'ingCentisecond.value = timestamp[2]');
  }

  makeResizeable(){
    const rect = this.trackWaveForm.getBoundingClientRect();
    const leftHandleDefault = rect.x; //position of left handle is alligned with start of waveform element initially
    const rightHandleDefault = rect.width + rect.x; //position of right handle is alligned with end of waveform element initially
    const boundaryWidth = rect.width;
    const handles = [this.leftHandle, this.rightHandle];
    for(let handle of handles){
      let activeHandle = handle;
      handle.addEventListener('mousedown', () => {
        let calculatePosition = (ev) => {
          const mouseX = ev.pageX;
          if(handle.classList.contains('left-handle')){
            const dx = mouseX - leftHandleDefault;
            const leftPer = (dx / boundaryWidth) * 100;
            const time = timeRelativeToPosition(leftPer, this.duration);
            this.startTime = time;
            this.srcElement.currentTime = time;
            this.moveHandles(leftPer, '');
            this.progressBar.style.left = 0 + '%';
          }
          else if(handle.classList.contains('right-handle')){
            const dx = rightHandleDefault - mouseX;
            const rightPer = (dx / boundaryWidth) * 100;
            this.endTime = timeRelativeToPosition((100 - rightPer), this.duration); //timeRelativeToPosition gives time for left percentage
            this.moveHandles('', rightPer);
            this.trimmedByHandle = true;
            this.progressBar.style.left = 0 + '%';
          }
        }
        let stopCalculation = () => {
          window.removeEventListener('mousemove', calculatePosition);
          window.removeEventListener('mouseup', stopCalculation);
        }
        window.addEventListener('mousemove', calculatePosition);
        window.addEventListener('mouseup', stopCalculation);
      });
    }
  }
}