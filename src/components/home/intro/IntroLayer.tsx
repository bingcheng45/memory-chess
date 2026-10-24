"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { INTRO_MARK } from "@/lib/home/intro/introGate";
import { captionAt, counterAt, INTRO_SECONDS, nextBeatTime, type CaptionId } from "@/lib/home/intro/introBeats";
import { INTRO_SEEN_KEY } from "@/lib/lab/storage";
import type { SimulScene } from "./simulScene";

const CAPTIONS: readonly CaptionId[] = ["one", "many", "dark", "you"];
/** As long as the fade in intro.css. */
const FADE_MS = 400;
/** The longest one frame may move the clock, so a stalled tab does not skip a beat. */
const MAX_FRAME_MS = 64;
/** One scroll gesture fires many wheel events; this long after a jump, they are the same gesture. */
const WHEEL_GAP_MS = 600;
const WHEEL_MIN_DELTA = 20;
/** A touch that travels this far is a swipe, the phone's scroll gesture; a shorter one is a tap, which the click handles. */
const SWIPE_MIN_PX = 40;
const JUMP_KEYS = new Set([" ", "Enter", "ArrowRight", "ArrowDown"]);

type Phase = "idle" | "playing" | "ending";

/** Everything beside the layer or beside one of its ancestors: the page the layer covers. */
function coveredBy(layer: Element): Element[] {
  const covered: Element[] = [];
  for (let node = layer; node !== document.body && node.parentElement; node = node.parentElement) {
    for (const sibling of node.parentElement.children) {
      if (sibling !== node && !sibling.hasAttribute("inert")) covered.push(sibling);
    }
  }
  return covered;
}

