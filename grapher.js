import { TAU, v, vp, degrees2radian } from "./vector";

export { TAU, v, vp } from "./vector";

export class Grapher {
  static forID(elementID) {
    const canvas = document.getElementById(elementID);
    canvas.width = canvas.clientWidth * 2;
    canvas.height = canvas.clientHeight * 2;
    return new Grapher(canvas.getContext("2d"));
  }

  static offscreen(destinationGrapher) {
    const canvas = document.createElement("canvas");
    const destinationCanvas = destinationGrapher.ctx.canvas;
    canvas.width = destinationCanvas.width;
    canvas.height = destinationCanvas.height;
    return new Grapher(canvas.getContext("2d"));
  }

  constructor(ctx) {
    this.ctx = ctx;
    this.fns = {};
  }

  modifyFormulas(id, fn) {
    const textWrapper = document.getElementById(id);
    const lines = Array.from(
      textWrapper.querySelectorAll(".col-align-l .vlist > * > .mord")
    );
    if (lines[0] == null) {
      return;
    }
    fn(lines.map((line) => line.querySelectorAll(".mord")[1]));
  }

  animate(draw) {
    let start = null;
    let isStopped = false;
    const step = (timestamp) => {
      if (!isStopped && isElementInViewport(this.ctx.canvas)) {
        if (start == null) {
          start = timestamp;
        }
        this.clear();
        isStopped = draw(timestamp - start);
      }
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
    this.ctx.canvas.addEventListener("click", () => {
      start = null;
      isStopped = false;
    });
  }

  whenReady(draw) {
    window.addEventListener("load", draw);
  }

  yOfXColored(at, scale, to, fn) {
    this.curveColored(at, scale, to, (t) => v(t, fn(t)));
  }

  curveColored(at, scale, to, curve, colorScale = 50) {
    for (let i = 0; i < to * scale.x; i++) {
      const p = at.add(curve(i / scale.x).multiplyVec(scale));
      if (i > 0) {
        this.pathTo(p);
        this.ctx.strokeStyle = lchColor(50, 230, (i / scale.x) * colorScale);
        this.ctx.stroke();
      }
      this.ctx.beginPath();
      this.moveTo(p);
    }
  }

  curveCached(name, at, scale, to, curve) {
    const shouldStartPath =
      this.fns[name] == null || to < this.fns[name].lastTo;
    if (shouldStartPath) {
      this.fns[name] = { path: new Grapher(new window.Path2D()), lastTo: 0 };
    }
    const lastTo = this.fns[name].lastTo;
    this.fns[name].lastTo = to;

    const path = this.fns[name].path;
    if (shouldStartPath) {
      path.startPath();
    }
    for (let i = lastTo * scale.x; i < to * scale.x; i++) {
      const p = at.add(curve(i / scale.x).multiplyVec(scale));
      path.pathTo(p);
    }

    this.ctx.stroke(path.ctx);
  }

  axes(center, scale, { horiz, vert }) {
    const font = this.ctx.font;
    this.horizAxis(center, scale, ...horiz);
    this.vertAxis(center, scale, ...vert);
  }

  horizAxis(center, scale, name, ticks, range, axisScale = 1) {
    const margin = 30;
    const thisScale = scale.x * axisScale;
    const size = thisScale * (range[1] - range[0]) + 2 * margin;
    const axisStart = center.add(v(range[0] * thisScale - margin, 0));
    this.line(axisStart, axisStart.add(v(size, 0)));
    this.tickLabel(axisStart.add(v(size + 4, 0)), name);
    ticks.forEach((tick, i) => {
      const pos = axisStart.add(v(margin + i * thisScale, 0));
      this.horizTick(pos, tick);
    });
  }

  vertAxis(center, scale, name, ticks, range, axisScale = 1) {
    const margin = 30;
    const thisScale = scale.y * axisScale;
    const size = thisScale * (range[1] - range[0]) + 2 * margin;
    const axisStart = center.add(v(0, range[0] * thisScale - margin));
    this.line(axisStart, axisStart.add(v(0, size)));
    this.tickLabel(axisStart.add(v(0, -8)), name);
    ticks.forEach((tick, i) => {
      const pos = axisStart.add(v(0, margin + i * thisScale));
      this.vertTick(pos, tick);
    });
  }

  horizTick(at, text) {
    this.line(at.add(v(0, -5)), at.add(v(0, 5)));
    this.tickLabel(at, text);
  }

  vertTick(at, text) {
    this.line(at.add(v(-5, 0)), at.add(v(5, 0)));
    this.tickLabel(at, text);
  }

  tickLabel(at, text) {
    this.ctx.textAlign = "right";
    this.text(at.add(v(-4, 24)), text);
    this.ctx.textAlign = "left";
  }

  clear() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  }

