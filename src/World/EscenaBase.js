import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Resizer } from "../Utils/Resizer.js";

export class EscenaBase {
  constructor() {
    // Buscamos el contenedor específico del HTML
    this.container = document.getElementById("simulador-wrapper");

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0b0e);

    // La cámara ahora usa las proporciones del contenedor
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(6, 5, 8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    // Ajustamos el renderizador al tamaño del contenedor
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // IMPORTANTE: Lo agregamos dentro del div, no del body
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.crearLuces();

    // Le pasamos el contenedor al resizer
    new Resizer(this.camera, this.renderer, this.container);
  }

  crearLuces() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    this.scene.add(ambientLight, dirLight);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
