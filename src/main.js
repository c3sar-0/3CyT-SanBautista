import { EscenaBase } from "./World/EscenaBase.js";
import { ConductorSim } from "./World/ConductorSim.js";
import GUI from "lil-gui";
import * as THREE from "three";
import { QuizManager } from "./Utils/QuizManager.js";

// ... la inicialización previa de EscenaBase, ConductorSim y lil-gui ...

// Inicializamos el gestor de ejercicios abajo de la simulación
const quiz = new QuizManager();

// ... tu bucle tick() de renderizado continuo ...

// Inicializar la infraestructura 3D
const base = new EscenaBase();

// Inicializar la simulación física
const simulacion = new ConductorSim(base.scene);

// Configurar Interfaz de Usuario (lil-gui)
const gui = new GUI({
  title: "Control de valores",
  container: document.getElementById("gui-container"),
});
// gui.domElement.style.position = "absolute";
// gui.domElement.style.right = "20px";

// ARREGLADO: Pasamos explícitamente el cambio de estado mediante un objeto a actualizarParametros
gui
  .add(simulacion.props, "corriente", -5.0, 5.0, 0.1)
  .name("Corriente (I)")
  .onChange((v) => {
    simulacion.actualizarParametros({ corriente: v });
  });

gui
  .add(simulacion.props, "numLineas", 1, 10, 1)
  .name("Líneas de Campo")
  .onChange((v) => {
    simulacion.actualizarParametros({ numLineas: v });
  });

gui
  .add(simulacion.props, "mostrarFlechas")
  .name("Ver Vectores B")
  .onChange((v) => {
    simulacion.actualizarParametros({ mostrarFlechas: v });
  });

// Loop de Animación y Renderizado continuo
const clock = new THREE.Clock();

function tick() {
  requestAnimationFrame(tick);

  const delta = clock.getDelta();

  // Animamos los componentes internos (Campo Magnético + Electrones)
  simulacion.animar(delta);

  // Renderizamos la cámara en la escena
  base.render();
}

tick();
