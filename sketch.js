// PALETTE & FONTS
let scriptFont = 'cursive';
let sansFont = 'Helvetica';
const palette = {
  court: '#d2f0da',
  courtLine: '#f8f9f2',
  grass: '#b8e3c0',
  ball: '#ffc3d6',
  accent: '#f7b0c5',
  overlay: 'rgba(255, 214, 231, 0.72)',
  mint: '#c7f2e3',
  gold: '#f8dd9e',
  deepMint: '#a4d9bf',
  shadow: 'rgba(0, 0, 0, 0.1)'
};

// COURT
let canvasEl;
let canvasW;
let canvasH;
let courtPadding;
let courtTop;
let courtBottom;
let courtLeft;
let courtRight;
let serviceBoxWidth;
let netX;
let hudHeight;
let messagePanelHeight;
let uiSpacing;
let giftPanel;

// RACKETS
let racketWidth;
let racketHeight;
let racketMargin;
let racketFollowEase;
let rackets;

// BALL
let ball;
let ballSize;
let initialBallSpeed;
let rallyActive = true;
let rallyCount = 0;
let notePauseFrames = 0;

// MESSAGES
const messages = [
  "you make normal days feel special",
  "i like our little world",
  "you’re easy to talk to",
  "i care about you a lot",
  "shopping dates with you = elite",
  "you look cute even in hoodies",
  "your laugh is my favorite sound"
];
let messageIndex = 0;
let messageAlpha = 255;
let messageYOffset = 0;
let popOscillator;
let musicOscillator;
let musicEnabled = true;
let bgMusic;
let bgMusicLoaded = false;
let rallyPulse = 0;
let musicPulse = 0;
let bounceRipples = [];

// PARTICLES & HEARTS
let sparkles = [];
let sparkleLifeRange;
let hearts = [];

// SURPRISE
let surpriseActive = false;
let surpriseStartTime = 0;
let dimAlpha;

// CONFETTI
let confettiPieces = [];
let confettiCount;
let confettiColors;

// GIFT GAME
let giftBoxes = [];
const giftMessages = [
  "I’d go shopping with you any day.",
  "You can pick, I’ll carry.",
  "You look good in everything.",
  "Let’s match outfits soon.",
  "Window shopping + you = perfect"
];

// INPUT
let clickHandled = false;

function preload() {
  soundFormats('mp3', 'ogg');
  // Optional: load a soft loop if available in the repo; falls back to synth pad if missing
  bgMusic = loadSound('assets/music/song.mp3', () => {
    bgMusicLoaded = true;
    bgMusic.setLoop(true);
    bgMusic.setVolume(0.18);
  }, () => {
    bgMusic = null;
  });
}

function setup() {
  canvasW = min(windowWidth * 0.98, 1180);
  canvasH = min(windowHeight * 0.9, 760);
  if (canvasEl) {
    resizeCanvas(canvasW, canvasH);
  } else {
    canvasEl = createCanvas(canvasW, canvasH);
    canvasEl.id('birthday-canvas');
    const holder = select('#sketch-holder');
    if (holder) {
      canvasEl.parent(holder);
    }
  }

  // COURT measurements derived from canvas
  courtPadding = canvasW * 0.06;
  courtLeft = courtPadding;
  courtRight = canvasW - courtPadding;
  courtTop = canvasH * 0.12;
  courtBottom = canvasH - canvasH * 0.12;
  serviceBoxWidth = (courtRight - courtLeft) * 0.38;
  netX = canvasW / 2;
  uiSpacing = canvasW * 0.03;
  hudHeight = canvasH * 0.16;
  messagePanelHeight = canvasH * 0.1;
  giftPanel = {
    x: courtLeft + uiSpacing * 0.2,
    y: hudHeight + uiSpacing * 2,
    w: canvasW * 0.44,
    h: courtTop * 1.18
  };

  // RACKETS sizing
  racketWidth = canvasW * 0.025;
  racketHeight = canvasH * 0.18;
  racketMargin = courtPadding * 0.8;
  racketFollowEase = 0.15;
  rackets = [
    { x: courtLeft + racketMargin, y: canvasH / 2 },
    { x: courtRight - racketMargin, y: canvasH / 2 }
  ];

  // BALL setup
  ballSize = canvasW * 0.034;
  initialBallSpeed = createVector(canvasW * 0.0075, canvasH * 0.0048);
  ball = {
    pos: createVector(canvasW / 2, canvasH / 2),
    vel: initialBallSpeed.copy()
  };

  // PARTICLES & HEARTS
  sparkleLifeRange = createVector(30, 60); // ~0.5-1s at 60fps
  sparkles = [];
  hearts = [];
  bounceRipples = [];
  rallyPulse = 0;
  musicPulse = 0;
  notePauseFrames = 0;

  // SURPRISE
  dimAlpha = 0;

  // CONFETTI
  confettiCount = 180;
  confettiColors = [
    color('#ffd6e7'),
    color('#f4f2d8'),
    color('#c9f1de'),
    color('#f6d69b'),
    color('#cfe3ff'),
    color('#f5c8ff')
  ];
  initConfetti();

  // GIFT GAME
  initGiftBoxes();

  // SOUND (optional small pop using oscillator)
  if (!popOscillator) {
    popOscillator = new p5.Oscillator('sine');
    popOscillator.start();
  }
  popOscillator.amp(0);

  // Soft background music (gentle sine pad)
  if (!musicOscillator) {
    musicOscillator = new p5.Oscillator('sine');
    musicOscillator.start();
  }
  musicOscillator.amp(0);
  musicOscillator.freq(240);
  musicEnabled = true;
  if (bgMusicLoaded && bgMusic) {
    bgMusic.play();
  } else {
    musicOscillator.amp(0.04, 0.2);
  }
}

