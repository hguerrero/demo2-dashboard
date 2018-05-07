import * as THREE from "three";
import MovingParticles from "./MovingParticles.js";
import ErinPattern from "../particles/ErinPattern.js";
import TedPattern from "../particles/TedPattern.js";
import { makeLogger } from "../logging/Logger";

const log = makeLogger("MovingParticleFactory");

const erin = location.search === "?erin";

export default class MovingParticleFactory {
  static create(stage, { pointCount, speed } = {}) {
    log("creating a moving particle object");

    // coordinates are: [ x1, y1, x2, y2, x3, y3, ..., xN, yN ]
    const paths = erin ? ErinPattern : TedPattern;

    const color = new THREE.Color(erin ? "#f7d580" : "#00FFBB");

    const path = MovingParticleFactory.pathCount;
    MovingParticleFactory.pathCount++;

    console.log(`path: ${path}`);
    if (path < paths.count) {
      return new MovingParticles({
        stage,
        paths,
        path,
        color,
        pointCount,
        speed
      });
    }
  }
}
MovingParticleFactory.pathCount = 0;
