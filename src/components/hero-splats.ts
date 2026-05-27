import * as SPLAT from "gsplat";

type VectorInput = readonly [number, number, number] | readonly number[];

type SplatManifestEntry =
  | string
  | {
      src?: string;
      label?: string;
      title?: string;
      positionOffset?: VectorInput;
      rotation?: VectorInput;
      backgroundColor?: string;
      orbitSpeed?: number;
      renderFps?: number;
      mousePositionAmplitude?: number;
      near?: number;
      far?: number;
    };

type SplatManifest = {
  baseUrl?: string;
  r2BaseUrl?: string;
  rotationMs?: number;
  fallbackSrc?: string;
  backgroundColor?: string;
  orbitSpeed?: number;
  renderFps?: number;
  mousePositionAmplitude?: number;
  items?: SplatManifestEntry[];
  splats?: SplatManifestEntry[];
};

type StageRuntimeConfig = {
  manifestUrl?: string;
  r2BaseUrl?: string;
  baseUrl?: string;
  fallbackSrc?: string;
  backgroundColor?: string;
  orbitSpeed?: number | string;
  renderFps?: number | string;
  rotationMs?: number | string;
  mousePositionAmplitude?: number | string;
};

type StageConfig = {
  manifestUrl: string;
  r2BaseUrl: string;
  baseUrl: string;
  fallbackSrc: string;
  backgroundColor: string;
  orbitSpeed: number;
  renderFps: number;
  rotationMs: number;
  mousePositionAmplitude: number;
};

type NormalizedCapture = {
  label: string;
  url: string;
  positionOffset?: VectorInput;
  rotation?: VectorInput;
  backgroundColor?: string;
  orbitSpeed: number;
  renderFps: number;
  mousePositionAmplitude: number;
  near?: number;
  far?: number;
};

type LoadedCapture = {
  scene: SPLAT.Scene;
  splat: SPLAT.Splat;
};

declare global {
  interface Window {
    ScanAirSplatShowcase?: StageRuntimeConfig;
    __scanAirHeroSplatDispose?: () => void;
  }
}

const DEFAULT_MANIFEST_URL = "/splats/splats.json";
const DEFAULT_ROTATION_MS = 14000;
const DEFAULT_FALLBACK_SRC = "/assets/samples/chief-image.png";
const DEFAULT_BACKGROUND_COLOR = "#090d11";
const DEFAULT_ORBIT_SPEED = 0.06;
const DEFAULT_RENDER_FPS = 60;
const DEFAULT_MOUSE_POSITION_AMPLITUDE = 1;
const SCENE_FADE_OUT_MS = 1000;
const SCENE_PREWARM_MS = 500;
const BASE_ZOOM_OFFSET = new SPLAT.Vector3(0, 0, 1.3);
const BASE_ROTATION_OFFSET = new SPLAT.Vector3(-0.05, -0.05, 0);

const stage = document.querySelector<HTMLElement>("[data-splat-showcase]");

if (stage) {
  window.__scanAirHeroSplatDispose?.();
  let cleanupActiveHeroSplat: (() => void) | undefined;
  let activeHeroSplatAbort: AbortController | undefined;
  let heroSplatObserver: IntersectionObserver | undefined;
  let mountRequestId = 0;

  const unmountHeroSplat = () => {
    mountRequestId += 1;
    activeHeroSplatAbort?.abort();
    activeHeroSplatAbort = undefined;
    cleanupActiveHeroSplat?.();
    cleanupActiveHeroSplat = undefined;
    stage.classList.remove(
      "is-loaded",
      "is-loading",
      "is-transitioning",
      "is-loaded-instant",
      "is-error",
    );
  };

  const mountHeroSplat = () => {
    if (cleanupActiveHeroSplat) {
      return;
    }

    const requestId = mountRequestId + 1;
    mountRequestId = requestId;
    const abortController = new AbortController();
    activeHeroSplatAbort = abortController;
    stage.classList.add("is-loading");
    void initHeroSplatShowcase(stage, abortController.signal).then((cleanup) => {
      if (requestId !== mountRequestId) {
        cleanup();
        return;
      }

      cleanupActiveHeroSplat = cleanup;
      if (activeHeroSplatAbort === abortController) {
        activeHeroSplatAbort = undefined;
      }
    });
  };

  const disposeHeroSplat = () => {
    heroSplatObserver?.disconnect();
    unmountHeroSplat();
  };

  window.__scanAirHeroSplatDispose = disposeHeroSplat;

  if ("IntersectionObserver" in window) {
    heroSplatObserver = new IntersectionObserver((entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);

      if (isVisible) {
        mountHeroSplat();
        return;
      }

      unmountHeroSplat();
    });
    heroSplatObserver.observe(stage);
  } else {
    mountHeroSplat();
  }
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.__scanAirHeroSplatDispose?.();
    window.__scanAirHeroSplatDispose = undefined;
  });
}