function draw() {
  // COURT
  drawCourt();
  updateMusic();

  // HUD + labels
  drawHud();

  // GAMEPLAY
  moveBall();
  drawRackets();
  drawBounceRipples();
  updateMessages();

  // MINI GAME
  drawGiftGame();

  // PARTICLES & HEARTS
  drawParticles();
  drawHearts();

  // REVEAL & CONFETTI
  if (surpriseActive) {
    drawReveal();
    drawConfetti();
  }
}

// COURT: render tennis court lines
function drawCourt() {
  background(palette.grass);

  // Outer court
  stroke(palette.courtLine);
  strokeWeight(5);
  fill(palette.court);
  rect(courtLeft, courtTop, courtRight - courtLeft, courtBottom - courtTop, 14);

  // Doubles alleys tint for authenticity
  noStroke();
  const alleyTint = color(palette.deepMint);
  alleyTint.setAlpha(60);
  fill(alleyTint);
  rect(courtLeft, courtTop, (courtRight - courtLeft) * 0.09, courtBottom - courtTop, 14, 0, 0, 14);
  rect(courtRight - (courtRight - courtLeft) * 0.09, courtTop, (courtRight - courtLeft) * 0.09, courtBottom - courtTop, 0, 14, 14, 0);

  // Center lines
  noFill();
  stroke(255, 90);
  line(courtLeft, (courtTop + courtBottom) / 2, courtRight, (courtTop + courtBottom) / 2);
  stroke(255, 70);
  line(netX, courtTop, netX, courtBottom);

  // Net cord & soft drop shadow for depth
  stroke(palette.deepMint);
  strokeWeight(6);
  line(netX, courtTop, netX, courtBottom);
  stroke(palette.shadow);
  strokeWeight(10);
  line(netX + canvasW * 0.004, courtTop, netX + canvasW * 0.004, courtBottom);

  // Net mesh (subtle)
  stroke(red(color(palette.courtLine)), green(color(palette.courtLine)), blue(color(palette.courtLine)), 16);
  strokeWeight(1.2);
  for (let y = courtTop + uiSpacing * 0.2; y < courtBottom; y += uiSpacing * 0.8) {
    line(netX - serviceBoxWidth * 0.38, y, netX + serviceBoxWidth * 0.38, y);
  }

  // Bounce markers for realism
  noStroke();
  fill(0, 25);
  ellipse(netX, (courtTop + courtBottom) / 2, ballSize * 1.2, ballSize * 0.5);

  // Service boxes
  const serviceLeft = netX - serviceBoxWidth / 2;
  const serviceRight = netX + serviceBoxWidth / 2;
  rect(serviceLeft, courtTop + (courtBottom - courtTop) * 0.15, serviceBoxWidth, (courtBottom - courtTop) * 0.7);
  line(serviceLeft, canvasH / 2, serviceRight, canvasH / 2);
}

