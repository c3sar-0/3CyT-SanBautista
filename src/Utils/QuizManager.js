export class QuizManager {
  constructor() {
    this.ejercicios = []; // Arranca vacío mientras se descarga
    this.indexActual = 0;
    this.solucionVisible = false;

    // Mapear elementos del DOM (esto se hace de inmediato)
    this.elNum = document.getElementById("quiz-num");
    this.elPregunta = document.getElementById("quiz-pregunta");
    this.elSolucionBox = document.getElementById("quiz-solucion-box");
    this.elSolucion = document.getElementById("quiz-solucion");
    this.btnSolucion = document.getElementById("btn-solucion");
    this.btnSiguiente = document.getElementById("btn-siguiente");

    // Disparamos la carga asíncrona
    this.init();
  }

  async init() {
    try {
      // Buscamos el archivo en la raíz del servidor (gracias a la carpeta public/)
      const data = await fetch("/ejercicios.json");
      this.ejercicios = await data.json();

      // Una vez que los datos llegaron, activamos los eventos y mostramos el primer ítem
      this.initEvents();
      this.mostrarEjercicio();
    } catch (error) {
      console.error("Error cargando el archivo JSON de ejercicios:", error);
      this.elPregunta.innerText =
        "Error al cargar los ejercicios. Intenta de nuevo más tarde.";
    }
  }

  initEvents() {
    this.btnSolucion.addEventListener("click", () => this.toggleSolucion());
    this.btnSiguiente.addEventListener("click", () =>
      this.siguienteEjercicio()
    );
  }

  mostrarEjercicio() {
    // ... (Este método queda exactamente igual que antes) ...
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
