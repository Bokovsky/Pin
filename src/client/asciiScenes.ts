import * as auroraFjord from "./ascii/aurora-fjord";
import * as deepReef from "./ascii/deep-reef";
import * as nightCoast from "./ascii/night-coast";
import type { Piece } from "./ascii/types";

export interface AsciiScene {
  id: "aurora-fjord" | "deep-reef" | "night-coast";
  piece: Piece;
}

export const ASCII_SCENES: AsciiScene[] = [
  { id: "aurora-fjord", piece: auroraFjord },
  { id: "deep-reef", piece: deepReef },
  { id: "night-coast", piece: nightCoast },
];

export function pickRandomScene(rand: () => number = Math.random): AsciiScene {
  const index = Math.min(
    ASCII_SCENES.length - 1,
    Math.floor(rand() * ASCII_SCENES.length)
  );
  return ASCII_SCENES[index];
}
