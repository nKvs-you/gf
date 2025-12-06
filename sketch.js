// COURT
let canvasW;
let canvasH;
let courtPadding;
let courtTop;
let courtBottom;
let courtLeft;
let courtRight;
let serviceBoxWidth;
let netX;

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

// MESSAGES
const messages = [
  "You’re my best doubles partner 💚",
  "You look cuter than K-Pop idols fr",
  "Shopping dates with you = elite",
  "I’m your #1 fan",
  "Happy early birthday 🎂",
  "I love your laugh more than aces",
  "You turn rallies into heartbeats"
];
let messageIndex = 0;
let messageAlpha = 255;
let messageYOffset = 0;
let popOscillator;

// SURPRISE
let surpriseActive = false;
let surpriseStartTime = 0;
let dimAlpha;

// CONFETTI
let confettiPieces = [];
let confettiCount;
let confettiColors;

// INPUT
let clickHandled = false;

function setup() {
  canvasW = min(windowWidth * 0.98, 1100);
  canvasH = min(windowHeight * 0.82, 700);
  createCanvas(canvasW, canvasH);

  // COURT measurements derived from canvas
  courtPadding = canvasW * 0.06;
  courtLeft = courtPadding;
  courtRight = canvasW - courtPadding;
  courtTop = canvasH * 0.1;
  courtBottom = canvasH - canvasH * 0.1;
  serviceBoxWidth = (courtRight - courtLeft) * 0.38;
  netX = canvasW / 2;

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
  initialBallSpeed = createVector(canvasW * 0.007, canvasH * 0.0045);
  ball = {
    pos: createVector(canvasW / 2, canvasH / 2),
    vel: initialBallSpeed.copy()
  };

  // SURPRISE
  dimAlpha = 0;

  // CONFETTI
  confettiCount = 160;
  confettiColors = [
    color(255, 170, 200),
    color(255, 220, 120),
    color(120, 200, 255),
    color(180, 255, 180),
    color(255, 150, 255)
  ];
  initConfetti();

  // SOUND (optional small pop using oscillator)
  popOscillator = new p5.Oscillator('sine');
  popOscillator.amp(0);
  popOscillator.start();
}

function draw() {
  // COURT
  drawCourt();

  if (rallyActive) {
    moveBall();
    drawRackets();
    updateMessages();
  }

  // SURPRISE overlay and confetti
  if (surpriseActive) {
    drawSurprise();
    drawConfetti();
  }
}

// COURT: render tennis court lines
function drawCourt() {
  background('#1f6c3e');

  stroke(255);
  strokeWeight(3);
  noFill();
  rect(courtLeft, courtTop, courtRight - courtLeft, courtBottom - courtTop);
  line(courtLeft, (courtTop + courtBottom) / 2, courtRight, (courtTop + courtBottom) / 2);
  line(netX, courtTop, netX, courtBottom);

  const serviceLeft = netX - serviceBoxWidth / 2;
  const serviceRight = netX + serviceBoxWidth / 2;
  rect(serviceLeft, courtTop + (courtBottom - courtTop) * 0.15, serviceBoxWidth, (courtBottom - courtTop) * 0.7);
  line(serviceLeft, canvasH / 2, serviceRight, canvasH / 2);
}

// BALL: movement and collision logic
function moveBall() {
  // RACKETS track ball Y
  for (let i = 0; i < rackets.length; i++) {
    const targetY = constrain(ball.pos.y, courtTop + racketHeight / 2, courtBottom - racketHeight / 2);
    rackets[i].y = lerp(rackets[i].y, targetY, racketFollowEase);
  }

  // Update position
  ball.pos.add(ball.vel);

  // Bounce on top/bottom of court
  const halfBall = ballSize / 2;
  if (ball.pos.y - halfBall <= courtTop || ball.pos.y + halfBall >= courtBottom) {
    ball.vel.y *= -1;
    ball.pos.y = constrain(ball.pos.y, courtTop + halfBall, courtBottom - halfBall);
  }

  // Check rackets collision
  checkRacketCollision(rackets[0], 1);
  checkRacketCollision(rackets[1], -1);

  // Draw ball
  noStroke();
  fill('#ffb3d6');
  ellipse(ball.pos.x, ball.pos.y, ballSize, ballSize);
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
  }
}

// RACKETS: draw paddles
function drawRackets() {
  noStroke();
  fill(255);
  for (let i = 0; i < rackets.length; i++) {
    const r = rackets[i];
    rect(r.x - racketWidth / 2, r.y - racketHeight / 2, racketWidth, racketHeight, racketWidth / 2);
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

  fill(255, messageAlpha);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(canvasH * 0.045);
  const messageY = courtBottom + canvasH * 0.05 + messageYOffset;
  text(messages[messageIndex], canvasW / 2, messageY);
}

// SURPRISE: big birthday splash
function mousePressed() {
  if (!clickHandled) {
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

function drawSurprise() {
  dimAlpha = min(200, dimAlpha + 8);
  fill(0, dimAlpha);
  noStroke();
  rect(0, 0, width, height);

  const elapsed = frameCount - surpriseStartTime;
  const scalePulse = 1 + 0.05 * sin(elapsed * 0.15);

  push();
  translate(canvasW / 2, canvasH / 2);
  scale(scalePulse);
  textAlign(CENTER, CENTER);
  textSize(canvasH * 0.09);
  fill(255);
  text("GAME, SET, MATCH 🎾", 0, -canvasH * 0.06);
  textSize(canvasH * 0.075);
  fill('#ff9fb3');
  text("HAPPY BIRTHDAY LOVE ❤️", 0, canvasH * 0.04);
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

// SOUND helper
function playPop() {
  if (!popOscillator.started && popOscillator.start) {
    popOscillator.start();
  }
  popOscillator.freq(520);
  popOscillator.amp(0.25, 0.02);
  popOscillator.amp(0, 0.1);
}

function windowResized() {
  // Recalculate everything when canvas changes
  setup();
}
