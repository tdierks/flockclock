function timeToString(when) {
  const phase = when.getSeconds()%20;
  if (phase > 0 && phase <= 2) {
    return "Sunday";
  } else if (phase > 2 && when.getSeconds()%20 <= 4) {
    return "Feb 7";
  } else {
    return when.getHours().toString().padStart(2,"0") + ":" +
           when.getMinutes().toString().padStart(2,"0") + ":" +
           when.getSeconds().toString().padStart(2,"0");
  }
}

function renderTime(ctx, when) {
  renderString(ctx, timeToString(when));
}

const INTER_CHAR = 20; // pixels to leave between characters
const PIX_PITCH = 5; // spacing from pixel center to pixel center
const PIX_SIZE = 3; // diameter of pixels
const CHAR_PIX_H = 5; // number of pixels wide a character is
const CHAR_PIX_V = 7; // and tall

function renderPix(ctx, pix) {
  ctx.beginPath();
  pix.forEach(function([xCtr, yCtr]) {
    ctx.moveTo(xCtr + PIX_SIZE/2, yCtr);
    ctx.ellipse(xCtr, yCtr,
                PIX_SIZE / 2, PIX_SIZE / 2,
                0, 0, Math.PI * 2);
  });
  ctx.fill();
}

function renderString(ctx, s) {
  const pix = stringToPix(s);
  renderPix(ctx, pix);
}

function stringToPix(s) {
  const pix = [];
  let xPos = 0;
  let yPos = numHeight * 0.3;
  s.split('').forEach(function(c) {
    if (c == '\n') {
      xPos = 0;
      yPos = yPos + lineHeight * PIX_PITCH + INTER_CHAR * 2;
    } else if (c == ' ') {
      xPos = xPos + Math.floor(numWidth * 0.6) * PIX_PITCH;
    } else {
      const l = charToPix(c);
      l.pix.forEach(function([x,y]) {
        const xCtr = xPos + x * PIX_PITCH + PIX_PITCH/2;
        const yCtr = yPos + (y + numHeight) * PIX_PITCH + PIX_PITCH/2;
        pix.push([xCtr, yCtr]);
      });
      xPos += (l.width * PIX_PITCH) + INTER_CHAR;
    }
  });
  return pix;
}

function comparePix([x1,y1],[x2,y2]) {
  if (x1 != x2) {
    return x1-x2;
  } else {
    return y1-y2;
  }
}

function intersectPix(startPix, endPix) {
  const same = [];
  const start = [];
  const end = [];
  const startPts = Array.from(startPix);
  const endPts = Array.from(endPix);
  startPts.sort(comparePix);
  endPts.sort(comparePix);
  var startIdx = 0;
  var endIdx = 0;
  while (startIdx < startPts.length && endIdx < endPts.length) {
    const c = comparePix(startPts[startIdx], endPts[endIdx]);
    if (c == 0) {
      same.push(startPts[startIdx]);
      startIdx += 1;
      endIdx += 1;
    } else if (c < 0) {
      start.push(startPts[startIdx]);
      startIdx += 1;
    } else {
      end.push(endPts[endIdx]);
      endIdx += 1;
    }
  }
  while (startIdx < startPts.length) {
    start.push(startPts[startIdx]);
    startIdx += 1;
  }
  while (endIdx < endPts.length) {
    end.push(endPts[endIdx]);
    endIdx += 1;
  }
  return [same, start, end];
}

// https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript/47593316#47593316
function xmur3(str) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

function shuffle(array, randFunc) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(randFunc() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function easeInOutCubic(t) {
  return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1;
}


function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;

  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function circleInterpolate(a, b, t) {
  const xCtr = (a[0] + b[0])/2;
  const yCtr = (a[1] + b[1])/2;
  const xDiff = a[0] - xCtr;
  const yDiff = a[1] - yCtr;
  const r = Math.sqrt(xDiff * xDiff + yDiff * yDiff);
  const startAngle = Math.atan2(yDiff, xDiff);
  const angle = t * Math.PI + startAngle;
  const x = xCtr + Math.cos(angle) * r;
  const y = yCtr + Math.sin(angle) * r;
  return [x, y];
}

function circleInterpolateR(a, b, t) {
  return circleInterpolate(a,b,-t);
}

function multipleInterpolate(iFns) {
  var idx = 0;
  var lastT = 0;
  return function(a, b, t) {
    if (t < lastT) {
      idx = idx + 1;
      if (idx > iFns.length) {
        idx = 0;
      }
    }
    lastT = t;
    return iFns[idx](a, b, t);
  }
}

const tickTockInterpolate = multipleInterpolate([circleInterpolate, circleInterpolateR])

function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0])* t, a[1] + (b[1]-a[1])*t];
}

function shuffleMatch(start, end, randFunc) {
  while (start.length < end.length) {
    start = start.concat(start.slice(0, end.length - start.length));
  }
  while (end.length < start.length) {
    end = end.concat(end.slice(0, start.length - end.length))
  }
  shuffle(start, randFunc);
  shuffle(end, randFunc);
  return [start,end];
}

