var that;
class WaveVisualizer{
  constructor(canvas, audioBuffer = '', audioCtx = '', source = ''){
    if(source){
      this.source = source;
    }
    if(audioCtx){
      this.audioCtx = audioCtx;
    }
    if(audioBuffer){
      this.audioBuffer = audioBuffer;
    }
    this.canvas = canvas;
    this.canvas.width = this.canvas.offsetWidth;
    this.canvasCtx = canvas.getContext('2d');
    that = this;
  }

  renderRealTime(){
    if(this.source && this.audioCtx){
      this.analyser = this.audioCtx.createAnalyser();
      this.source.connect(this.analyser);
      this.analyser.fftSize = 1024;
      this.totalDataPoints = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.totalDataPoints);
      this.draw();
    }
  }

  draw(){
    if(!(that.audioCtx)) return;
    that.canvasCtx.clearRect(0, 0, that.canvas.offsetWidth, ACTIVE_CANVAS_HEIGHT);
    let dotPos = 0;
    while(dotPos < that.canvas.width){
      that.canvasCtx.beginPath();
      that.canvasCtx.arc(dotPos, that.canvas.height / 2, 1, 0, Math.PI * 2);
      that.canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      that.canvasCtx.fill();
      dotPos += 9;
    }
    that.analyser.getByteFrequencyData(that.dataArray);
    const barWidth = 3;
    const spacing = 6;
    let xOffset = 0;
    let barHeight;
    for(let i = 0; i < that.totalDataPoints; i++){  
      const ratio = that.dataArray[i] / 255; //255 is the maximum possible value of an index in dataArray
      barHeight = ratio * ACTIVE_CANVAS_HEIGHT;
      that.canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      let halfBar = barHeight / 2;

      that.canvasCtx.fillRect(xOffset, ACTIVE_CANVAS_HEIGHT/2, barWidth, -halfBar);
      that.canvasCtx.fillRect(xOffset, ACTIVE_CANVAS_HEIGHT/2, barWidth, halfBar);
      xOffset += spacing;
    }
    const drawBars = requestAnimationFrame(that.draw);
  }

  renderRecording(){
    const rawData = that.audioBuffer.getChannelData(0);
    const barWidth = 1;
    const spacing = 4;
    let jump = that.blockSize(barWidth, spacing, rawData.length);
    let averagedData = [];

    for(let k = 0; k < rawData.length; k += jump){
      const averaged = that.averageOfPoints(k , jump, rawData)
      averagedData.push(averaged);
    }
    const usableData = that.scaleDataPoints(averagedData);
    let barHeight = 0;
    let xOffset = 0;
    that.canvasCtx.clearRect(0, 0, that.canvas.width, ACTIVE_CANVAS_HEIGHT);
    that.canvasCtx.translate(0, ACTIVE_CANVAS_HEIGHT / 2);
    that.canvasCtx.beginPath();
    
    usableData.forEach(data => {
      barHeight = Math.abs(data * that.canvas.height);
      let halfBar = barHeight/ 2;

      that.canvasCtx.moveTo(xOffset, 0);
      that.canvasCtx.lineTo(xOffset, -halfBar);
      that.canvasCtx.lineTo(xOffset, halfBar);
      that.canvasCtx.strokeStyle = 'rgb(255, 255, 255)';
      that.canvasCtx.lineWidth = barWidth;
      that.canvasCtx.stroke();
      
      xOffset += spacing;
    });
  }

  blockSize(barWidth, spacing, totalPoints){
    //calclulate how many bars canvas can fit and return the number of points one bar should accomodate
    let singleEntry = barWidth + (spacing - barWidth); 
    const canvasWidth = this.canvas.width;
    let possibleBars = canvasWidth / singleEntry;
    return Math.floor((totalPoints / possibleBars));  
  }

  averageOfPoints(from, count, arr){
    //return average of given number of indexes in an array
    let aggregate = 0;
    if( from + count < arr.length){
      for(let i = from; i < from + count; i++){
        aggregate += arr[i];
      }
    }
    return aggregate / count;
  }

  scaleDataPoints(averagedData){
    //the data points are very small very close to 0 so this scales them with max value as 1
    const multiplier = Math.pow(Math.max(...averagedData), -1); //make an inverse of the max value in array
    return averagedData.map(point => point * multiplier);
  }
}