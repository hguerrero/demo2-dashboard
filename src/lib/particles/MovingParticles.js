import * as THREE from "three";
import { cloneDeep } from "lodash";
import Actor from "./Actor.js";
import { makeLogger } from "../logging/Logger.js";
import ShaderLoader from "./ShaderLoader.js";
import free from "./Free.js";

const log = makeLogger("MovingParticles");

const erin = location.search === "?erin";

export default class MovingParticles extends Actor {
  constructor({ stage, paths = {}, path = 0, color, image } = {}) {
    super(stage);

    this.path = path;
    this.paths = cloneDeep(paths);
    this.color = color;
    this.image = image;

    this.pointCount = erin ? 30 : 10;
    this.speed = 0.002;
    this.delaySpread = 1.0;
    this.size = erin ? 30 : 10;
    this.spread = 0;
    this.loopParticles = true;
    this.progress = 0;

    log("created");

    this._initRaycasting();
    this._initParticles();

    this._raycastPaths();
  }

  static _initRaycastPlane(scene) {
    if (!MovingParticles.raycastPlane) {
      log("initializing shared raycast plane");
      let geometry = new THREE.PlaneBufferGeometry(7500, 7500, 1, 1);
      let material = new THREE.MeshBasicMaterial();
      material.transparent = true;
      material.opacity = 0;
      let plane = new THREE.Mesh(geometry, material);
      MovingParticles.raycastPlane = plane;
      scene.add(plane);
    } else {
      log("raycast plane already initialized, skipping");
    }
  }

  update() {
    this._updateMove();
    this._updateProgress();
    // this._checkProgress();
  }
  destroy() {
    free(this.stage.scene, MovingParticles.raycastPlane);
    free(this.stage.scene, this.points);
  }

  _updateMove() {}

  _updateProgress() {
    const progressAttr = this.geometry.attributes.progress;

    this.progress += this.speed;

    for (let i = 0; i < progressAttr.array.length; ++i) {
      progressAttr.array[i] += this.speed;
    }

    progressAttr.needsUpdate = true;
  }

  _checkProgress() {
    if (this.progress >= 1 + this.delaySpread) {
      log(`moving particles is complete, destroying`);
      this.destroy();
      this.completeHandler(this);
    }
  }

  onComplete(cb) {
    this.completeHandler = cb;
  }

  _initRaycasting() {
    MovingParticles._initRaycastPlane(this.stage.scene);
    this._initRaycaster();
  }

  _initRaycaster() {
    if (!MovingParticles.raycaster) {
      MovingParticles.raycaster = new THREE.Raycaster();
    }
  }

  _raycast(x, y) {
    MovingParticles.raycaster.setFromCamera(
      new THREE.Vector2(x, y),
      this.stage.camera
    );
    const result = [];
    const intersection = MovingParticles.raycaster.intersectObject(
      MovingParticles.raycastPlane
    )[0]; // intersecting a plane, so there can be only one result

    if (intersection) {
      result.push(intersection.point.x);
      result.push(intersection.point.y);
    }

    return result;
  }

  _raycastPaths() {
    // raycast the coords to screenspace and then copy them into the paths uniform
    const transformedCoords = this._transformCoordinates(
      this.material.uniforms.paths.value
    );
    this.material.uniforms.paths.value.forEach(
      (v, i, c) => (c[i] = transformedCoords[i])
    );
  }

  _initParticles(addToScene = true) {
    this.moveDelay = this._getMoveDelayAttribute();
    this.material = this._getMaterial();
    this.geometry = this._getGeometry(this.material, this.moveDelay);
    this.points = this._getPoints(this.geometry, this.material);

    log("particles initialized");

    if (addToScene) {
      this.stage.scene.add(this.points);
    }
  }

  _getGeometry(material, delay) {
    log("creating geometry");
    const geometry = new THREE.BufferGeometry();

    const positions = this._getPositionAttribute();

    // save a copy of the initial positions
    this.initialPositions = positions.clone().array;

    geometry.addAttribute("position", positions);
    geometry.addAttribute("moveDelay", this.moveDelay);
    geometry.addAttribute("variation", this._getVariationAttribute());
    geometry.addAttribute("progress", this._getProgressAttribute(delay));
    geometry.addAttribute(
      "path",
      this._getPathAttribute(material.uniforms.paths.value.length)
    );
    geometry.addAttribute("color", this._getColorAttribute(positions));

    return geometry;
  }

