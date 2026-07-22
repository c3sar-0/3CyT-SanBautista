import { initSimuladorRecto } from "./conductorRecto.js";
import { initSimuladorSolenoide } from "./solenoide.js";

let rectoInicializado = false;
let solenoideInicializado = false;

window.navigate = function (viewId) {
  // Ocultar todas las vistas
  document.querySelectorAll(".view-container").forEach((el) => {
    el.classList.remove("active");
  });

  // Mostrar la vista seleccionada
  document.getElementById(`view-${viewId}`).classList.add("active");

  // Inicializar Three.js bajo demanda (lazy loading) para ahorrar recursos
  if (viewId === "recto" && !rectoInicializado) {
    initSimuladorRecto(document.getElementById("simulador-recto-wrapper"));
    rectoInicializado = true;
  }

  if (viewId === "solenoide" && !solenoideInicializado) {
    initSimuladorSolenoide(
      document.getElementById("simulador-solenoide-wrapper")
    );
    solenoideInicializado = true;
  }
};