async function initHeroSplatShowcase(
  stageElement: HTMLElement,
  abortSignal?: AbortSignal,
): Promise<() => void> {
  const canvas = stageElement.querySelector<HTMLCanvasElement>("[data-splat-canvas]");
  const fallback = stageElement.querySelector<HTMLImageElement>(".hero-splat-fallback");
  const statusLabel = stageElement.querySelector<HTMLElement>("[data-splat-status-label]");
  const progressLabel = stageElement.querySelector<HTMLElement>("[data-splat-progress]");

  if (!canvas) {
    return () => {};
  }

  const config = getStageConfig(stageElement);
  let scene: SPLAT.Scene | undefined;
  let camera: SPLAT.Camera | undefined;
  let renderer: SPLAT.WebGLRenderer | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let frameRequest = 0;
  let cycleTimer = 0;
  let activeLoadId = 0;
  let lastFrameTime = -1;
  let hasRenderableSplat = false;
  let activeIndex = 0;
  let orbitCenter = new SPLAT.Vector3(0, 0, 0);
  let basePositionOffset = BASE_ZOOM_OFFSET;
  let baseRotation = BASE_ROTATION_OFFSET;
  let activeOrbitSpeed = config.orbitSpeed;
  let activeFrameInterval = 1000 / config.renderFps;
  let activeMousePositionAmplitude = config.mousePositionAmplitude;
  let orbitStartTime = 0;
  let activeCaptureUrl = "";
  let isDisposed = false;
  const loadedCaptureCache = new Map<string, Promise<LoadedCapture>>();
  const captureOrbitElapsedCache = new Map<string, number>();

  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };

  const cleanup = () => {
    if (isDisposed) {
      return;
    }

    isDisposed = true;
    window.cancelAnimationFrame(frameRequest);
    window.clearTimeout(cycleTimer);
    resizeObserver?.disconnect();
    stageElement.classList.remove("is-loading", "is-transitioning", "is-loaded-instant");
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerleave", handlePointerLeave);
    window.removeEventListener("pagehide", cleanup);
    abortSignal?.removeEventListener("abort", cleanup);
    loadedCaptureCache.clear();
    captureOrbitElapsedCache.clear();
    renderer?.dispose();
  };

  abortSignal?.addEventListener("abort", cleanup, { once: true });
  const setStatus = (message: string, progress = "") => {
    if (statusLabel) {
      statusLabel.textContent = message;
    }

    if (progressLabel) {
      progressLabel.textContent = progress;
    }
  };

  const setFallback = (src: string | undefined) => {
    if (fallback && src) {
      fallback.src = src;
    }
  };

  const resize = () => {
    if (!renderer || !camera) {
      return;
    }

    const width = stageElement.clientWidth;
    const height = stageElement.clientHeight;

    if (!width || !height) {
      return;
    }

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    const renderWidth = Math.floor(width * pixelRatio);
    const renderHeight = Math.floor(height * pixelRatio);
    const focalLength = renderHeight * 0.96;

    renderer.setSize(renderWidth, renderHeight);
    camera.data.setSize(renderWidth, renderHeight);
    camera.data.fx = focalLength;
    camera.data.fy = focalLength;
    camera.update();
  };

  const handlePointerMove = (event: PointerEvent) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (!viewportWidth || !viewportHeight) {
      return;
    }

    pointerTarget.x = (event.clientX / viewportWidth) * 2 - 1;
    pointerTarget.y = (event.clientY / viewportHeight) * 2 - 1;
  };

  const handlePointerLeave = () => {
    pointerTarget.x = 0;
    pointerTarget.y = 0;
  };

  const getActiveOrbitElapsedSeconds = () => {
    if (!activeOrbitSpeed) {
      return 0;
    }

    const fullOrbitSeconds = (Math.PI * 2) / Math.abs(activeOrbitSpeed);
    const elapsedSeconds = performance.now() * 0.001 - orbitStartTime;
    return normalizePositiveModulo(elapsedSeconds, fullOrbitSeconds);
  };

  const recordActiveCaptureOrbit = () => {
    if (!activeCaptureUrl || !hasRenderableSplat || !activeOrbitSpeed) {
      return;
    }

    captureOrbitElapsedCache.set(activeCaptureUrl, getActiveOrbitElapsedSeconds());
  };

  const getCachedOrbitElapsedSeconds = (capture: NormalizedCapture) => {
    if (!capture.orbitSpeed) {
      return 0;
    }

    const fullOrbitSeconds = (Math.PI * 2) / Math.abs(capture.orbitSpeed);
    return normalizePositiveModulo(captureOrbitElapsedCache.get(capture.url) || 0, fullOrbitSeconds);
  };

  const updateCameraForTime = (time: number) => {
    if (!camera) {
      return;
    }

    const orbitAngle = (time - orbitStartTime) * activeOrbitSpeed;
    const orbitOffset = rotateOffsetAroundYAxis(basePositionOffset, orbitAngle);

    const dynamicRotation = new SPLAT.Vector3(
      baseRotation.x - pointer.y * 0.117 + Math.cos(time * 0.5) * 0.01,
      baseRotation.y - orbitAngle + pointer.x * 0.11 + Math.sin(time * 0.5) * 0.01,
      baseRotation.z + pointer.x * 0.039,
    );

    camera.position = orbitCenter.add(orbitOffset).add(
      new SPLAT.Vector3(
        -pointer.x * 0.56 * activeMousePositionAmplitude,
        -pointer.y * 0.16 * activeMousePositionAmplitude,
        pointer.x * 0.1 * activeMousePositionAmplitude,
      ),
    );
    camera.rotation = SPLAT.Quaternion.FromEuler(dynamicRotation);
  };

  const animate = (timestamp: number) => {
    if (isDisposed) {
      return;
    }

    frameRequest = window.requestAnimationFrame(animate);

    if (
      !hasRenderableSplat ||
      !camera ||
      !renderer ||
      !scene ||
      timestamp - lastFrameTime < activeFrameInterval
    ) {
      return;
    }

    lastFrameTime = timestamp;
    const time = timestamp * 0.001;

    pointer.x += (pointerTarget.x - pointer.x) * 0.045;
    pointer.y += (pointerTarget.y - pointer.y) * 0.045;

    updateCameraForTime(time);
    camera.update();
    renderer.render(scene, camera);
  };

  const scheduleNextCapture = (captures: NormalizedCapture[], rotationMs: number) => {
    window.clearTimeout(cycleTimer);

    if (isDisposed || captures.length <= 1) {
      return;
    }

    cycleTimer = window.setTimeout(() => {
      activeIndex = (activeIndex + 1) % captures.length;
      void loadCapture(captures, activeIndex, rotationMs);
    }, rotationMs);
  };

  const getLoadedCapture = (
    capture: NormalizedCapture,
    onProgress: (progress: number) => void,
  ) => {
    const cachedLoad = loadedCaptureCache.get(capture.url);

    if (cachedLoad) {
      return {
        isCached: true,
        load: cachedLoad,
      };
    }

    const load = (async () => {
      const cachedScene = new SPLAT.Scene();
      const cachedSplat = await SPLAT.Loader.LoadAsync(capture.url, cachedScene, onProgress);
      return {
        scene: cachedScene,
        splat: cachedSplat,
      };
    })();

    loadedCaptureCache.set(capture.url, load);
    void load.catch(() => {
      loadedCaptureCache.delete(capture.url);
    });

    return {
      isCached: false,
      load,
    };
  };

  const loadCapture = async (
    captures: NormalizedCapture[],
    index: number,
    rotationMs: number,
  ) => {
    if (isDisposed || !scene || !camera || !renderer) {
      return;
    }

    const capture = captures[index];
    const loadId = activeLoadId + 1;
    const hasCurrentCapture = hasRenderableSplat;
    activeLoadId = loadId;

    if (!hasCurrentCapture) {
      hasRenderableSplat = false;
      renderer.backgroundColor = colorFromHex(capture.backgroundColor);
      stageElement.classList.remove("is-loaded");
    }

    stageElement.classList.add("is-loading");
    stageElement.classList.remove("is-error");

    try {
      const cachedCapture = getLoadedCapture(capture, (value) => {
        if (!isDisposed && loadId === activeLoadId) {
          setStatus(`Loading ${capture.label}`, `${Math.round(value * 100)}%`);
        }
      });
      setStatus(
        cachedCapture.isCached ? `Restoring ${capture.label}` : `Loading ${capture.label}`,
        cachedCapture.isCached ? "" : "0%",
      );

      const loadedCapture = await cachedCapture.load;

      if (isDisposed || loadId !== activeLoadId || !camera || !renderer || !scene) {
        return;
      }

      if (hasCurrentCapture) {
        stageElement.classList.add("is-transitioning");
        await waitForSceneFade();

        if (isDisposed || loadId !== activeLoadId || !camera || !renderer || !scene) {
          return;
        }

        recordActiveCaptureOrbit();
      }

      scene = loadedCapture.scene;
      orbitCenter = loadedCapture.splat.position;
      basePositionOffset = vectorFromArray(capture.positionOffset) || BASE_ZOOM_OFFSET;
      baseRotation = vectorFromArray(capture.rotation) || BASE_ROTATION_OFFSET;
      activeOrbitSpeed = capture.orbitSpeed;
      activeFrameInterval = 1000 / capture.renderFps;
      activeMousePositionAmplitude = capture.mousePositionAmplitude;
      orbitStartTime =
        performance.now() * 0.001 -
        (cachedCapture.isCached ? getCachedOrbitElapsedSeconds(capture) : 0);
      activeCaptureUrl = capture.url;
      renderer.backgroundColor = colorFromHex(capture.backgroundColor);
      updateCameraForTime(performance.now() * 0.001);
      camera.data.near = capture.near || 0.01;
      camera.data.far = capture.far || 6000;
      resize();
      camera.update();
      renderer.render(scene, camera);

      if (hasCurrentCapture) {
        await waitForScenePrewarm();

        if (isDisposed || loadId !== activeLoadId || !camera || !renderer || !scene) {
          return;
        }
      }

      hasRenderableSplat = true;
      if (!hasCurrentCapture) {
        stageElement.classList.add("is-loaded-instant");
        window.requestAnimationFrame(() => {
          stageElement.classList.remove("is-loaded-instant");
        });
      }
      stageElement.classList.add("is-loaded");
      stageElement.classList.remove("is-loading", "is-transitioning");
      setStatus(capture.label, "");
      scheduleNextCapture(captures, rotationMs);
    } catch (error) {
      console.error("Failed to load hero 3DGS capture", error);

      if (isDisposed || loadId !== activeLoadId) {
        return;
      }

      stageElement.classList.add("is-error");
      stageElement.classList.toggle("is-loaded", hasCurrentCapture);
      stageElement.classList.remove("is-loading", "is-transitioning");
      setStatus("Unable to load 3DGS capture", "");
      scheduleNextCapture(captures, Math.min(rotationMs, 5000));
    }
  };

  try {
    const manifest = await fetchSplatManifest(config.manifestUrl, abortSignal);

    if (isDisposed) {
      return cleanup;
    }

    const captures = normalizeCaptures(manifest, config);

    setFallback(manifest.fallbackSrc || config.fallbackSrc);

    if (!captures.length) {
      stageElement.classList.add("is-fallback");
      setStatus("3DGS captures pending", "");
      return cleanup;
    }

    scene = new SPLAT.Scene();
    camera = new SPLAT.Camera();
    renderer = new SPLAT.WebGLRenderer(canvas);
    renderer.backgroundColor = colorFromHex(config.backgroundColor);

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stageElement);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);

    resize();
    frameRequest = window.requestAnimationFrame(animate);
    await loadCapture(captures, activeIndex, manifest.rotationMs || config.rotationMs);
  } catch (error) {
    if (isDisposed || (error instanceof DOMException && error.name === "AbortError")) {
      return cleanup;
    }

    console.error("Failed to initialize hero 3DGS showcase", error);
    stageElement.classList.add("is-error");
    setFallback(config.fallbackSrc);
    setStatus("3DGS showcase unavailable", "");
  }

  window.addEventListener("pagehide", cleanup, { once: true });
  return cleanup;
}

