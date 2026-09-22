export type TopDockOptions = {
  proximity?: number;
  spring?: number;
  damping?: number;
  widthGrowth?: number;
  heightGrowth?: number;
  drop?: number;
  axis?: "x" | "y";
  distribute?: boolean;
  lockTrack?: boolean;
};

type ItemState = {
  element: HTMLElement;
  value: number;
  velocity: number;
  target: number;
  baseWidth: number;
  baseHeight: number;
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function smoothstep(t: number): number {
  const clamped = clamp(t, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function createTopDockController(
  root: HTMLElement,
  getOptions: () => TopDockOptions
): () => void {
  let animationFrameId: number = 0;
  let isPointerInside = false;
  let pointerX = -9999;
  let pointerY = -9999;
  let focusedElement: HTMLElement | null = null;

  const items: ItemState[] = [];

  const updateItemsCache = () => {
    const elements = Array.from(root.querySelectorAll<HTMLElement>("[data-dock-item]"));
    items.length = 0;
    elements.forEach((el) => {
      items.push({
        element: el,
        value: 0,
        velocity: 0,
        target: 0,
        baseWidth: el.offsetWidth,
        baseHeight: el.offsetHeight,
      });
    });
  };

  updateItemsCache();

  const resizeObserver = new ResizeObserver(() => {
    updateItemsCache();
  });
  resizeObserver.observe(root);

  const onPointerMove = (e: PointerEvent) => {
    isPointerInside = true;
    pointerX = e.clientX;
    pointerY = e.clientY;
  };

  const onPointerLeave = () => {
    isPointerInside = false;
    pointerX = -9999;
    pointerY = -9999;
  };

  const onFocusIn = (e: FocusEvent) => {
    if (e.target instanceof HTMLElement && root.contains(e.target)) {
      focusedElement = e.target;
    }
  };

  const onFocusOut = () => {
    focusedElement = null;
  };

  root.addEventListener("pointermove", onPointerMove, { passive: true });
  root.addEventListener("pointerleave", onPointerLeave, { passive: true });
  root.addEventListener("focusin", onFocusIn, { passive: true });
  root.addEventListener("focusout", onFocusOut, { passive: true });

  const tick = () => {
    const opts = getOptions();
    const proximity = opts.proximity ?? 122;
    const spring = opts.spring ?? 0.19;
    const damping = opts.damping ?? 0.70;
    const widthGrowth = opts.widthGrowth ?? 17;
    const heightGrowth = opts.heightGrowth ?? 16;
    const drop = opts.drop ?? 3.5;
    const axis = opts.axis ?? "x";

    let maxInfluence = 0;

    items.forEach((item) => {
      const rect = item.element.getBoundingClientRect();
      const center = axis === "y" ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
      const pointerPos = axis === "y" ? pointerY : pointerX;

      let influence = 0;

      if (isPointerInside) {
        const dist = Math.abs(pointerPos - center);
        const raw = clamp(1 - dist / proximity, 0, 1);
        influence = smoothstep(raw);
      } else if (focusedElement && item.element.contains(focusedElement)) {
        influence = 1;
      }

      item.target = influence;

      // Integrate spring physics
      const force = (item.target - item.value) * spring;
      item.velocity = (item.velocity + force) * damping;
      item.value += item.velocity;

      if (item.value > maxInfluence) {
        maxInfluence = item.value;
      }

      // Apply dynamic transforms
      const translateY = item.value * drop;
      const extraWidth = item.value * widthGrowth;
      const extraHeight = item.value * heightGrowth;

      item.element.style.transform = `translateY(${translateY.toFixed(2)}px)`;

      // Dynamic padding/growth for smooth spacing
      const padX = Math.max(0, extraWidth / 2);
      const padY = Math.max(0, extraHeight / 2);

      item.element.style.paddingLeft = `${(14 + padX).toFixed(1)}px`;
      item.element.style.paddingRight = `${(14 + padX).toFixed(1)}px`;
      item.element.style.paddingTop = `${(6 + padY).toFixed(1)}px`;
      item.element.style.paddingBottom = `${(6 + padY).toFixed(1)}px`;
    });

    root.setAttribute("data-dock-state", isPointerInside ? "active" : "idle");
    root.setAttribute("data-dock-max", maxInfluence.toFixed(2));

    animationFrameId = requestAnimationFrame(tick);
  };

  animationFrameId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(animationFrameId);
    resizeObserver.disconnect();
    root.removeEventListener("pointermove", onPointerMove);
    root.removeEventListener("pointerleave", onPointerLeave);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("focusout", onFocusOut);

    items.forEach((item) => {
      item.element.style.transform = "";
      item.element.style.paddingLeft = "";
      item.element.style.paddingRight = "";
      item.element.style.paddingTop = "";
      item.element.style.paddingBottom = "";
    });
  };
}
