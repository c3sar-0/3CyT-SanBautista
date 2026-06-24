export class Resizer {
  constructor(camera, renderer, container) {
    window.addEventListener("resize", () => {
      // Usamos las dimensiones del contenedor actualizado
      const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }
}