function centroidMatch(start, end, randFunc) {
  [start, end] = shuffleMatch(start, end, randFunc);
  var xSum = 0;
  var ySum = 0;
  const addPt = p => { xSum += p[0]; ySum += p[1]; }
  start.forEach(addPt);
  end.forEach(addPt);
  const xCtr = xSum / (start.length + end.length);
  const yCtr = ySum / (start.length + end.length);
  const distSq = (x,y) => (x-xCtr)*(x-xCtr) + (y-yCtr)*(y-yCtr);
  const byDist = ([ax,ay],[bx,by]) => distSq(ax, ay) - distSq(bx, by);
  const byDistR = (a, b) => -byDist(a, b);
  start.sort(byDist);
  end.sort(byDistR);
  return [start, end];
}

const CONFIG = {
  'ease': easeInOutCubic,
  'interpolate': circleInterpolate,
  'matchPts': centroidMatch
}

// const START_TIME = new Date('20 Jan 2021 19:20:00').getTime();
// const TIME_DILATION = 10;

function update() {
  const canvas = document.getElementById("fc");
  const ctx = canvas.getContext('2d');
  const now = new Date();
//   now.setTime(START_TIME + (now.getTime() - START_TIME) / TIME_DILATION); // **
  const currSec = new Date();
  currSec.setTime(now.getTime());
  currSec.setMilliseconds(0);
  const nextSec = new Date();
  nextSec.setTime(currSec.getTime() + 1000);
  const currSecStr = timeToString(currSec);
  const currPix = stringToPix(currSecStr);
  const nextPix = stringToPix(timeToString(nextSec));
  var t = (now.getMilliseconds()/1000 - 0.1) / 0.9;
  if (t < 0) {
    t = 0;
  } else if (t > 1) {
    t = 1;
  }
  t = CONFIG['ease'](t);
  var [same, start, end] = intersectPix(currPix, nextPix, t);
  const randFunc = mulberry32(xmur3(currSecStr)());
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  renderPix(ctx, same);
  [start, end] = CONFIG['matchPts'](start, end, randFunc);
  const interpolated = [];
  var interpolateFunc = CONFIG['interpolate'];
  for (var i = 0; i < start.length; ++i) {
    interpolated.push(interpolateFunc(start[i], end[i], t));
  }
  ctx.fillStyle = "black";
  renderPix(ctx, interpolated);
}

function animate(when) {
  update();
  window.requestAnimationFrame(animate);
}

window.addEventListener('load', function(event) {
  window.requestAnimationFrame(animate);
});

function charToPix(c) {
  const cs = (c in bigNumbers) ? c : '?';
  return bigNumbers[cs];
}

const bigNumbers = {};
var numWidth;
var numHeight;
var lineHeight;

window.addEventListener('load', function(event) {
  numHeight = 0;
  numWidth = 0;
  var maxDescent = 0;
  "1234567890:SundayFebru".split('').forEach(c => {
    const v = renderCharToPix(c, '60px serif', 80);
    bigNumbers[c] = v;
    numWidth = Math.max(numWidth, v['width']);
    numHeight = Math.max(numHeight, v['height']);
    maxDescent = Math.max(maxDescent, v['descent'])
  });
  lineHeight = numHeight + maxDescent;
});

function renderCharToPix(c, fontStyle, dimension) {
  const canvas = document.createElement('canvas');
  canvas.height = dimension;
  canvas.width = dimension;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, dimension, dimension);
  ctx.font = fontStyle;
  const baseline = Math.floor(dimension * 0.7);
  ctx.fillText(c, 0, baseline);
  const imgData = ctx.getImageData(0,0,dimension,dimension);
  const getPixel = function getPixel(x,y) {
    const index = Math.floor(y) * imgData.width * 4 + Math.floor(x) * 4;
    return [imgData.data[index], imgData.data[index+1],
      imgData.data[index+2], imgData.data[index+3]];
  };
  
  const pix = [];
  let minX = dimension;
  let maxX = 0;
  let minY = dimension;
  let maxY = 0;
  
  for (let x = 0; x < dimension; x += 1) {
    for (let y = 0; y < dimension; y += 1) {
      let [r,g,b,a] = getPixel(x, y);
      if (r == 0 && a != 0) {
        pix.push([x,y]);
        minX = Math.min(x, minX);
        maxX = Math.max(x, maxX);
        minY = Math.min(y, minY);
        maxY = Math.max(y, maxY);
      }
    }
  }
  
  const adjustedPix = pix.map(([x, y]) => [x - minX, y - baseline]);
  const height = baseline - minY;
  const descent = maxY - baseline;
  const width = maxX - minX;
  return {
    'pix': adjustedPix,
    'height': height,
    'descent': descent,
    'width': width
  };
}