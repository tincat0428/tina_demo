function setup() {
	createCanvas(windowWidth, windowHeight);
	background(255);
}

function draw() {
	if(frameCount==0 || frameCount % 10 != 0) return;

	background('rgba(255,255,255, 0.05)');
	const NAME = "Tina"
	const TEXTS = ["大美女","真聰明!!!","我婆~","腿好長，好羨慕",
								 "長得好可愛<3","我的女神~~","美到讓人心跳漏拍",
								 "這美貌犯規了吧！","工作表現簡直就是無可挑剔","美貌與智慧並存，佩服！"];
	const BOYFRIEND_TEXT = [
		"大帥哥","我戀愛了!!!","腿好長，好羨慕","長這麼好看，一定是被神踩過!",
		"哇，好帥好帥!","我只想看著你發呆XD","工作表現簡直就是無可挑剔!",
		"總是照顧周到，真靠普~","體貼溫暖全身心<3", "真的是太可愛了"
	];
	let myText = NAME+ random(TEXTS);
	textSize(30);
	let w = textWidth(myText) + 50
	
	strokeWeight(2);
	let x = random(0,width-w),
			y = random(height),
			rectC,
			rectStrokeC,
			textC
	if(random() < 0.5){
		rectC = 0;
		rectStrokeC = 255
	}else{
		rectC = 255;
		rectStrokeC = 0
	}
		// 對話框
		fill(rectC);
		stroke(rectStrokeC);
		rect(x,y, w ,50,20);
		// 文字	
		fill(rectStrokeC);
		noStroke();
		text(myText, x+20, y+35);
}