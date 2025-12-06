let ballX = 400
let ballY = 200
let ballspX = 4;

let rackets = [
  {x: 150, y: 200},  // left
  {x: 650, y: 200}   // right
];


function setup() {
  createCanvas(800, 400);
  
}

function draw() {
  // Court background
  background("#228B22");

  stroke(255);
  strokeWeight(4);
  noFill();

  //base
  rect(100, 50, 600, 300);
  line (100, 100, 700, 100);
   line (100, 300, 700, 300);
  
  //serve
  rect(250, 100, 300, 200);
  line(250, 200, 550, 200)
  //net
  line(400, 350, 400, 50)
  
  
  //ball
  fill("pink");
  noStroke();
  ellipse(ballX, ballY, 20, 20);
  
  //moving da ball
  ballX = ballX + ballspX
  
  if (ballX < 143){
    ballX= 143;
    ballspX = ballspX * -1; //reverse
    
  }
  
  if(ballX > 657){
    ballX = 657; 
    ballspX = ballspX * -1
  }
  
  //rackets
  noStroke();
  fill(255);
  
  for(let i = 0; i < rackets.length; i++){
    let r = rackets[i]
    rect(r.x - racketW/2, r.y - racketH/2, racketW, racketH); //shape
  }
  
  
  
   
}
