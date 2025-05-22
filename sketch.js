
let rawText = `Soft-lit and mystic.
with snowfall sifting down.
and a mauve December sunset.
not this gauche flash.
this flesh akimbo.
caught in the glare of your stare.`;

let letters = [];
// —— 参数 —— 
const baseFontSize    = 25;   // 设计时默认字号（暂作最小字号用）
const marginRatio     = 0.10; // 左右各留 10% 画布宽度
const marginY         = 40;   // 上下边距固定 px
const typeInterval    = 2;    
const maxOffset       = 35;   
const floatSpeed      = 0.1;
const gyroSensitivity = 1;

let charIndex = 0;
let prevRotX  = 0, prevRotY = 0;

// 用于保存陀螺仪数据（iOS/安卓/PC通用）
let globalRotationX = 0, globalRotationY = 0;

// =============== 音乐功能集成 ================
let bgMusic;

function preload() {
  bgMusic = loadSound('dream.mp3');
}
// ============================================

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  noStroke();
  fill(20);
  textFont('sans-serif');
  initLetters();
  initGyroPermission();

  // 自动尝试播放音乐（PC和部分安卓能自动，iOS/微信需用户交互后才会响）
  if (bgMusic && !bgMusic.isPlaying()) {
    bgMusic.loop();
  }
}

function initLetters() {
  letters = [];
  charIndex = 0;

  // —— 步骤1：测量并拆分行 —— 
  textSize(baseFontSize);
  let lines = rawText.split('\n');
  let lineCount = lines.length;

  // —— 步骤2：计算页边距与可用宽度 —— 
  let marginX      = width * marginRatio;
  let maxLineWidth = width - marginX * 2;
  let minLetterGap = baseFontSize * 0.25;
  let maxLetterGap = baseFontSize * 0.7;

  // 行高直接用字号的 1.2 倍
  let lineSpacing = baseFontSize * 1.2;

  // —— 步骤3：垂直居中起点 —— 
  let contentHeight = (lineCount - 1) * lineSpacing;
  let startY = (height - contentHeight) / 2;
  startY = constrain(startY, marginY, height - marginY - contentHeight);

  // —— 步骤4：逐行动态字距并水平居中 —— 
  for (let row = 0; row < lineCount; row++) {
    let txt = lines[row];
    // 动态字距：均分到 maxLineWidth 上
    let gap = txt.length>1
      ? constrain(maxLineWidth / (txt.length - 1), minLetterGap, maxLetterGap)
      : 0;
    let lineWidth = gap * (txt.length - 1);

    // 这行的起始 X（在左右 margin 里再居中）
    let startX = marginX + (maxLineWidth - lineWidth) / 2;

    // 为每个字符记录位置和相位
    for (let i = 0; i < txt.length; i++) {
      let x = startX + i * gap;
      let y = startY + row * lineSpacing;
      letters.push({
        char:  txt[i],
        baseX: x,
        baseY: y,
        phase: random(TWO_PI)
      });
    }
  }
}

function draw() {
  background(250);

  // 打字机
  if (frameCount % typeInterval === 0 && charIndex < letters.length) {
    charIndex++;
  }
  let floatEnabled = charIndex >= letters.length;

  // 使用陀螺仪数据
  let dX = globalRotationX - prevRotX;
  let dY = globalRotationY - prevRotY;
  prevRotX = globalRotationX;
  prevRotY = globalRotationY;
  let delta = sqrt(dX*dX + dY*dY);
  let norm  = constrain(delta / gyroSensitivity, 0, 1);
  let amp   = floatEnabled && norm>0 ? norm * maxOffset : 0;

  // 绘制字符
  for (let i = 0; i < charIndex; i++) {
    let l = letters[i];
    let yOff = amp * sin(frameCount * floatSpeed + l.phase);
    textSize(baseFontSize); // 保持字号一致
    textAlign(CENTER, CENTER);
    text(l.char, l.baseX, l.baseY + yOff);
  }

  // 再保险一层：自动尝试播放（对iOS/安卓影响不大，但PC和部分安卓有效）
  if (bgMusic && !bgMusic.isPlaying()) {
    bgMusic.loop();
  }
}

// 陀螺仪权限申请与数据监听
function initGyroPermission() {
  // iOS 13+ 必须用户交互触发权限请求
  if (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof DeviceOrientationEvent.requestPermission === 'function'
  ) {
    let btn = createButton('启用陀螺仪体验动态效果');
    btn.position(width / 2 - 90, height / 2);
    btn.style('font-size', '18px');
    btn.style('padding', '12px 28px');
    btn.style('background', '#222');
    btn.style('color', '#fff');
    btn.style('border-radius', '8px');
    btn.mousePressed(() => {
      DeviceOrientationEvent.requestPermission()
        .then(response => {
          if (response === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
            btn.remove();
          } else {
            alert('需要陀螺仪权限以体验完整效果');
          }
        })
        .catch(console.warn);
      // 补一层：如果iOS用户未点按钮，音乐已无法自动，点按钮也可尝试
      if (bgMusic && !bgMusic.isPlaying()) {
        bgMusic.loop();
      }
    });
  } else {
    // 安卓/PC直接监听
    window.addEventListener('deviceorientation', handleOrientation, true);
    if (bgMusic && !bgMusic.isPlaying()) {
      bgMusic.loop();
    }
  }
}

// 陀螺仪事件处理
function handleOrientation(e) {
  globalRotationX = e.beta  || 0; // X轴旋转
  globalRotationY = e.gamma || 0; // Y轴旋转
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initLetters();
}

function touchStarted() {
  // 激活音频上下文（iOS必须）
  userStartAudio();
  if (bgMusic && !bgMusic.isPlaying()) {
    bgMusic.loop();
  }
}

function mousePressed() {
  userStartAudio();
  if (bgMusic && !bgMusic.isPlaying()) {
    bgMusic.loop();
  }
}

