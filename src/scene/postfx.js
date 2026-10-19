import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'three/addons/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/**
 * Bloom + SSAO. ?fx=0 desactiva. ?fx=bloom deja solo bloom (más liviano).
 */
export function createPostFx(renderer, scene, camera) {
  const params = new URLSearchParams(location.search);
  const mode = params.get('fx') ?? 'full';
  if (mode === '0' || mode === 'off') {
    return {
      enabled: false,
      composer: null,
      render() {
        renderer.render(scene, camera);
      },
      setSize(w, h) {
        renderer.setSize(w, h);
      },
    };
  }

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  if (mode !== 'bloom') {
    const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
    ssao.kernelRadius = 8;
    ssao.minDistance = 0.005;
    ssao.maxDistance = 0.12;
    ssao.output = SSAOPass.OUTPUT.Default;
    composer.addPass(ssao);
  }

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.38,
    0.55,
    0.82,
  );
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  return {
    enabled: true,
    composer,
    render() {
      composer.render();
    },
    setSize(w, h) {
      composer.setSize(w, h);
    },
  };
}