const hasSeen = () => {
  try {
    return window.localStorage.getItem(INTRO_SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

interface Playback {
  readonly jump: () => void;
  readonly stop: () => void;
}

/**
 * Runs the clock from 0 to INTRO_SECONDS, drawing each frame once the scene has loaded. The clock does not wait for
 * the scene, so a scene that never loads still leaves the captions and the end on time. Pauses while the tab is hidden.
 */
function play(canvas: HTMLCanvasElement, onTime: (t: number) => void, onDone: () => void): Playback {
  let t = 0;
  let last = performance.now();
  let frame = 0;
  let stopped = false;
  let scene: SimulScene | null = null;

  const draw = () => {
    try {
      scene?.draw(t);
    } catch {
      scene = null;
    }
  };
  import("./simulScene")
    .then(({ createScene }) => {
      if (stopped) return;
      scene = createScene(canvas);
      draw();
    })
    .catch(() => {});

  const tick = (now: number) => {
    t = Math.min(INTRO_SECONDS, t + Math.min(MAX_FRAME_MS, now - last) / 1000);
    last = now;
    draw();
    onTime(t);
    if (t >= INTRO_SECONDS) {
      stop();
      onDone();
      return;
    }
    frame = requestAnimationFrame(tick);
  };
  const onVisibility = () => {
    cancelAnimationFrame(frame);
    if (document.hidden || stopped) return;
    last = performance.now();
    frame = requestAnimationFrame(tick);
  };
  const onResize = () => {
    scene?.resize();
    draw();
  };
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(frame);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", onResize);
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize);
  frame = requestAnimationFrame(tick);
  return {
    jump: () => {
      t = nextBeatTime(t);
    },
    stop,
  };
}

/**
 * The 45-board intro: plays on its own when the gate marked its script, and again from the replay chip. While it plays,
 * Skip holds focus and the page under the layer is inert. A tap, a jump key, a scroll or a swipe moves to the next beat.
 */
export function IntroLayer() {
  const t = useTranslations("home.lab.intro");
  const layer = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const jump = useRef(() => {});
  const replayed = useRef(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [caption, setCaption] = useState<CaptionId>("one");
  const [boards, setBoards] = useState(1);
  const [dark, setDark] = useState(false);
  const [canReplay, setCanReplay] = useState(false);
  const [nearTop, setNearTop] = useState(true);

  useEffect(() => {
    if (document.querySelector(`script[${INTRO_MARK}]`)) setPhase("playing");
    else setCanReplay(hasSeen());
  }, []);

  useEffect(() => {
    const onScroll = () => setNearTop(window.scrollY < window.innerHeight / 2);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (phase !== "playing" || !layer.current || !canvas.current) return;
    const covered = coveredBy(layer.current);
    covered.forEach((element) => element.setAttribute("inert", ""));
    skip.current?.focus({ preventScroll: true });
    setCaption("one");
    setBoards(1);
    setDark(false);

    const end = () => setPhase("ending");
    const playback = play(
      canvas.current,
      (now) => {
        const counter = counterAt(now);
        setCaption(captionAt(now));
        setBoards(counter.boards);
        setDark(counter.dark);
        bar.current?.style.setProperty("transform", `scaleX(${now / INTRO_SECONDS})`);
      },
      end,
    );
    jump.current = playback.jump;

    let wheelAt = -Infinity;
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < WHEEL_MIN_DELTA || event.timeStamp - wheelAt < WHEEL_GAP_MS) return;
      wheelAt = event.timeStamp;
      playback.jump();
    };
    let touchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
    };
    const onTouchEnd = (event: TouchEvent) => {
      const endY = event.changedTouches[0]?.clientY;
      if (touchY !== null && endY !== undefined && Math.abs(endY - touchY) >= SWIPE_MIN_PX) playback.jump();
      touchY = null;
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") end();
      else if (JUMP_KEYS.has(event.key) && event.target !== skip.current) {
        event.preventDefault();
        playback.jump();
      }
    };
    const section = layer.current;
    section.addEventListener("wheel", onWheel, { passive: true });
    section.addEventListener("touchstart", onTouchStart, { passive: true });
    section.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      playback.stop();
      jump.current = () => {};
      covered.forEach((element) => element.removeAttribute("inert"));
      section.removeEventListener("wheel", onWheel);
      section.removeEventListener("touchstart", onTouchStart);
      section.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "ending") return;
    const timer = window.setTimeout(() => {
      document.querySelector(`script[${INTRO_MARK}]`)?.removeAttribute(INTRO_MARK);
      setPhase("idle");
      setCanReplay(true);
    }, FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === "idle" && replayed.current) replay.current?.focus({ preventScroll: true });
  }, [phase]);

  const onLayerClick = (event: MouseEvent) => {
    if (event.target !== skip.current) jump.current();
  };

  return (
    <>
      <section ref={layer} className="home-intro" aria-label={t("label")} data-phase={phase === "idle" ? undefined : phase} onClick={onLayerClick}>
        <canvas ref={canvas} className="home-intro-stage" aria-hidden="true" />
        <div className="home-intro-scrim" />
        <div className="home-intro-hud">
          <div className="home-intro-top">
            <p className="home-intro-counter">{dark ? t("counterDark", { count: boards }) : t("counter", { count: boards })}</p>
            <button ref={skip} type="button" className="home-intro-skip" onClick={() => setPhase("ending")}>
              {t("skip")}
            </button>
          </div>
          <div className="home-intro-captions" aria-live="polite">
            {CAPTIONS.map((id) => (
              <p key={id} className="home-intro-caption" data-on={id === caption || undefined} aria-hidden={id !== caption}>
                {t.rich(id, { em: (chunks) => <em>{chunks}</em> })}
                <small>{t(`${id}Note`)}</small>
              </p>
            ))}
          </div>
        </div>
        <span className="home-intro-progress" aria-hidden="true">
          <span ref={bar} />
        </span>
      </section>
      <button
        ref={replay}
        type="button"
        className="home-intro-replay"
        hidden={!canReplay || phase !== "idle" || !nearTop}
        onClick={() => {
          replayed.current = true;
          setPhase("playing");
        }}
      >
        <span aria-hidden="true">▶</span> {t("replay")}
      </button>
    </>
  );
}
