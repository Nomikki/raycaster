import "@/index.scss";
import Player from "./player";
import Color from "./utils/colors";
import Map from "./map";
import { ensure, float2int, rgbToHex, sleep } from "./utils";

export class Game {
  canvas: Element;
  ctx: CanvasRenderingContext2D;

  width: number;
  height: number;
  player: Player;
  map: Map;

  keyLeft: boolean;
  keyRight: boolean;
  keyUp: boolean;
  keyDown: boolean;

  ctxID: ImageData;

  constructor() {
    this.canvas = ensure(document.querySelector("#screen"));
    this.ctx = ensure((this.canvas as HTMLCanvasElement).getContext("2d"));

    this.width = 320;
    this.height = 200;

    this.ctxID = this.ctx.getImageData(0, 0, this.width, this.height);
    this.keyLeft = false;
    this.keyRight = false;
    this.keyUp = false;
    this.keyDown = false;

    this.player = new Player(50, 100);
    this.map = new Map();

    document.addEventListener(
      "keydown",
      (event) => {
        const keyName = event.key;

        if (keyName === "a") this.keyLeft = true;
        if (keyName === "d") this.keyRight = true;
        if (keyName === "w") this.keyUp = true;
        if (keyName === "s") this.keyDown = true;

        // console.log(`Key pressed ${keyName}`);
      },
      false
    );

    document.addEventListener(
      "keyup",
      (event) => {
        const keyName = event.key;

        if (keyName === "a") this.keyLeft = false;
        if (keyName === "d") this.keyRight = false;
        if (keyName === "w") this.keyUp = false;
        if (keyName === "s") this.keyDown = false;

        // console.log(`Key released ${keyName}`);
      },
      false
    );
  }

