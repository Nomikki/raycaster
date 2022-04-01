import "@/index.scss";
import Player from "./player";
import Color from "./utils/colors";
import { ensure, rgbToHex } from "./utils";

export class Game {
  canvas: Element;
  ctx: CanvasRenderingContext2D;

  width: number;
  height: number;
  player: Player;

  constructor() {
    this.canvas = ensure(document.querySelector("#screen"));
    this.ctx = ensure((this.canvas as HTMLCanvasElement).getContext("2d"));
    this.width = 1024;
    this.height = 512;

    this.player = new Player();
  }

  clear(color: Color): void {
    this.ctx.fillStyle = rgbToHex(color.r, color.g, color.b);
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  putPixel(x: number, y: number, color: Color): void {
    const id = this.ctx.getImageData(0, 0, this.width, this.height);
    const off = (y * id.width + x) * 4;
    const pixels = id.data;

    pixels[off] = color.r;
    pixels[off + 1] = color.g;
    pixels[off + 2] = color.b;
    pixels[off + 3] = 255;

    this.ctx.putImageData(id, 0, 0);
  }

  run(): void {
    // console.log("Game is running");
    this.clear(new Color(64, 64, 64));
    this.putPixel(32, 32, new Color(255, 0, 0));
  }
}

export const game = new Game();
game.run();