  stylePrimary() {
    this.ctx.strokeStyle = "#4a4a4a";
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = "#4a4a4a";
    this.ctx.font = "32px sans-serif";
  }

  styleSecondary() {
    this.ctx.strokeStyle = "#aaa";
    this.ctx.lineWidth = 1;
    this.ctx.fillStyle = "#aaa";
    this.ctx.font = "26px KaTeX_Math";
  }

  startPath() {
    this.isFirst = true;
  }

  pathTo(pos) {
    if (this.isFirst) {
      this.ctx.moveTo(pos.x, pos.y);
      this.isFirst = false;
    } else {
      this.ctx.lineTo(pos.x, pos.y);
    }
  }

  moveTo(pos) {
    this.ctx.moveTo(pos.x, pos.y);
  }

  lineTo(pos) {
    this.ctx.lineTo(pos.x, pos.y);
  }

  arcTo(center, radius, from, to, direction) {
    this.ctx.arc(center.x, center.y, radius, from, to, direction);
  }

  clothoidTo(
    from,
    angle,
    radius,
    rotation = 0,
    direction = 1,
    reverse = false,
    L = 3
  ) {
    const numSteps = (2 * radius * angle) / 2;
    for (let i = 0; i < 1 + 1 / numSteps; i += 1 / numSteps) {
      const ip = Math.min(1, i);
      const at = from.add(
        clothoid(angle, radius, reverse ? 1 - ip : ip, L)
          .multiplyVec(v(1, direction))
          .rotate(rotation)
      );
      this.pathTo(at);
    }
  }

  line(a, b) {
    this.drawCurve(() => {
      this.moveTo(a);
      this.lineTo(b);
    });
  }

  circle(center, radius) {
    this.drawCurve(() => {
      this.arcTo(center, radius, 0, 2 * Math.PI);
    });
  }

  arc(center, radius, from, to, direction) {
    this.drawCurve(() => {
      this.arcTo(center, radius, from, to, direction);
    });
  }

  clothoid(from, angle, radius, rotation, direction, reverse, L) {
    this.drawCurve(() => {
      this.clothoidTo(from, angle, radius, rotation, direction, reverse, L);
    });
  }

  text(at, string) {
    this.ctx.fillText(string, at.x, at.y);
  }

  arrow(from, to) {
    this.line(from, to);
    this.arrowHead(from, to);
  }

  drawCurve(fn) {
    drawCurve(this.ctx, fn);
  }

  lchColor(l, c, hDegrees, opacity) {
    return lchColor(l, c, hDegrees, opacity);
  }
}

export function drawCurve(ctx, draw) {
  ctx.beginPath();
  draw();
  ctx.stroke();
}

export function clothoid(finalAngle, radius, percent = 1, L = 3) {
  let x = 0;
  let y = 0;
  const AR = radius * 2 * Math.sqrt(finalAngle);
  const at = Math.sqrt(finalAngle) * percent;
  for (let i = 0; i < L; i++) {
    y +=
      (AR * ((-1) ** i * at ** (4 * i + 3))) /
      (factorial(2 * i + 1) * (4 * i + 3));
    x +=
      (AR * ((-1) ** i * at ** (4 * i + 1))) / (factorial(2 * i) * (4 * i + 1));
  }
  return v(x, y);
}

function factorial(num) {
  let result = 1;
  for (let i = 2; i <= num; i++) result = result * i;
  return result;
}

function isElementInViewport(element) {
  var rect = element.getBoundingClientRect();
  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
    rect.top < (window.innerHeight || document.documentElement.clientHeight)
  );
}

// Adapted from https://observablehq.com/@mbostock/lab-and-rgb
function lchColor(l, c, hDegrees, opacity = 1) {
  const h = degrees2radian(hDegrees);
  const a = Math.cos(h) * c;
  const b = Math.sin(h) * c;
  var y = (l + 16) / 116,
    x = y + a / 500,
    z = y - b / 200;
  x = 0.96422 * lab2xyz(x);
  y = lab2xyz(y);
  z = 0.82521 * lab2xyz(z);
  return `rgba(
    ${lrgb2rgb(3.1338561 * x - 1.6168667 * y - 0.4906146 * z)},
    ${lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.033454 * z)},
    ${lrgb2rgb(0.0719453 * x - 0.2289914 * y + 1.4052427 * z)},
    ${opacity}
  )`;
}

function lab2xyz(t) {
  return t > 6 / 29 ? t * t * t : 3 * (6 / 29) ** 2 * (t - 4 / 29);
}

function lrgb2rgb(x) {
  return (
    255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)
  );
}
