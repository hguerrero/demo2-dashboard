import Stage from "./lib/particles/Stage.js";
import PathTracer from "./lib/particles/PathTracer.js";
import { makeLogger } from "./lib/logging/Logger.js";

const log = makeLogger("index");

if (location.search === "?erin") {
  document.body.classList.add("erin");
}

log("launching app");
window.stage = new Stage();

log("launching path tracer");
window.tracer = new PathTracer();
