import { float2int } from "./utils";

export default class Map {
  mapX = 8;
  mapY = 8;
  mapS = 32;

  data = [
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 1, 1, 1,
    1, 0, 0, 0, 0, 1, 0, 1,
    1, 0, 0, 0, 2, 1, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 0, 0, 0, 0, 0, 0, 1,
    1, 2, 2, 1, 1, 1, 1, 1
  ];

  IsWall(x: number, y: number): boolean {
    x = float2int(x);
    y = float2int(y);
    if (x > 0 && y > 0 && x < this.mapX && y < this.mapY)
    {
      const id = this.data[y*this.mapX + x];
      if (id === 1)
        return true;
      else 
        return false;
    }
    return true;
  }

}