import Color from "./colors";

export const ensure = <T>(
  argument: T | undefined | null,
  message = "This value was promised to be there."
): T => {
  if (argument === undefined || argument === null) {
    throw new TypeError(message);
  }

  return argument;
};

export const rgbToHex = (color: Color): string => {
  return (
    "#" +
    ((1 << 24) + (color.r << 16) + (color.g << 8) + color.b)
      .toString(16)
      .slice(1)
  );
};

export const float2int = (value: number): number => {
  return value >> 0;
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
