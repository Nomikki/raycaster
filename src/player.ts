export default class Player {
  x = 0;
  y = 0;
  px = 0;
  py = 0;
  angle = 0;
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.UpdateDeltas();
  }

  UpdateDeltas() {
    this.px = Math.cos(this.angle);
    this.py = Math.sin(this.angle);
  }

  AddRotation(turningAmount: number) {
    this.angle += turningAmount;
    if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
    if (this.angle < 0) this.angle += Math.PI * 2;

    this.UpdateDeltas();
  }
}
