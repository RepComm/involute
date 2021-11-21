
import { Drawing, EXPONENT_CSS_BODY_STYLES, EXPONENT_CSS_STYLES, Panel } from "@repcomm/exponent-ts";

import { Vec2 } from "@repcomm/vec2d";

EXPONENT_CSS_BODY_STYLES.mount(document.head);
EXPONENT_CSS_STYLES.mount(document.head);

const container = new Panel()
.setId("container")
.mount(document.body);

function getPointOnCircle (position: Vec2, radius: number, angle: number, out?: Vec2): Vec2 {
  if (!out) out = new Vec2();
  out.set(
    position.x + (radius * Math.cos(angle)),
    position.y + (radius * Math.sin(angle))
  );
  return out;
}

class Gear {
  radius: number;
  toothCount: number;

  divisions: number;
  renderPoint: Vec2;
  strokeStyle: string;
  position: Vec2;

  constructor () {
    this.radius = 1;
    this.toothCount = 6;
    
    this.divisions = 100;
    this.renderPoint = new Vec2();
    this.strokeStyle = "black";
    this.position = new Vec2();
  }
  get module (): number {
    return this.circularPitch / Math.PI;
  }
  set module (m: number) {
    this.circularPitch = m * Math.PI;
  }
  set perimeter (v: number) {
    this.radius = Math.sqrt(v) / Math.PI;
  }
  get perimeter (): number {
    return Math.PI * this.radius * this.radius;
  }
  set toothArcLength (v: number) {
    this.perimeter = v * this.toothCount;
  }
  get toothArcLength (): number {
    return this.perimeter / this.toothCount;
  }
  //distance per tooth
  set circularPitch (v: number) {
    this.toothArcLength = v;
  }
  get circularPitch (): number {
    return this.toothArcLength;
  }
  get diametricPitch (): number {
    return 1 / this.module;
  }
  //tooth per distance
  set diametricPitch (v: number) {
    this.module = 1 / v;
  }
  get toothAngle (): number {
    return (Math.PI*2)/this.toothCount;
  }
  getToothPercent (angle: number): number {
    return (
      angle % this.toothAngle
    );
    // return (angle / Math.PI * 2) % this.toothCount;
  }
  getToothIndex (angle: number): number {
    return Math.floor(angle / this.toothAngle);
  }
  getToothAngle (index: number): number {
    return index * this.toothAngle;
  }
  getBaseCirclePoint (angle: number, out?: Vec2): Vec2 {
    if (!out) out = new Vec2();
    out.set(
      this.radius * Math.cos(angle),
      this.radius * Math.sin(angle)
    );
    return out;
  }
  getPoint (angle: number, out?: Vec2): Vec2 {
    let toothPercent = this.getToothPercent(angle);
    let index = this.getToothIndex(angle);

    let gruvePercent = toothPercent*2;

    if (toothPercent <= 0.5) {

      let one = new Vec2();
      this.getBaseCirclePoint(this.getToothAngle(index), one);

      let two = new Vec2();
      this.getBaseCirclePoint(this.getToothAngle(index+0.5), two);

      let center = new Vec2().copy(one).lerp(two, 0.5);

      getPointOnCircle(
        center,
        center.distance(one),
        angle - (gruvePercent * Math.PI) - (Math.PI/2),
        out
      );
      
    } else {
      //involute things
      this.getBaseCirclePoint(angle, out);

    }

    return out;
  }
  getWorldPoint (angle: number, out?: Vec2): Vec2 {
    return this.getPoint(angle, out).add(this.position);
  }
  render (ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.beginPath();

    this.getWorldPoint(0, this.renderPoint);

    ctx.moveTo(this.renderPoint.x, this.renderPoint.y);

    for (let i=1; i<this.divisions; i++) {
      this.getWorldPoint( (i/this.divisions) *  Math.PI * 2, this.renderPoint);
      ctx.lineTo(this.renderPoint.x, this.renderPoint.y);
    }

    ctx.closePath();
    ctx.strokeStyle = this.strokeStyle;
    ctx.stroke();
    ctx.restore();
  }
}

let gear = new Gear();
gear.toothCount = 8;
gear.divisions = 512;
gear.position.set(100, 100);
gear.radius = 100;

window["gear"] = gear;

const drawing = new Drawing({desynchronized: true})
.setId("drawing")
.setHandlesResize(true)
.mount(container)
.addRenderPass((ctx)=>{
  ctx.save();
  ctx.strokeStyle = "red";
  ctx.strokeRect(
    0,
    0,
    drawing.width,
    drawing.height
  );

  gear.render(ctx);
  ctx.restore();
});

let fps = 5;

setInterval(()=>{

  drawing.setNeedsRedraw();
}, 1000/fps);
