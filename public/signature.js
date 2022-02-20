let canvas = document.getElementById("canvasSignature");
var ctx = canvas.getContext("2d");
ctx.strokeStyle = "black";
ctx.lineWidth = 2;
let signed = false;

function trigger(e) {
    canvas.addEventListener("mousemove", actualDraw);
    updatePosition(e);
}

function actualDraw(e) {
    signed = true;
    console.log("draw");
    ctx.beginPath();
    console.log(xY[0], xY[1]);
    ctx.moveTo(xY[0], xY[1]);
    ctx.lineCap = "round";
    updatePosition(e);
    ctx.lineTo(xY[0], xY[1]);
    ctx.stroke();
}

function updatePosition(e) {
    xY[0] = e.clientX - canvas.getBoundingClientRect().left;
    xY[1] = e.clientY - canvas.getBoundingClientRect().top;
}

function stopDraw() {
    canvas.removeEventListener("mousemove", actualDraw);
}

function saveUrl() {
    if (!signed) {
        console.log("not signed");
        document
            .getElementsByClassName("signature")[0]
            .setAttribute("value", "");
    } else {
        console.log("signed");
        document
            .getElementsByClassName("signature")[0]
            .setAttribute("value", canvas.toDataURL());
    }
}

let xY = [0, 0];

canvas.addEventListener("mousedown", trigger);

canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseup", saveUrl);
