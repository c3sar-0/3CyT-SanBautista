import * as THREE from "three";

export class ConductorSim {
  constructor(scene) {
    this.scene = scene;
    this.props = { corriente: 2.0, numLineas: 5, mostrarFlechas: true };

    this.campoGrupo = new THREE.Group();
    this.scene.add(this.campoGrupo);

    this.particulasGrupo = new THREE.Group();
    this.scene.add(this.particulasGrupo);

    this.todasLasFlechas = [];

    this.construirConductor();
    this.construirParticulas(200);
    this.construirLineasCampo();
  }

  construirConductor() {
    const cableGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 32);
    const cableMat = new THREE.MeshBasicMaterial({
      color: 0xe67e22,
      transparent: true,
      opacity: 0.25,
      wireframe: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false, // <-- SOLUCIÓN 1: Evita que el cilindro oculte las partículas desde abajo
    });
    this.cable = new THREE.Mesh(cableGeo, cableMat);
    this.scene.add(this.cable);

    const flechaGeo = new THREE.ConeGeometry(0.2, 0.4, 16);
    const flechaMat = new THREE.MeshBasicMaterial({ color: 0xe74c3c });
    this.flechaCorriente = new THREE.Mesh(flechaGeo, flechaMat);
    this.flechaCorriente.position.set(0, 4.3, 0);
    this.scene.add(this.flechaCorriente);
  }

  construirParticulas(cantidad) {
    const posiciones = [];
    const cableRadio = 0.12;
    const cableAltura = 7.8;

    for (let i = 0; i < cantidad; i++) {
      const r = Math.random() * cableRadio;
      const theta = Math.random() * Math.PI * 2;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;
      const y = (Math.random() - 0.5) * cableAltura;

      posiciones.push(x, y, z);
    }

    const particulasGeo = new THREE.BufferGeometry();
    particulasGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(posiciones, 3)
    );

    const particulasMat = new THREE.PointsMaterial({
      color: 0x00ffaa,
      size: 0.06,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false, // <-- SOLUCIÓN 1: Mismo principio para las partículas
    });

    this.particulas = new THREE.Points(particulasGeo, particulasMat);
    this.particulasGrupo.add(this.particulas);
  }

  construirLineasCampo() {
    while (this.campoGrupo.children.length > 0) {
      this.campoGrupo.remove(this.campoGrupo.children[0]);
    }
    this.todasLasFlechas = [];

    for (let i = 1; i <= this.props.numLineas; i++) {
      const radio = i * 0.7 + 0.3;
      const puntos = [];
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2;
        puntos.push(
          new THREE.Vector3(Math.cos(theta) * radio, 0, Math.sin(theta) * radio)
        );
      }

      const lineaGeo = new THREE.BufferGeometry().setFromPoints(puntos);
      const lineaMat = new THREE.LineBasicMaterial({
        color: 0x00d2ff,
        transparent: true,
        opacity: 0.7,
      });
      const anillo = new THREE.Line(lineaGeo, lineaMat);

      anillo.position.y =
        (i - (this.props.numLineas + 1) / 2) * (6.0 / this.props.numLineas);

      anillo.userData = { radio: radio };

      if (this.props.mostrarFlechas) {
        for (let f = 0; f < 3; f++) {
          const flechaB = new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            0.25,
            0x33ff00,
            0.08,
            0.06
          );

          const anguloFijo = (f / 3) * Math.PI * 2;
          flechaB.userData = { anguloFijo: anguloFijo };

          anillo.add(flechaB);
          this.todasLasFlechas.push(flechaB);
        }
      }
      this.campoGrupo.add(anillo);
    }
  }

  actualizarParametros(nuevosProps) {
    this.props = { ...this.props, ...nuevosProps };

    if (this.props.corriente >= 0) {
      this.flechaCorriente.rotation.z = 0;
      this.flechaCorriente.position.y = 4.3;
    } else {
      this.flechaCorriente.rotation.z = Math.PI;
      this.flechaCorriente.position.y = -4.3;
    }

    this.construirLineasCampo();
  }

  animar(delta) {
    const I = this.props.corriente;

    // 1. ANIMAR ELECTRONES (PARTÍCULAS)
    if (this.particulas) {
      const posiciones = this.particulas.geometry.attributes.position.array;
      const velocidadCorriente = I * 1.5;

      for (let i = 1; i < posiciones.length; i += 3) {
        posiciones[i] += velocidadCorriente * delta;

        if (posiciones[i] > 3.9) {
          posiciones[i] = -3.9;
        } else if (posiciones[i] < -3.9) {
          posiciones[i] = 3.9;
        }
      }
      this.particulas.geometry.attributes.position.needsUpdate = true;
    }

    // // 2. ANIMAR ANILLOS Y VECTORES
    // this.campoGrupo.children.forEach((anillo) => {
    //   const radio = anillo.userData.radio;

    //   // Rotar el anillo entero
    //   const velocidadAngular = (I * 0.4) / radio;
    //   anillo.rotation.y += velocidadAngular * delta;

    //   anillo.material.opacity =
    //     I === 0 ? 0 : Math.min(Math.abs(I) * 0.2 + 0.3, 1.0);

    //   // SOLUCIÓN 2: Calcular la tangente puramente en Coordenadas Locales
    //   anillo.children.forEach((flecha) => {
    //     if (I === 0) {
    //       flecha.visible = false;
    //       return;
    //     }
    //     flecha.visible = true;

    //     const anguloFijo = flecha.userData.anguloFijo;

    //     // La posición local en el anillo nunca cambia
    //     const x = Math.cos(anguloFijo) * radio;
    //     const z = Math.sin(anguloFijo) * radio;
    //     flecha.position.set(x, 0, z);

    //     // Derivada de la circunferencia (Tangente) multiplicada por el signo de la corriente
    //     const sentido = -Math.sign(I);
    //     const dirX = -Math.sin(anguloFijo) * sentido;
    //     const dirZ = Math.cos(anguloFijo) * sentido;

    //     // Como la flecha es "hija" del anillo, aplicamos esta dirección local y
    //     // Three.js se encarga mágicamente de rotarla junto con el anillo
    //     const direccionLocal = new THREE.Vector3(dirX, 0, dirZ).normalize();
    //     flecha.setDirection(direccionLocal);
    //   });
    // });
    // 2. ANIMAR ANILLOS Y VECTORES
    this.campoGrupo.children.forEach((anillo) => {
      const radio = anillo.userData.radio;

      // Rotar el anillo entero (Ley de Ampère para la velocidad)
      const velocidadAngular = (I * 0.4) / radio;
      anillo.rotation.y += velocidadAngular * delta;

      anillo.material.opacity =
        I === 0 ? 0 : Math.min(Math.abs(I) * 0.2 + 0.3, 1.0);

      anillo.children.forEach((flecha) => {
        if (I === 0) {
          flecha.visible = false;
          return;
        }
        flecha.visible = true;

        const anguloFijo = flecha.userData.anguloFijo;

        // Posición local en el anillo
        const x = Math.cos(anguloFijo) * radio;
        const z = Math.sin(anguloFijo) * radio;
        flecha.position.set(x, 0, z);

        // --- NUEVA LÓGICA DE MÓDULO FÍSICO ---
        // B es proporcional a |I| e inversamente proporcional al radio
        const intensidadB = (Math.abs(I) * 0.35) / radio;

        // Acotamos el largo para que no quede invisible ni rompa la pantalla si I es muy grande
        const largoFlecha = Math.max(0.01, Math.min(intensidadB, 1.0));

        // Escalamos la punta de la flecha proporcionalmente para que no se deforme
        const largoCabeza = largoFlecha * 0.3;
        const anchoCabeza = largoFlecha * 0.25;

        // Aplicamos el tamaño dinámico
        flecha.setLength(largoFlecha, largoCabeza, anchoCabeza);
        // -------------------------------------

        // Sentido de la tangente (Regla de la mano derecha con tu corrección)
        const sentido = -Math.sign(I);
        const dirX = -Math.sin(anguloFijo) * sentido;
        const dirZ = Math.cos(anguloFijo) * sentido;

        const direccionLocal = new THREE.Vector3(dirX, 0, dirZ).normalize();
        flecha.setDirection(direccionLocal);
      });
    });
  }
}