// HUD: tidy stats + hints
function drawHud() {
  const panelWidth = canvasW * 0.9;
  const panelX = (canvasW - panelWidth) / 2;
  const panelY = uiSpacing * 0.65;

  push();
  drawingContext.shadowColor = palette.shadow;
  drawingContext.shadowBlur = 20;
  noStroke();
  fill(255, 220);
  rect(panelX, panelY, panelWidth, hudHeight, 18);
  drawingContext.shadowBlur = 0;

  const badgeW = panelWidth * 0.24;
  const badgeH = hudHeight * 0.82;
  const badgeX = panelX + uiSpacing * 0.9;
  const badgeY = panelY + (hudHeight - badgeH) / 2;
  const rallyScale = 1 + rallyPulse * 0.08;

  // Left stack: title + rally badge
  push();
  translate(badgeX, badgeY);
  fill(40, 220);
  textFont(sansFont);
  textSize(canvasH * 0.028);
  textAlign(LEFT, TOP);
  text('rally vibes', 2, -hudHeight * 0.15);
  pop();

  push();
  translate(badgeX + badgeW / 2, badgeY + badgeH / 2);
  scale(rallyScale);
  drawingContext.shadowColor = palette.shadow;
  drawingContext.shadowBlur = 16;
  fill(255);
  stroke(palette.accent);
  strokeWeight(2.4);
  rectMode(CENTER);
  rect(0, 0, badgeW, badgeH, 18);
  drawingContext.shadowBlur = 0;
  noStroke();
  fill(45);
  textFont(sansFont);
  textAlign(CENTER, CENTER);
  textSize(canvasH * 0.028);
  text('[ RALLY ]', 0, -badgeH * 0.15);
  textSize(canvasH * 0.052);
  text(rallyCount, 0, badgeH * 0.2);
  pop();

  // Music toggle switch
  const musicW = panelWidth * 0.26;
  const musicX = badgeX + badgeW + uiSpacing * 1.6;
  const musicY = badgeY;
  push();
  translate(musicX, musicY);
  scale(1 + musicPulse * 0.08);
  drawMusicSwitch(musicW, badgeH);
  pop();

  // Hint block with breathing room
  const hintW = panelWidth * 0.28;
  const hintX = panelX + panelWidth - hintW - uiSpacing;
  const hintY = panelY + hudHeight * 0.22;
  fill(40, 230);
  textFont(sansFont);
  textAlign(LEFT, TOP);
  textSize(canvasH * 0.024);
  textWrap(WORD);
  text('click a gift bag to open\nclick the court for the reveal', hintX, hintY, hintW);
  textSize(canvasH * 0.021);
  fill(60, 190);
  text('hover gifts to see they are clickable', hintX, hintY + hudHeight * 0.42, hintW);
  pop();

  rallyPulse = max(0, rallyPulse - 0.04);
  musicPulse = max(0, musicPulse - 0.05);
}

function drawMusicSwitch(tileW, tileH) {
  const padding = tileH * 0.12;
  const centerY = tileH / 2;
  const switchW = tileW * 0.6;
  const switchH = tileH * 0.32;
  const knobR = switchH * 0.45;
  const knobX = musicEnabled ? switchW / 2 - knobR - padding * 0.2 : -switchW / 2 + knobR + padding * 0.2;
  const iconSpin = musicEnabled ? sin(frameCount * 0.04) * 8 : 0;

  drawingContext.shadowColor = palette.shadow;
  drawingContext.shadowBlur = 14;
  fill(255);
  stroke(palette.deepMint);
  strokeWeight(2);
  rect(0, 0, tileW, tileH, 18);
  drawingContext.shadowBlur = 0;

  noStroke();
  fill(42);
  textFont(sansFont);
  textAlign(LEFT, CENTER);
  textSize(tileH * 0.22);
  text('🎵 music', padding, centerY - switchH * 0.9);

  // switch track
  push();
  translate(tileW - switchW - padding, centerY - switchH * 0.2);
  stroke(0, 20);
  strokeWeight(1.8);
  fill(musicEnabled ? palette.accent : palette.mint);
  rect(0, 0, switchW, switchH, switchH / 2);

  // knob
  fill(255);
  stroke(0, 35);
  strokeWeight(1.5);
  ellipse(knobX + switchW / 2, switchH / 2, knobR * 2, knobR * 2);
  pop();

  // status text
  fill(musicEnabled ? palette.accent : 90);
  noStroke();
  textSize(tileH * 0.18);
  textAlign(LEFT, CENTER);
  text(musicEnabled ? 'on · press M to toggle' : 'off · press M to toggle', padding, centerY + switchH * 0.9);

  // subtle icon spin
  push();
  translate(tileW - padding * 1.6, padding * 1.2);
  rotate(radians(iconSpin));
  textAlign(CENTER, CENTER);
  textSize(tileH * 0.24);
  fill(musicEnabled ? palette.accent : 90);
  text('♪', 0, 0);
  pop();
}

