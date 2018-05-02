import * as THREE from "three";
import rhea from "rhea";
// import OrbitControls from "./OrbitControls.js";
import ScoredImageSource from "./ScoredImageSource.js";
import ParticleImageFactory from "./ParticleImageFactory.js";
import MovingParticleFactory from "./MovingParticleFactory.js";
import { makeLogger } from "../logging/Logger.js";

const log = makeLogger("Stage");

const erin = location.search === "?erin";

export default class Stage {
  constructor({ container = document.body, data = {} } = {}) {
    log("created");
    this.actors = [];
    this.container = container;

    this._init();

    // start the animation loop
    this._render();
  }
  _init() {
    this._initScene();
    this._initRenderer();
    this._initCamera();
    if (!erin) {
      this._initAMQ();
    }
    // this._initControls();

    // wait a bit then add particles
    setTimeout(() => {
      if (erin) {
        // create erin's paths
        this.erinPaths = [
          this._initMovingParticles({ pointCount: 14, speed: 0.002 }),
          this._initMovingParticles({ pointCount: 14, speed: 0.002 }),
          this._initMovingParticles({ pointCount: 10, speed: 0.002 }),
          this._initMovingParticles({ pointCount: 10, speed: 0.002 }),
          this._initMovingParticles({ pointCount: 24, speed: 0.0013 }),
          this._initMovingParticles({ pointCount: 24, speed: 0.0013 })
        ];
      } else {
        // create ted's paths
        for (let i = 0; i < 2; ++i) {
          this._initMovingParticles();
        }
      }
    }, 1000);
  }
  killAmazon() {
    document.querySelector("#amazon").classList.add("dead");
    this.erinPaths.pop().destroy();
    this.erinPaths.pop().destroy();
    this.erinPaths.pop().destroy();
    this.erinPaths.pop().destroy();
  }
  _initAMQ() {
    rhea.on("message", context => {
      this._handleAMQMessage(context.message.body);
    });
    // const server = "ws://127.0.0.1:8080";
    const server = "ws://console-demo2-amq.apps.summit-onstage.sysdeseng.com";
    const ws = rhea.websocket_connect(WebSocket);
    const connection = rhea.connect({
      connection_details: ws(server, ["binary"]),
      reconnect: true
    });
    connection.open_receiver("multicast.amq-demo-stats");

    // create some progress bars for the clouds

    this.dc1bar = document.querySelector(".dc-1 .bottombar");
    this.dc2bar = document.querySelector(".dc-2 .bottombar");
    this.dc3bar = document.querySelector(".dc-3 .bottombar");
  }
  _handleAMQMessage(data) {
    const PrivateCloud = data["ONSTAGE"];
    const AzureCloud = data["AZR"];
    const AmazonCloud = data["AWS"];

    const PrivateCloudOn = PrivateCloud > 0;
    const AzureCloudOn = AzureCloud > 0;
    const AmazonCloudOn = AmazonCloud > 0;
    console.log(
      `Private ${PrivateCloud} - Azure ${AzureCloud} - Amazon ${AmazonCloud}`
    );

    const prp = PrivateCloudOn ? Math.min(1.0, PrivateCloud / 200) : 0.0;
    const azp = AzureCloudOn ? Math.min(1.0, AzureCloud / 280) : 0.0;
    const amp = AmazonCloudOn ? Math.min(1.0, AmazonCloud / 280) : 0.0;

    this.dc1bar.style.clipPath = `polygon(0px 0px, ${prp * 100}% 0px, ${prp *
      100}% 100%, 0px 100%)`;
    this.dc2bar.style.clipPath = `polygon(0px 0px, ${azp * 100}% 0px, ${azp *
      100}% 100%, 0px 100%)`;
    this.dc3bar.style.clipPath = `polygon(0px 0px, ${amp * 100}% 0px, ${amp *
      100}% 100%, 0px 100%)`;

    if (AzureCloudOn) {
      this.actors[1].show();
    } else {
      this.actors[1].hide();
    }

    if (AmazonCloudOn) {
      this.actors[0].show();
    } else {
      this.actors[0].hide();
    }
  }
  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  _initImageSource() {
    this._initScoredImageSource();
  }
  _initScoredImageSource() {
    this.imageSource = new ScoredImageSource();
    this.imageSource.onImage(scoredImage => {
      log(`scored image is on stage!`);
      // const particleImage = ParticleImageFactory.create(
      //   this,
      //   scoredImage.pixels
      // );
      // this._registerActor(particleImage);
      this._initMovingParticles();
    });
  }
  _initMovingParticles(...args) {
    const mp = MovingParticleFactory.create(this, ...args);
    this._registerActor(mp);
    mp.onComplete(mp => this._unregisterActor(mp));
    return mp;
  }
  _registerActor(actor) {
    log(`adding actor ${actor.name} to the stage`);
    this.actors.push(actor);
  }
  _unregisterActor(actor) {
    log(`removing actor ${actor.name} from the stage`);
    this.actors.splice(this.actors.indexOf(actor), 1);
  }
  _initCamera() {
    // this._initOrthographicCamera();
    this._initPerspectiveCamera();
  }
  _initPerspectiveCamera() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    log(`res: ${w} x ${h}`);
    this.camera = new THREE.PerspectiveCamera(70, w / h, 1, 3000);
    this.camera.position.z = 600;
  }
  _initOrthographicCamera() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const f = 1000;

    this.camera = new THREE.OrthographicCamera(
      w / -2,
      w / 2,
      h / 2,
      h / -2,
      1,
      f
    );
    this.camera.position.z = 400;
  }
  _initScene() {
    this.scene = new THREE.Scene();
  }
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0, 0);
    this.container.appendChild(this.renderer.domElement);
  }
  _update() {
    this.actors.forEach(actor => actor.update(this));
  }
  _render() {
    requestAnimationFrame(this._render.bind(this));
    this._update();
    this.renderer.render(this.scene, this.camera);
  }
}