function getStageConfig(stageElement: HTMLElement): StageConfig {
  const dataset = stageElement.dataset;
  const runtimeConfig = window.ScanAirSplatShowcase || {};
  const rotationMs = Number(runtimeConfig.rotationMs ?? dataset.rotationMs ?? DEFAULT_ROTATION_MS);
  const orbitSpeed = Number(runtimeConfig.orbitSpeed ?? dataset.orbitSpeed ?? DEFAULT_ORBIT_SPEED);
  const renderFps = Number(runtimeConfig.renderFps ?? dataset.renderFps ?? DEFAULT_RENDER_FPS);
  const mousePositionAmplitude = normalizeMousePositionAmplitude(
    runtimeConfig.mousePositionAmplitude ?? dataset.mousePositionAmplitude,
    DEFAULT_MOUSE_POSITION_AMPLITUDE,
  );

  return {
    manifestUrl: runtimeConfig.manifestUrl || dataset.manifestUrl || DEFAULT_MANIFEST_URL,
    r2BaseUrl: runtimeConfig.r2BaseUrl || dataset.r2BaseUrl || "",
    baseUrl: runtimeConfig.baseUrl || dataset.baseUrl || "",
    fallbackSrc: runtimeConfig.fallbackSrc || dataset.fallbackSrc || DEFAULT_FALLBACK_SRC,
    backgroundColor:
      runtimeConfig.backgroundColor || dataset.backgroundColor || DEFAULT_BACKGROUND_COLOR,
    orbitSpeed: Number.isFinite(orbitSpeed) ? orbitSpeed : DEFAULT_ORBIT_SPEED,
    renderFps: normalizeRenderFps(renderFps),
    rotationMs: Number.isFinite(rotationMs) ? rotationMs : DEFAULT_ROTATION_MS,
    mousePositionAmplitude,
  };
}