  async Clear(color: Color): Promise<void> {
    this.ctx.fillStyle = rgbToHex(color);
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  PutPixel(x: number, y: number, color: Color): void {
    const off = (y * this.ctxID.width + x) * 4;
    const pixels = this.ctxID.data;
    pixels[off] = color.r;
    pixels[off + 1] = color.g;
    pixels[off + 2] = color.b;
    pixels[off + 3] = 255;
  }

  async FetchImage() {
    this.ctxID = this.ctx.getImageData(0, 0, this.width, this.height);
  }

  async UpdateImage() {
    this.ctx.putImageData(this.ctxID, 0, 0);
  }

  DrawRect(x: number, y: number, w: number, h: number, color: Color) {
    this.ctx.fillStyle = rgbToHex(color);
    this.ctx.fillRect(x, y, w, h);
  }

  async DrawPlayer() {
    const color = new Color(100, 200, 0);
    const size = 8;
    this.DrawRect(
      this.player.x - size,
      this.player.y - size,
      size * 2,
      size * 2,
      color
    );

    /*
    this.DrawLine(
      this.player.x,
      this.player.y,
      this.player.x + this.player.px * 100,
      this.player.y + this.player.py * 100,
      new Color(255, 0, 0)
    );
    */
  }

  async DrawLine(x0: number, y0: number, x1: number, y1: number, color: Color) {
  
    x0 = float2int(x0);
    y0 = float2int(y0);
    x1 = float2int(x1);
    y1 = float2int(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.PutPixel(x0, y0, color);

      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }

  
  }

  async DrawMap2d() {
    for (let y = 0; y < this.map.mapY; y++) {
      for (let x = 0; x < this.map.mapX; x++) {
        const tileID = this.map.data[y * this.map.mapX + x];
        let color = new Color(0, 0, 0);

        if (tileID === 1) color = new Color(200, 200, 200);
        if (tileID === 2) color = new Color(0, 0, 200);
        

        this.DrawRect(
          x * this.map.mapS + 1,
          y * this.map.mapS + 1,
          this.map.mapS - 1,
          this.map.mapS - 1,
          color
        );
      }
    }
  }

  distance(ax: number, ay: number, bx: number, by: number): number {
    return Math.sqrt((bx - ax) * (bx - ax) + (by - ay) * (by - ay));
  }

  async DrawRays3D() {
    const PI = Math.PI;
    const PI2 = Math.PI / 2;
    const PI3 = 3 * PI / 2;
    const DR = 3.1415 / 180.0; // degree to radian
    let dof = 0;
    const maxDof = 8;
    const pa = this.player.angle;

    const numOfRays = 64; // how accurate raycaster will be
    const dim = 64; // lighting

    const w = this.width; // size of screen
    const h = this.height;
    const fov = 60; // field of view
    const stepOfAngle = DR*(fov/numOfRays);

    const renderOffsetX = 0;
    const renderOffsetY = 0;
    const pixelLen = (w / numOfRays);

    const px = this.player.x;
    const py = this.player.y;

    let ry = 0;
    let rx = 0;
    let yo = 0;
    let xo = 0;
 
    let mx = 0;
    let my = 0;
    let mp = 0;
    let disT = 0;
    const tileSize = this.map.mapS;


    let ra = pa - DR * (fov / 2);
    if (ra < 0) { ra += 2*PI; }
    if (ra > 2 *PI) { ra -= 2 * PI; }

    this.FetchImage();

    // cast rays
    for (let r = 0; r < numOfRays; r++) {
      dof = 0;

      const aTan = -1 / Math.tan(ra);
      let disH = 1000000;
      let hx = px;
      let hy = py;
      let mh = 0;

      if (ra > PI) { ry = (( float2int(py)>>5) << 5) - 0.0001; rx = (py - ry) * aTan + px; yo = -tileSize; xo = -yo * aTan; }
      if (ra < PI) { ry = (( float2int(py)>>5) << 5) + tileSize; rx = (py - ry) * aTan + px;      yo = tileSize; xo = -yo * aTan; }
      if (ra === 0 || ra === PI) { rx = px; ry = py; dof = 8; }
      while( dof < maxDof)
      {
        mx = float2int(rx) >> 5;
        my = float2int(ry) >> 5;
        mx = float2int(mx);
        my = float2int(my);
        mp = my * this.map.mapX + mx;
        if (mp > 0 && mp < this.map.mapX * this.map.mapY && this.map.data[mp] > 0)
        {
          dof = maxDof;
          hx = rx; hy = ry; disH = this.distance(px, py, hx, hy);
          mh = this.map.data[mp];
        } else {
          rx += xo; ry += yo; dof++;
        }
      }

      // hori
      const nTan = -Math.tan(ra);
      let disV = 1000000;
      let vx = px;
      let vy = py;
      let mv = 0;
      dof = 0;
      if (ra > PI2 && ra < PI3) { rx = (( (px | 0)>>5) << 5) - 0.0001; ry = (px - rx) * nTan + py; xo = -tileSize; yo = -xo * nTan; }
      if (ra < PI2 || ra > PI3) { rx = (( (px | 0)>>5) << 5) + tileSize;     ry = (px - rx) * nTan + py; xo =  tileSize; yo = -xo * nTan; }
      if (ra === 0 || ra === PI) { rx = px; ry = py; dof = maxDof; }
      while( dof < maxDof)
      {
        mx = (rx | 0) >> 5;
        my = (ry | 0) >> 5;
        mp = my * this.map.mapX + mx;
        if (mp > 0 && mp < this.map.mapX * this.map.mapY && this.map.data[mp] > 0)
        {
          vx = rx; vy = ry;  disV = this.distance(px, py, vx, vy);
          mv = this.map.data[mp];
          dof = maxDof;
        } else {
          rx += xo; ry += yo; dof++;
        }
      }

      let color = new Color(255, 255, 255);

      if (disV < disH) { rx = vx; ry = vy; disT = disV; color = new Color(192, 192, 192);  if (mv === 2) color = new Color(0, 0, 255); }
      if (disH < disV) { rx = hx; ry = hy; disT = disH; color = new Color(255, 255, 255);  if (mh === 2) color = new Color(0, 0, 255); }

      // await this.DrawLine(px, py, rx, ry, new Color(255, 200, 0));

      // 3d walls
      let ca = pa - ra;
      if (ca < 0) { ca += 2*PI; }
      if (ca > 2 *PI) { ca -= 2 * PI; }
      disT = disT * Math.cos(ca);

      let lineH = (this.map.mapS * h) / disT;
      if (lineH > h) lineH = h;
      const lineO = (h/2) - lineH/2;

      const ax = r * pixelLen + renderOffsetX;
      const ay = lineO + renderOffsetY;
      const bx = r * pixelLen + renderOffsetX;
      const by = lineH+lineO + renderOffsetY;

      color.r *= 1 / disT * dim;
      color.g *= 1 / disT * dim;
      color.b *= 1 / disT * dim;

      for (let ol = 0; ol < pixelLen; ol++) {
        this.DrawLine(ax+ol, ay, bx+ol, by, color);
      }

      ra += stepOfAngle;
      if (ra < 0) { ra += 2*PI; }
      if (ra > 2 *PI) { ra -= 2 * PI; }
    }
     this.UpdateImage();
  }

  async HandleInputs() {
    const movementSpeed = 2;
    const turningSpeed = 0.05;

    if (this.keyLeft) {
      this.player.AddRotation(-turningSpeed);
    }
    if (this.keyRight) {
      this.player.AddRotation(turningSpeed);
    }
    if (this.keyUp) {
      this.player.x += this.player.px * movementSpeed;
      this.player.y += this.player.py * movementSpeed;
    }
    if (this.keyDown) {
      this.player.x -= this.player.px * movementSpeed;
      this.player.y -= this.player.py * movementSpeed;
    }
  }

  async Run() {
    console.log("Game is running");
    while (true) {
      this.Clear(new Color(64, 64, 64));
      // this.DrawMap2d();
      // this.DrawPlayer();
      this.DrawRays3D();

      // await console.log(`x ${this.player.x}, y: ${this.player.y}`);
      this.HandleInputs();
      await sleep(16);
    }
  }
}

export const game = new Game();
game.Run();