// BALL: movement and collision logic
function moveBall() {
  // RACKETS track ball Y
  for (let i = 0; i < rackets.length; i++) {
    const targetY = constrain(ball.pos.y, courtTop + racketHeight / 2, courtBottom - racketHeight / 2);
    rackets[i].y = lerp(rackets[i].y, targetY, racketFollowEase);
  }

  if (notePauseFrames > 0) {
    notePauseFrames -= 1;
  }

  if (rallyActive && notePauseFrames <= 0) {
    // Update position
    ball.pos.add(ball.vel);
  }

  // Bounce on top/bottom of court
  const halfBall = ballSize / 2;
  if (ball.pos.y - halfBall <= courtTop || ball.pos.y + halfBall >= courtBottom) {
    ball.vel.y *= -1;
    ball.pos.y = constrain(ball.pos.y, courtTop + halfBall, courtBottom - halfBall);
    bounceRipples.push(makeRipple(ball.pos.x, ball.pos.y));
  }

  // Check rackets collision
  checkRacketCollision(rackets[0], 1);
  checkRacketCollision(rackets[1], -1);

  // Draw ball
  noStroke();
  fill(0, 35);
  ellipse(ball.pos.x + ballSize * 0.15, ball.pos.y + ballSize * 0.35, ballSize * 0.9, ballSize * 0.4);
  fill(palette.ball);
  ellipse(ball.pos.x, ball.pos.y, ballSize, ballSize);

  // Sparkle trail only while moving
  if (rallyActive && notePauseFrames <= 0) {
    spawnSparkle(ball.pos.x, ball.pos.y);
  }
}

function checkRacketCollision(racket, direction) {
  const halfBall = ballSize / 2;
  const withinY = ball.pos.y > racket.y - racketHeight / 2 && ball.pos.y < racket.y + racketHeight / 2;
  const hittingLeft = direction === 1 && ball.pos.x - halfBall <= racket.x + racketWidth / 2;
  const hittingRight = direction === -1 && ball.pos.x + halfBall >= racket.x - racketWidth / 2;

  if (withinY && (hittingLeft || hittingRight)) {
    ball.vel.x = abs(ball.vel.x) * direction;
    ball.pos.x = direction === 1 ? racket.x + racketWidth / 2 + halfBall : racket.x - racketWidth / 2 - halfBall;
    ball.vel.y += random(-canvasH * 0.003, canvasH * 0.003);
    triggerMessage();
    playPop();
    rallyCount += 1;
    rallyPulse = 1;
    bounceRipples.push(makeRipple(ball.pos.x, ball.pos.y));
  }
}

// RACKETS: draw paddles
function drawRackets() {
  noStroke();
  fill(palette.mint);
  for (let i = 0; i < rackets.length; i++) {
    const r = rackets[i];
    rect(r.x - racketWidth / 2, r.y - racketHeight / 2, racketWidth, racketHeight, racketWidth / 2);
  }
}

// PARTICLES: sparkle trail
function spawnSparkle(x, y) {
  const life = random(sparkleLifeRange.x, sparkleLifeRange.y);
  sparkles.push({
    x,
    y,
    size: random(ballSize * 0.22, ballSize * 0.38),
    life,
    maxLife: life,
    hue: color(palette.accent)
  });
}

function drawParticles() {
  for (let i = sparkles.length - 1; i >= 0; i--) {
    const p = sparkles[i];
    p.life -= 1;
    const alpha = map(p.life, 0, p.maxLife, 0, 60);
    fill(red(p.hue), green(p.hue), blue(p.hue), alpha);
    noStroke();
    ellipse(p.x, p.y, p.size, p.size);
    if (p.life <= 0) {
      sparkles.splice(i, 1);
    }
  }
}

