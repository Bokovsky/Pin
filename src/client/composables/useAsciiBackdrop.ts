import { onMounted, onUnmounted, ref, type Ref } from "vue";
import { mount } from "../ascii/mount";
import { pickRandomScene } from "../asciiScenes";
import {
  readViewportSize,
  shouldRefitBackdrop,
  type ViewportSize,
} from "../asciiViewport";

/**
 * Mounts a random ascii.rest backdrop scene into a fullscreen canvas.
 * Returns a stop function handle via unmount; the player itself pauses
 * offscreen, on hidden tabs, and under prefers-reduced-motion.
 *
 * The canvas uses object-cover so the scene always fills the viewport
 * (cropping the overflow). mount() refits its backing store on its own
 * when the canvas width changes; height-only or DPR-only viewport changes
 * get a debounced width nudge so the backing store follows too.
 */
export function useAsciiBackdrop(canvasRef: Ref<HTMLCanvasElement | null>) {
  const sceneId = ref("");

  let stop: (() => void) | null = null;
  let lastSize: ViewportSize | null = null;
  let resizeTimer: number | undefined;

  function nudgeRefit(el: HTMLCanvasElement) {
    el.style.width = "99.9%";
    requestAnimationFrame(() => {
      el.style.width = "100%";
    });
  }

  function handleViewportChange() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const el = canvasRef.value;
      if (!el) return;
      const next = readViewportSize();
      const widthChanged = !lastSize || lastSize.width !== next.width;
      const changed = shouldRefitBackdrop(lastSize, next);
      lastSize = next;
      if (changed && !widthChanged) {
        nudgeRefit(el);
      }
    }, 200);
  }

  onMounted(() => {
    const el = canvasRef.value;
    if (!el) return;
    const scene = pickRandomScene();
    sceneId.value = scene.id;
    el.dataset.scene = scene.id;
    lastSize = readViewportSize();
    stop = mount(el, scene.piece);
    window.addEventListener("resize", handleViewportChange);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleViewportChange);
    window.clearTimeout(resizeTimer);
    stop?.();
    stop = null;
  });

  return { sceneId };
}