async function fetchSplatManifest(
  manifestUrl: string,
  abortSignal?: AbortSignal,
): Promise<SplatManifest> {
  const response = await fetch(manifestUrl, { cache: "no-store", signal: abortSignal });

  if (!response.ok) {
    throw new Error(`Unable to load splat manifest: ${response.status}`);
  }

  return (await response.json()) as SplatManifest;
}

function normalizeCaptures(manifest: SplatManifest, config: StageConfig): NormalizedCapture[] {
  const entries = Array.isArray(manifest.items)
    ? manifest.items
    : Array.isArray(manifest.splats)
      ? manifest.splats
      : [];

  const baseUrl =
    config.r2BaseUrl ||
    manifest.r2BaseUrl ||
    config.baseUrl ||
    manifest.baseUrl ||
    new URL(".", new URL(config.manifestUrl, window.location.href)).href;

  return entries.reduce<NormalizedCapture[]>((captures, entry, index) => {
    const src = typeof entry === "string" ? entry : entry.src;

    if (!src) {
      return captures;
    }

    captures.push({
      label:
        typeof entry === "string"
          ? `3DGS capture ${index + 1}`
          : entry.label || entry.title || `3DGS capture ${index + 1}`,
      url: resolveAssetUrl(src, baseUrl),
      positionOffset: typeof entry === "string" ? undefined : entry.positionOffset,
      rotation: typeof entry === "string" ? undefined : entry.rotation,
      backgroundColor:
        typeof entry === "string"
          ? manifest.backgroundColor || config.backgroundColor
          : entry.backgroundColor || manifest.backgroundColor || config.backgroundColor,
      orbitSpeed:
        typeof entry === "string"
          ? manifest.orbitSpeed ?? config.orbitSpeed
          : entry.orbitSpeed ?? manifest.orbitSpeed ?? config.orbitSpeed,
      renderFps:
        typeof entry === "string"
          ? normalizeRenderFps(manifest.renderFps ?? config.renderFps)
          : normalizeRenderFps(entry.renderFps ?? manifest.renderFps ?? config.renderFps),
      mousePositionAmplitude:
        typeof entry === "string"
          ? normalizeMousePositionAmplitude(
              manifest.mousePositionAmplitude,
              config.mousePositionAmplitude,
            )
          : normalizeMousePositionAmplitude(
              entry.mousePositionAmplitude ?? manifest.mousePositionAmplitude,
              config.mousePositionAmplitude,
            ),
      near: typeof entry === "string" ? undefined : entry.near,
      far: typeof entry === "string" ? undefined : entry.far,
    });

    return captures;
  }, []);
}

