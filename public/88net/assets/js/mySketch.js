class Sketch {

    constructor(elemTarget) {
        this.elemTarget = elemTarget;
        this.containerElem = document.querySelector(this.elemTarget);
        this.containerElem.classList.add('sketch-mask')
        let s1 = new p5(this.s);
        let s2 = new p5(this.s);
    }
    elemTarget
    containerElem

    s = (sketch) => {
        const TEXTS = ["+", "○"];
        const TEXT_COLOR = ['#468f55', '#FF9766', '#CC72B2', '#6151E0']

        sketch.setup = () => {
            const ctx = sketch.createCanvas(this.containerElem.offsetWidth, this.containerElem.offsetHeight);
            ctx.parent(this.containerElem)
            sketch.noLoop();
        }

        sketch.draw = function () {
            let textsAmount = Math.floor(sketch.random(sketch.width / 200, sketch.width / 100));

            for (var i = 0; i < textsAmount; i++) {
                sketch.textSize(sketch.random(30, 50));
                let myText = sketch.random(TEXTS);
                let w = sketch.textWidth(myText);
                let x = sketch.random(0, sketch.width - 2 * w),
                    y = sketch.random(0, sketch.height - 2 * w),
                    textC = sketch.random(TEXT_COLOR);
                // 文字	
                sketch.fill(textC);
                sketch.text(myText, x + 20, y + 35);
            }
        }
    }
}