  _getPoints(geometry, material) {
    log("creating points");
    const points = new THREE.Points(geometry, material);
    return points;
  }

  _getMaterial() {
    log("creating material");
    const shaders = ShaderLoader.load();

    const fragmentShader = shaders.frag;
    const vertexShader = shaders.vert
      .replace("${PATH_NODES}", this.paths.nodes)
      .replace("${PATH_COMPONENTS}", this.paths.components)
      .replace("${PATH_SPREAD}", this.spread.toPrecision(8))
      .replace("${PATH_COUNT}", this.paths.count);

    return new THREE.ShaderMaterial({
      uniforms: {
        size: { type: "t", value: this.size },
        paths: this._getPathsUniform(),
        opacity: { type: "f", value: 1.0 },
        loopParticles: { type: "f", value: +this.loopParticles },
        texture: {
          value: new THREE.TextureLoader().load(
            document.querySelector("#particle-sprite").src
          )
        }
      },
      transparent: true,
      vertexShader,
      fragmentShader
    });
  }

  _getPositionAttribute() {
    log("creating position attribute");
    const array = new Float32Array(this.pointCount * 3);

    for (let i = 0; i < this.pointCount; i++) {
      const x = i % 200;
      const y = Math.floor(i / 200);
      const z = 0;

      array[i * 3 + 0] = x;
      array[i * 3 + 1] = y;
      array[i * 3 + 2] = z;
    }

    return new THREE.Float32BufferAttribute(array, 3);
  }

  _transformCoordinates(coordinates) {
    const width = this.stage.renderer.domElement.clientWidth;
    const height = this.stage.renderer.domElement.clientHeight;

    const newCoordinates = [];

    for (let i = 0; i < coordinates.length; i += 2) {
      const x = coordinates[i] / width * 2 - 1;
      const y = -coordinates[i + 1] / height * 2 + 1;
      const newCoord = this._raycast(x, y);
      // const newCoord = [x, y];
      newCoordinates.push(newCoord[0]);
      newCoordinates.push(newCoord[1]);
      // newCoordinates.push(coordinates[i]);
      // newCoordinates.push(coordinates[i + 1]);
    }

    return newCoordinates;
  }

  _getPathsUniform() {
    log("creating paths attribute");
    return new THREE.Uniform(this.paths.coordinates);
  }

  _getProgressAttribute(delay) {
    log("creating progress attribute");
    const array = delay.array.slice();
    return new THREE.Float32BufferAttribute(array, 1);
  }

  _getPathAttribute(pathCount) {
    log("creating path attribute");
    const array = new Float32Array(this.pointCount);
    for (let i = 0; i < this.pointCount; i++) {
      array[i] = this.path;
    }
    return new THREE.Float32BufferAttribute(array, 1);
  }

  _getMoveDelayAttribute() {
    log("creating move delay attribute");
    const array = new Float32Array(this.pointCount);

    for (let i = 0; i < this.pointCount; i++) {
      array[i] = -this.delaySpread * (i / this.pointCount);
    }

    return new THREE.Float32BufferAttribute(array, 1);
  }

  _getVariationAttribute() {
    log("creating position variation attribute");
    const array = new Float32Array(this.pointCount);

    for (let i = 0; i < this.pointCount; i++) {
      array[i] = Math.random();
    }

    return new THREE.Float32BufferAttribute(array, 1);
  }

  /* colors are based on positions, currently, but not forever */
  _getColorAttribute(positions) {
    log("creating color attribute");
    const array = new Float32Array(this.pointCount * 3);
    const color = new THREE.Color();
    let vertex;

    for (let i = 0; i < this.pointCount; ++i) {
      const i3 = i * 3;
      /* white */
      // array[i3 + 0] = 255 / 255;
      // array[i3 + 1] = 255 / 255;
      // array[i3 + 2] = 255 / 255;

      /* random */
      array[i3 + 0] = this.color.r;
      array[i3 + 1] = this.color.g;
      array[i3 + 2] = this.color.b;

      /* yellow */
      // array[i3 + 0] = 246 / 255;
      // array[i3 + 1] = 203 / 255;
      // array[i3 + 2] = 105 / 255;
    }

    return new THREE.Float32BufferAttribute(array, 3);
  }
}
