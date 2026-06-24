// IMPORTANTE: Ahora importamos directamente el archivo .json
const baseEjercicios = await fetch("../ejercicios.json").then((data) =>
  data.json()
);

export class QuizManager {
  constructor() {
    // El resto del código permanece exactamente igual
    this.ejercicios = baseEjercicios;
    this.indexActual = 0;
    this.solucionVisible = false;

    // Mapear elementos del DOM
    this.elNum = document.getElementById("quiz-num");
    this.elPregunta = document.getElementById("quiz-pregunta");
    this.elSolucionBox = document.getElementById("quiz-solucion-box");
    this.elSolucion = document.getElementById("quiz-solucion");
    this.btnSolucion = document.getElementById("btn-solucion");
    this.btnSiguiente = document.getElementById("btn-siguiente");

    this.initEvents();
    this.mostrarEjercicio();
  }

  initEvents() {
    this.btnSolucion.addEventListener("click", () => this.toggleSolucion());
    this.btnSiguiente.addEventListener("click", () =>
      this.siguienteEjercicio()
    );
  }

  mostrarEjercicio() {
    const item = this.ejercicios[this.indexActual];

    this.elNum.innerText = `Ejercicio ${this.indexActual + 1} de ${
      this.ejercicios.length
    }`;
    this.elPregunta.innerHTML = item.pregunta;
    this.elSolucion.innerHTML = item.solucion;

    this.solucionVisible = false;
    this.elSolucionBox.style.display = "none";
    this.btnSolucion.innerText = "Mostrar Solución";

    if (window.renderMathInElement) {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false },
        ],
        throwOnError: false,
      });
    }
  }

  toggleSolucion() {
    this.solucionVisible = !this.solucionVisible;
    if (this.solucionVisible) {
      this.elSolucionBox.style.display = "block";
      this.btnSolucion.innerText = "Ocultar Solución";
    } else {
      this.elSolucionBox.style.display = "none";
      this.btnSolucion.innerText = "Mostrar Solución";
    }
  }

  siguienteEjercicio() {
    this.indexActual = (this.indexActual + 1) % this.ejercicios.length;
    this.mostrarEjercicio();
  }
}
