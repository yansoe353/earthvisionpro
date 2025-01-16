// luma-splats-three.d.ts
declare module '@lumaai/luma-web' {
  import * as THREE from 'three';

  export class LumaSplatsThree {
    constructor(options: { source: string });
    source: string;
    renderer: { domElement: HTMLElement };
    scene: THREE.Scene;
    camera: THREE.Camera;
    dispose(): void;
  }
}