function makeRipple(x, y) {
  return { x, y, life: 28, max: 28 };
}

function drawBounceRipples() {
  for (let i = bounceRipples.length - 1; i >= 0; i--) {
    const r = bounceRipples[i];
    r.life -= 1;
    const pct = 1 - r.life / r.max;
    const size = lerp(ballSize * 0.8, ballSize * 2.8, pct);
    const alpha = lerp(80, 0, pct);
    noFill();
    stroke(255, alpha);
    strokeWeight(2);
    ellipse(r.x, r.y, size, size * 0.6);
    if (r.life <= 0) {
      bounceRipples.splice(i, 1);
    }
  }
}

// HEARTS: floaty click love
function spawnHearts(x, y) {
  const count = floor(random(5, 10));
  for (let i = 0; i < count; i++) {
    hearts.push({
      x: x + random(-12, 12),
      y: y + random(-12, 12),
      size: random(ballSize * 0.5, ballSize * 0.8),
      vy: random(-1.5, -0.6),
      life: random(50, 80),
      hue: random([palette.accent, palette.gold, palette.mint]),
      label: random(['m', '🤍', ':)'])
    });
  }
}

function drawHearts() {
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    h.y += h.vy;
    h.life -= 1;
    const alpha = map(h.life, 0, 80, 0, 200);
    noStroke();
    const col = color(h.hue);
    fill(red(col), green(col), blue(col), alpha);
    push();
    translate(h.x, h.y);
    drawHeart(h.size);
    if (h.label && random() < 0.5) {
      fill(60, alpha);
      textAlign(CENTER, CENTER);
      textSize(h.size * 0.4);
      text(h.label, 0, 0);
    }
    pop();
    if (h.life <= 0) {
      hearts.splice(i, 1);
    }
  }
}

// MESSAGES: cycle and animate
function triggerMessage() {
  messageIndex = (messageIndex + 1) % messages.length;
  messageAlpha = 0;
  messageYOffset = canvasH * 0.04;
}

function updateMessages() {
  const fadeSpeed = 8;
  messageAlpha = min(255, messageAlpha + fadeSpeed);
  messageYOffset = lerp(messageYOffset, 0, 0.15);

  const panelWidth = canvasW * 0.58;
  const panelX = (canvasW - panelWidth) / 2;
  const basePanelY = courtBottom - messagePanelHeight - uiSpacing * 0.35;
  const panelY = basePanelY + messageYOffset;

  push();
  translate(panelX + panelWidth / 2, panelY + messagePanelHeight / 2);
  rotate(radians(-2));
  drawingContext.shadowColor = palette.shadow;
  drawingContext.shadowBlur = 20;
  noStroke();
  fill(255, 235);
  rectMode(CENTER);
  rect(0, 0, panelWidth, messagePanelHeight, 18);
  drawingContext.shadowBlur = 0;

  fill(70, messageAlpha);
  textAlign(CENTER, CENTER);
  textFont(sansFont);
  textSize(canvasH * 0.03);
  textLeading(canvasH * 0.036);
  textWrap(WORD);
  const textBoxW = panelWidth * 0.85;
  text(messages[messageIndex], -textBoxW / 2, -messagePanelHeight * 0.18, textBoxW, messagePanelHeight * 0.8);
  pop();
}

// SURPRISE & INPUT
function mousePressed() {
  userStartAudio();
  musicOscillator.amp(musicEnabled ? 0.04 : 0, 0.2);
  spawnHearts(mouseX, mouseY);
  const clickedGift = handleGiftClick(mouseX, mouseY);

  if (!clickedGift && !clickHandled) {
    rallyCount = 0;
    triggerSurprise();
    clickHandled = true;
  }
}

function triggerSurprise() {
  rallyActive = false;
  surpriseActive = true;
  surpriseStartTime = frameCount;
  dimAlpha = 0;
  ball.vel.mult(0);
}

