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

    this.width = 1024;
    this.height = 512;

    this.ctxID = this.ctx.getImageData(0, 0, this.width, this.height);
    this.keyLeft = false;
    this.keyRight = false;
    this.keyUp = false;
    this.keyDown = false;

    this.player = new Player(300, 300);
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

  FetchImage() {
    this.ctxID = this.ctx.getImageData(0, 0, this.width, this.height);
  }

  UpdateImage() {
    this.ctx.putImageData(this.ctxID, 0, 0);
  }

  DrawRect(x: number, y: number, w: number, h: number, color: Color) {
    this.ctx.fillStyle = rgbToHex(color);
    this.ctx.fillRect(x, y, w, h);
  }

  async DrawPlayer() {
    const color = new Color(255, 200, 0);
    const size = 8;
    this.DrawRect(
      this.player.x - size,
      this.player.y - size,
      size * 2,
      size * 2,
      color
    );

    this.DrawLine(this.player.x, this.player.y, this.player.x + (this.player.px*100), this.player.y + (this.player.py*100), new Color(255, 0, 0));
  }

  DrawLine(x0: number, y0: number, x1: number, y1: number, color: Color) {
    this.FetchImage();

    x0 = float2int(x0);
    y0 = float2int(y0);
    x1 = float2int(x1);
    y1 = float2int(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    color.b = 0;

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

    this.UpdateImage();
  }

  async DrawMap2d() {
    for (let y = 0; y < this.map.mapY; y++) {
      for (let x = 0; x < this.map.mapX; x++) {
        const tileID = this.map.data[y * this.map.mapX + x];
        let color = new Color(0, 0, 0);

        if (tileID === 1) {
          color = new Color(255, 255, 255);
        }

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

  async HandleInputs() {
    const movementSpeed = 2;
    const turningSpeed = 0.1;

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
      this.DrawMap2d();
      this.DrawPlayer();

      // await console.log(`x ${this.player.x}, y: ${this.player.y}`);
      this.HandleInputs();
      await sleep(16);
    }
  }
}

export const game = new Game();
game.Run();
