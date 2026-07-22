import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import GUI from "lil-gui";

export function initSimuladorSolenoide(container) {
  // Limpiar contenedor por si se reinicia
  container.innerHTML = "";

  const scene = new THREE.Scene();
  // Mantenemos el fondo oscuro de tu estilo
  scene.background = new THREE.Color("#0b0b0e");

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(20, 20, 20);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Parámetros físicos e integración
  const params = {
    corriente: 5,
    vueltas: 15,
    longitud: 15,
    radio: 3,
    lineasCampo: 4, // Cantidad de semillas a trazar
    resolucionCable: 30, // Puntos por cada vuelta
    limiteEspacial: 13, // limite de dibujo de las lineas de campo
  };

  let solenoideMesh;
  const lineasCampoGroup = new THREE.Group();
  scene.add(lineasCampoGroup);

  // Materiales consistentes con tu estética
  const matCobre = new THREE.MeshStandardMaterial({
    // color: 0xb87333,
    color: 0xe67e22,
    metalness: 0.8,
    roughness: 0.2,
  });

  const matLineaB = new THREE.LineBasicMaterial({
    color: 0x00d2ff,
    transparent: true,
    opacity: 0.8,
  });

  function updateLength() {
    // Actualizar la longitud del solenoide y cambiar el limite de dibujo para que sea acorde
    params.limiteEspacial = params.longitud - 2;
    generarSimulacion();
  }

  function generarSimulacion() {
    // 1. Limpiar geometría anterior
    if (solenoideMesh) scene.remove(solenoideMesh);
    lineasCampoGroup.clear();

    // 2. Discretizar el cable del solenoide (Crear los segmentos dl)
    const puntosCable = [];
    const totalSegmentos = Math.floor(params.vueltas * params.resolucionCable);

    for (let i = 0; i <= totalSegmentos; i++) {
      const t = i / totalSegmentos;
      const theta = t * params.vueltas * Math.PI * 2;
      const x = params.radio * Math.cos(theta);
      const y = params.radio * Math.sin(theta);
      const z = (t - 0.5) * params.longitud;
      puntosCable.push(new THREE.Vector3(x, y, z));
    }

    // Dibujar el modelo 3D del solenoide
    const curve = new THREE.CatmullRomCurve3(puntosCable);
    const tubeGeo = new THREE.TubeGeometry(
      curve,
      totalSegmentos,
      0.2,
      8,
      false
    );
    solenoideMesh = new THREE.Mesh(tubeGeo, matCobre);
    scene.add(solenoideMesh);

    // 3. Función Biot-Savart Numérica
    // Calcula el vector B en un punto p del espacio sumando el aporte de todos los dl
    function calcularCampoB(p) {
      const B = new THREE.Vector3(0, 0, 0);
      const dl = new THREE.Vector3();
      const r_vec = new THREE.Vector3();
      const cross = new THREE.Vector3();

      for (let i = 0; i < puntosCable.length - 1; i++) {
        const p1 = puntosCable[i];
        const p2 = puntosCable[i + 1];

        // Vector del segmento del cable (dl)
        dl.subVectors(p2, p1);

        // Punto medio del segmento
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);

        // Vector desde el segmento de cable al punto de evaluación (r)
        r_vec.subVectors(p, mid);
        const r2 = r_vec.lengthSq();

        if (r2 < 0.1) continue; // Evitar la singularidad (división por cero) si tocamos el cable

        const r_dist = Math.sqrt(r2);
        r_vec.divideScalar(r_dist); // Normalizamos para obtener r unitario (r_hat)

        // Producto cruz: dl x r_hat
        cross.crossVectors(dl, r_vec);

        // B += (dl x r_hat) * I / r^2
        // Nota: Omitimos mu_0 / 4pi porque para trazar las líneas solo necesitamos el vector dirección
        cross.multiplyScalar(params.corriente / r2);
        B.add(cross);
      }
      return B;
    }

    // 4. Trazado de líneas de campo (Streamline Tracing)
    const pasoIntegracion = 0.5;
    const maxPasos = 250; // Límite para que no se calcule infinitamente
    // const limiteEspacial = params.longitud - 2.5; // Límite de la caja de simulación
    const limiteEspacial = params.limiteEspacial; // Límite de la caja de simulación

    // Generar puntos "semilla" (desde dónde nace cada línea de campo)
    const semillas = [];

    // 1. Calculamos la intensidad relativa del campo (proporcional a B)
    // B es proporcional a (Corriente * Espiras) / Longitud
    const intensidadB = (params.corriente * params.vueltas) / params.longitud;

    // 2. Traducimos esa intensidad a cantidad de anillos concéntricos.
    // Usamos un factor de escala (ej. 0.4) para que valores estándar den 2 o 3 anillos.
    // Limitamos el máximo a 4 anillos (61 líneas en total) para cuidar el rendimiento.
    const anillos = Math.max(1, Math.min(6, Math.floor(intensidadB * 0.4)));

    // --- DISTRIBUCIÓN 3D EN ANILLOS CONCÉNTRICOS ---
    // const radioMaximo = params.radio * 0.5;
    const radioMaximo = params.radio * 0.7;

    // 3. Siempre colocamos una línea exactamente en el eje central
    semillas.push(new THREE.Vector3(0, 0, 0));

    // 4. Generamos los anillos concéntricos hacia afuera
    // Si anillos es 0 (campo muy débil), este bucle no se ejecuta.
    for (let anillo = 1; anillo <= anillos; anillo++) {
      // Distancia uniforme desde el centro para este anillo
      const r = (anillo / anillos) * radioMaximo;

      // Para que la separación entre líneas se mantenga constante,
      // los anillos más grandes necesitan tener más líneas (6, 12, 18, 24...)
      const lineasEnEsteAnillo = anillo * 3;

      for (let i = 0; i < lineasEnEsteAnillo; i++) {
        const theta = (i / lineasEnEsteAnillo) * Math.PI * 2;
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);
        semillas.push(new THREE.Vector3(x, y, 0));
      }
    }

    // // Generar puntos "semilla" (desde dónde nace cada línea de campo)
    // const semillas = [];

    // // --- DISTRIBUCIÓN 3D EN ANILLOS CONCÉNTRICOS ---
    // const radioMaximo = params.radio * 0.5;

    // // Calculamos cuántos anillos caben según el valor del GUI
    // const anillos = Math.max(1, Math.floor(params.lineasCampo / 2));

    // // 1. Siempre colocamos una línea exactamente en el eje central
    // semillas.push(new THREE.Vector3(0, 0, 0));

    // // 2. Generamos los anillos concéntricos hacia afuera
    // for (let anillo = 1; anillo <= anillos; anillo++) {
    //   // Distancia uniforme desde el centro para este anillo
    //   const r = (anillo / anillos) * radioMaximo;

    //   // Para que la separación entre líneas se mantenga constante,
    //   // los anillos más grandes necesitan tener más líneas (6, 12, 18...)
    //   const lineasEnEsteAnillo = anillo * 6;

    //   for (let i = 0; i < lineasEnEsteAnillo; i++) {
    //     const theta = (i / lineasEnEsteAnillo) * Math.PI * 2;
    //     const x = r * Math.cos(theta);
    //     const y = r * Math.sin(theta);
    //     semillas.push(new THREE.Vector3(x, y, 0));
    //   }
    // }

    // // 3. Semillas externas (campo de retorno)
    // semillas.push(new THREE.Vector3(params.radio * 1.6, 0, 0));
    // semillas.push(new THREE.Vector3(-params.radio * 1.6, 0, 0));
    // if (anillos > 1) {
    //   // Retorno superior e inferior para que el 3D luzca bien
    //   semillas.push(new THREE.Vector3(0, params.radio * 1.6, 0));
    //   semillas.push(new THREE.Vector3(0, -params.radio * 1.6, 0));
    // }

    // Integración por método de Euler
    semillas.forEach((semilla) => {
      let p;

      // Trazar hacia adelante (sentido del campo)
      const puntosAdelante = [semilla.clone()];
      p = semilla.clone();
      for (let i = 0; i < maxPasos; i++) {
        const B = calcularCampoB(p);
        if (B.lengthSq() === 0) break;
        B.normalize(); // Solo importa la dirección para trazar la línea
        p.addScaledVector(B, pasoIntegracion);
        puntosAdelante.push(p.clone());
        if (p.length() > limiteEspacial) break; // Detener si sale de los límites
      }

      // Trazar hacia atrás (sentido opuesto al campo)
      const puntosAtras = [];
      p = semilla.clone();
      for (let i = 0; i < maxPasos; i++) {
        const B = calcularCampoB(p);
        if (B.lengthSq() === 0) break;
        B.normalize();
        p.addScaledVector(B, -pasoIntegracion);
        puntosAtras.push(p.clone());
        if (p.length() > limiteEspacial) break;
      }

      // Unir ambas trayectorias
      const trayectoriaCompleta = [...puntosAtras.reverse(), ...puntosAdelante];

      // Renderizar línea en Three.js
      const geoLinea = new THREE.BufferGeometry().setFromPoints(
        trayectoriaCompleta
      );
      const linea = new THREE.Line(geoLinea, matLineaB);
      lineasCampoGroup.add(linea);
    });
  }

  // Iluminación
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const pointLight = new THREE.PointLight(0xffffff, 1);
  pointLight.position.set(10, 20, 10);
  scene.add(pointLight);

  // Controles Lil-GUI
  const gui = new GUI({
    container: container,
    title: "Parámetros del Solenoide",
  });
  gui.domElement.style.position = "absolute";
  gui.domElement.style.right = "20px";
  gui.domElement.style.bottom = "20px";

  // Al cambiar un valor, recalculamos Biot-Savart
  gui
    .add(params, "corriente", 1, 10, 1)
    .name("Corriente (I)")
    .onChange(generarSimulacion);
  gui
    .add(params, "vueltas", 5, 40, 1)
    .name("Cant. Espiras (N)")
    .onChange(generarSimulacion);
  gui
    .add(params, "longitud", 5, 30, 1)
    .name("Longitud (L)")
    .onChange(updateLength);
  gui
    .add(params, "radio", 2, 8, 0.5)
    .name("Radio (r)")
    .onChange(generarSimulacion);
  gui
    .add(params, "limiteEspacial", 1, 28, 2)
    .name("Límite Espacial")
    .listen()
    .onChange(generarSimulacion);

  // Primera generación
  generarSimulacion();

  // Bucle principal
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Redimensionar responsivo
  window.addEventListener("resize", () => {
    if (!container.clientWidth) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}