function drawReveal() {
  dimAlpha = min(220, dimAlpha + 6);
  noStroke();
  fill(palette.overlay);
  rect(0, 0, width, height);

  const elapsed = frameCount - surpriseStartTime;
  const scalePulse = 1 + 0.06 * sin(elapsed * 0.12);
  const glow = 180 + 50 * sin(elapsed * 0.2);

  push();
  translate(canvasW / 2, canvasH / 2);
  scale(scalePulse);
  textAlign(CENTER, CENTER);
  textFont(sansFont);
  textSize(canvasH * 0.085);
  fill(50, glow);
  text("GAME. SET. MATCH.", 0, -canvasH * 0.07);
  textFont(scriptFont);
  textSize(canvasH * 0.1);
  fill(palette.accent);
  text("happy birthday, michiii 💗", 0, canvasH * 0.03);
  pop();
}

// CONFETTI: fall forever
function initConfetti() {
  confettiPieces = [];
  for (let i = 0; i < confettiCount; i++) {
    confettiPieces.push(makeConfettiPiece(random(width), random(-height, height)));
  }
}

function makeConfettiPiece(x, y) {
  return {
    x,
    y,
    size: random(canvasW * 0.01, canvasW * 0.03),
    speed: random(canvasH * 0.003, canvasH * 0.009),
    shape: random(['circle', 'rect', 'heart']),
    hue: random(confettiColors)
  };
}

function drawConfetti() {
  for (let i = 0; i < confettiPieces.length; i++) {
    const piece = confettiPieces[i];
    piece.y += piece.speed;
    if (piece.y - piece.size > height) {
      piece.x = random(width);
      piece.y = random(-height * 0.5, 0);
      piece.size = random(canvasW * 0.01, canvasW * 0.03);
      piece.speed = random(canvasH * 0.003, canvasH * 0.009);
      piece.shape = random(['circle', 'rect', 'heart']);
      piece.hue = random(confettiColors);
    }

    fill(piece.hue);
    noStroke();
    drawConfettiShape(piece);
  }
}

function drawConfettiShape(piece) {
  push();
  translate(piece.x, piece.y);
  if (piece.shape === 'circle') {
    ellipse(0, 0, piece.size, piece.size);
  } else if (piece.shape === 'rect') {
    rotate(frameCount * 0.05);
    rectMode(CENTER);
    rect(0, 0, piece.size, piece.size * 0.6, piece.size * 0.2);
  } else {
    drawHeart(piece.size);
  }
  pop();
}

function drawHeart(size) {
  beginShape();
  const d = size / 2;
  vertex(0, d);
  bezierVertex(d, d + d * 0.6, d + d * 0.6, -d * 0.4, 0, -d * 0.2);
  bezierVertex(-d - d * 0.6, -d * 0.4, -d, d + d * 0.6, 0, d);
  endShape(CLOSE);
}

// GIFT GAME
function initGiftBoxes() {
  giftBoxes = [];
  const boxWidth = giftPanel.w * 0.26;
  const boxHeight = giftPanel.h * 0.4;
  const startX = giftPanel.x + uiSpacing * 0.9;
  const gap = boxWidth * 1.06;
  const y = giftPanel.y + giftPanel.h * 0.38;
  for (let i = 0; i < 3; i++) {
    giftBoxes.push({
      x: startX + gap * i,
      y,
      w: boxWidth,
      h: boxHeight,
      message: random(giftMessages),
      opened: false,
      pulse: 0,
      noteAnim: 0
    });
  }
}