function resolveAssetUrl(src: string, baseUrl: string): string {
  return new URL(src, new URL(baseUrl || ".", window.location.href)).href;
}

function vectorFromArray(value: VectorInput | undefined): SPLAT.Vector3 | null {
  if (!Array.isArray(value) || value.length !== 3) {
    return null;
  }

  return new SPLAT.Vector3(Number(value[0]), Number(value[1]), Number(value[2]));
}

function rotateOffsetAroundYAxis(offset: SPLAT.Vector3, radians: number): SPLAT.Vector3 {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);

  return new SPLAT.Vector3(
    offset.x * cosine - offset.z * sine,
    offset.y,
    offset.x * sine + offset.z * cosine,
  );
}

function normalizePositiveModulo(value: number, divisor: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(divisor) || divisor <= 0) {
    return 0;
  }

  return ((value % divisor) + divisor) % divisor;
}

function waitForSceneFade(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, SCENE_FADE_OUT_MS));
}

function waitForScenePrewarm(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, SCENE_PREWARM_MS));
}

function colorFromHex(hexColor: string | undefined): SPLAT.Color32 {
  const fallback = new SPLAT.Color32(9, 13, 17, 255);

  if (!hexColor) {
    return fallback;
  }

  const hex = hexColor.trim().replace(/^#/, "");
  const normalized =
    hex.length === 3 || hex.length === 4
      ? [...hex].map((character) => character + character).join("")
      : hex;

  if (!/^[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(normalized)) {
    console.warn(`Invalid splat background color "${hexColor}". Expected #RGB, #RRGGBB, or #RRGGBBAA.`);
    return fallback;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const alpha = normalized.length === 8 ? Number.parseInt(normalized.slice(6, 8), 16) : 255;

  return new SPLAT.Color32(red, green, blue, alpha);
}

function normalizeRenderFps(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_RENDER_FPS;
  }

  return Math.min(60, Math.max(12, value));
}

function normalizeMousePositionAmplitude(
  value: number | string | undefined,
  fallback: number,
): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, parsed);
}

export {};
