function setup() {
	createCanvas(windowWidth, windowHeight);
	background(255,181,35);
}

function draw() {
	noStroke();
	// print(frameCount);
	if(mouseIsPressed){
		fill(mouseX/3, mouseY/4, random(200,255), 80);
		ellipse(mouseX, mouseY, 100, 100);
	} else{
		stroke(255);
		noFill();
		rectMode(CENTER);
		rect(mouseX, mouseY, 100, 100)
	}
}