function drawGiftGame() {
  const headerSize = canvasH * 0.026;
  const cardPadding = uiSpacing * 0.8;

  push();
  cursor('default');
  drawingContext.shadowColor = palette.shadow;
  drawingContext.shadowBlur = 14;
  noStroke();
  fill(255, 210);
  rect(giftPanel.x, giftPanel.y, giftPanel.w, giftPanel.h, 14);
  drawingContext.shadowBlur = 0;

  textFont(sansFont);
  textAlign(LEFT, CENTER);
  textSize(headerSize);
  fill(70, 170);
  text('mini gift pick', giftPanel.x + cardPadding, giftPanel.y + cardPadding * 1.5);
  textSize(headerSize * 0.85);
  fill(80, 150);
  textWrap(WORD);
  text('choose any bag to reveal a note', giftPanel.x + cardPadding, giftPanel.y + cardPadding * 3, giftPanel.w - cardPadding * 2);

  for (let i = 0; i < giftBoxes.length; i++) {
    const g = giftBoxes[i];
    const isHover = mouseX >= g.x && mouseX <= g.x + g.w && mouseY >= g.y && mouseY <= g.y + g.h;
    if (isHover && !surpriseActive) {
      cursor('pointer');
    }
    g.pulse = lerp(g.pulse, 0, 0.08);
    const hoverScale = isHover ? 1.05 : 1;
    const openScale = 1 + g.pulse * 0.08;
    push();
    translate(g.x + g.w / 2, g.y + g.h / 2);
    scale(hoverScale * openScale);
    translate(-g.w / 2, -g.h / 2);
    stroke(palette.accent);
    strokeWeight(2.4);
    fill(g.opened ? palette.gold : palette.court);
    rect(0, 0, g.w, g.h, 12);
    fill(palette.accent);
    noStroke();
    arc(g.w * 0.5, g.h * 0.08, g.w * 0.45, g.h * 0.35, PI, TWO_PI);
    stroke(palette.accent);
    strokeWeight(2);
    noFill();
    bezier(g.w * 0.2, g.h * 0.05, g.w * 0.32, -g.h * 0.18, g.w * 0.68, -g.h * 0.18, g.w * 0.8, g.h * 0.05);
    if (g.opened) {
      g.noteAnim = lerp(g.noteAnim, 1, 0.1);
      const noteScale = 0.6 + g.noteAnim * 0.5;
      const noteAlpha = 230 * g.noteAnim;
      const noteW = min(g.w * 0.9, canvasW * 0.22);
      const noteH = g.h * 0.58;
      const rawNoteY = g.h + uiSpacing * 0.28;
      const maxNoteCenter = giftPanel.h - cardPadding * 1.1 - noteH / 2;
      const noteY = min(rawNoteY, maxNoteCenter);
      push();
      translate(g.w / 2, noteY);
      scale(noteScale);
      rotate(radians(-3 + g.noteAnim * 2));
      drawingContext.shadowColor = palette.shadow;
      drawingContext.shadowBlur = 14;
      fill(255, noteAlpha);
      stroke(palette.accent);
      strokeWeight(2);
      rectMode(CENTER);
      rect(0, 0, noteW, noteH, 12);
      drawingContext.shadowBlur = 0;
      fill(60, noteAlpha);
      textAlign(CENTER, CENTER);
      textWrap(WORD);
      textFont(sansFont);
      textSize(canvasH * 0.02);
      textLeading(canvasH * 0.024);
      text(g.message, -noteW * 0.45, -noteH * 0.25, noteW * 0.9, noteH * 0.7);
      pop();
    } else {
      g.noteAnim = 0;
    }
    pop();
  }
  pop();
}

function handleGiftClick(mx, my) {
  let clicked = false;
  for (let i = 0; i < giftBoxes.length; i++) {
    const g = giftBoxes[i];
    if (mx >= g.x && mx <= g.x + g.w && my >= g.y && my <= g.y + g.h) {
      g.opened = true;
      g.message = random(giftMessages);
      g.pulse = 1;
      g.noteAnim = 0;
      bounceRipples.push(makeRipple(g.x + g.w / 2, g.y + g.h / 2));
      notePauseFrames = max(notePauseFrames, 70);
      clicked = true;
    }
  }
  if (!clicked) {
    cursor('default');
  }
  return clicked;
}

// SOUND helper
function playPop() {
  if (!popOscillator.started && popOscillator.start) {
    popOscillator.start();
  }
  popOscillator.freq(520);
  popOscillator.amp(0.25, 0.02);
  popOscillator.amp(0, 0.1);
}

function keyPressed() {
  if (key === 'm' || key === 'M') {
    musicEnabled = !musicEnabled;
    musicOscillator.amp(!bgMusicLoaded && musicEnabled ? 0.04 : 0, 0.2);
    if (bgMusicLoaded && bgMusic) {
      if (musicEnabled) {
        if (!bgMusic.isPlaying()) bgMusic.play();
        bgMusic.setVolume(0.18, 0.2);
      } else {
        bgMusic.pause();
      }
    }
    musicPulse = 1;
  }
}

function updateMusic() {
  if (!musicEnabled) return;
  if (bgMusicLoaded && bgMusic) {
    // keep looping softly
    if (!bgMusic.isPlaying()) {
      bgMusic.play();
    }
    bgMusic.setVolume(0.18, 0.2);
  } else {
    const wobble = 8 * sin(frameCount * 0.03);
    musicOscillator.freq(230 + wobble);
  }
}

function windowResized() {
  // Recalculate everything when canvas changes
  setup();
}
