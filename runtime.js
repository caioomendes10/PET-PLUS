/* Motor de interface em JavaScript puro: DOM, eventos, estado local e navegação. */
const PET = {
  instances: new Map(),
  current: null,
  index: 0,
  effects: [],
  tree: null,
  queued: false,
  route: "/",
  static: false,
};
const P = {
  jsx: (type, props = {}, key) => ({ type, props, key }),
  jsxs: (type, props = {}, key) => ({ type, props, key }),
  Fragment: Symbol("fragment"),
};
const EE = new Proxy({}, { get: (_, name) => name });
const Gg = ({ children }) => children;
const y = {
  createContext(value) {
    const c = { value };
    c.Provider = { context: c };
    return c;
  },
  useContext(c) {
    return c.value;
  },
  useState(initial) {
    const ctx = PET.current,
      i = PET.index++;
    if (!(i in ctx.hooks)) ctx.hooks[i] = typeof initial === "function" ? initial() : initial;
    return [
      ctx.hooks[i],
      (value) => {
        const next = typeof value === "function" ? value(ctx.hooks[i]) : value;
        if (!Object.is(next, ctx.hooks[i])) {
          ctx.hooks[i] = next;
          scheduleRender();
        }
      },
    ];
  },
  useRef(value) {
    const [ref] = y.useState(() => ({ current: value }));
    return ref;
  },
  useMemo(fn, deps) {
    const ctx = PET.current,
      i = PET.index++,
      old = ctx.hooks[i];
    if (!old || !sameDeps(old.deps, deps)) ctx.hooks[i] = { value: fn(), deps };
    return ctx.hooks[i].value;
  },
  useCallback(fn, deps) {
    return y.useMemo(() => fn, deps);
  },
  useEffect(fn, deps) {
    const ctx = PET.current,
      i = PET.index++,
      old = ctx.hooks[i];
    if (!old || !sameDeps(old.deps, deps)) {
      ctx.hooks[i] = { deps, cleanup: old?.cleanup };
      if (!PET.static)
        PET.effects.push(() => {
          ctx.hooks[i].cleanup?.();
          ctx.hooks[i].cleanup = fn();
        });
    }
  },
  useLayoutEffect(fn, deps) {
    y.useEffect(fn, deps);
  },
};
function sameDeps(a, b) {
  return a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
}
function scheduleRender() {
  if (PET.static || PET.queued) return;
  PET.queued = true;
  queueMicrotask(() => {
    PET.queued = false;
    renderApp();
  });
}
function resolveView(v, path = "r", svg = false) {
  if (v === null || v === undefined || typeof v === "boolean") return null;
  if (typeof v === "number" || typeof v === "string") return { type: "#text", text: String(v) };
  if (Array.isArray(v))
    return {
      type: "#fragment",
      children: v
        .flat(Infinity)
        .map((c, i) => resolveView(c, path + "." + (c?.key ?? i), svg))
        .filter(Boolean),
    };
  if (v.type === P.Fragment) return resolveView(v.props.children || [], path, svg);
  if (v.type?.context) {
    const c = v.type.context,
      old = c.value;
    c.value = v.props.value;
    const result = resolveView(v.props.children, path + ".ctx", svg);
    c.value = old;
    return result;
  }
  if (typeof v.type === "function") {
    const id = path + ":" + v.type.name;
    let instance = PET.instances.get(id);
    if (!instance) {
      instance = { hooks: [] };
      PET.instances.set(id, instance);
    }
    instance.active = true;
    const prev = PET.current,
      index = PET.index;
    PET.current = instance;
    PET.index = 0;
    let output = v.type(v.props || {});
    PET.current = prev;
    PET.index = index;
    return resolveView(output, id, svg);
  }
  if (v.props.animate && !Array.isArray(v.props.animate)) {
    const a = v.props.animate,
      t = [];
    if (typeof a.x === "number") t.push("translateX(" + a.x + "px)");
    if (typeof a.y === "number" && a.y !== 0) t.push("translateY(" + a.y + "px)");
    if (typeof a.scale === "number" && a.scale !== 1) t.push("scale(" + a.scale + ")");
    if (t.length) v = { ...v, props: { ...v.props, style: { ...v.props.style, transform: t.join(" ") } } };
  }
  const ns = svg || v.type === "svg";
  const children = (Array.isArray(v.props.children) ? v.props.children : [v.props.children])
    .flat(Infinity)
    .map((c, i) => resolveView(c, path + "." + (c?.key ?? i), ns))
    .filter(Boolean);
  return { type: v.type, props: v.props, children, svg: ns, key: v.key };
}
function flatNodes(t) {
  return t?.type === "#fragment" ? t.children.flatMap(flatNodes) : t ? [t] : [];
}
const svgAttrs = {
  strokeWidth: "stroke-width",
  strokeLinecap: "stroke-linecap",
  strokeLinejoin: "stroke-linejoin",
  fillRule: "fill-rule",
  clipRule: "clip-rule",
  strokeDasharray: "stroke-dasharray",
  strokeDashoffset: "stroke-dashoffset",
  textAnchor: "text-anchor",
};
const ignoreProps = new Set([
  "children",
  "initial",
  "animate",
  "exit",
  "transition",
  "whileHover",
  "whileTap",
  "layout",
  "layoutId",
  "variants",
  "mode",
  "onAnimationComplete",
]);
function eventType(name, el) {
  if (name === "onChange")
    return /^(INPUT|TEXTAREA)$/.test(el.tagName)
      ? el.type === "checkbox" || el.type === "file"
        ? "change"
        : "input"
      : "change";
  return name.slice(2).toLowerCase();
}
function applyProps(el, old = {}, props = {}) {
  for (const name of new Set([...Object.keys(old), ...Object.keys(props)])) {
    if (ignoreProps.has(name)) continue;
    const value = props[name];
    if (name === "ref") {
      if (value && typeof value === "object") value.current = el;
      else if (typeof value === "function") value(el);
      continue;
    }
    if (name.startsWith("on")) {
      const type = eventType(name, el);
      if (old[name]) el.removeEventListener(type, old[name]);
      if (value) el.addEventListener(type, value);
      continue;
    }
    if (name === "style") {
      for (const k of Object.keys(old.style || {})) if (!(k in (value || {}))) el.style[k] = "";
      for (const [k, val] of Object.entries(value || {})) {
        el.style[k] =
          typeof val === "number" &&
          ![
            "opacity",
            "zIndex",
            "flex",
            "order",
            "fontWeight",
            "flexGrow",
            "flexShrink",
            "lineHeight",
          ].includes(k)
            ? val + "px"
            : val;
      }
      continue;
    }
    if (name === "dangerouslySetInnerHTML") {
      if (value) el.innerHTML = value.__html;
      continue;
    }
    if (name === "value") {
      if (el.type !== "file" && el.value !== String(value ?? "")) el.value = value ?? "";
      continue;
    }
    if (name === "checked") {
      el.checked = !!value;
      continue;
    }
    const attr = name === "className" ? "class" : name === "htmlFor" ? "for" : svgAttrs[name] || name;
    if (name.startsWith("aria-") && typeof value === "boolean") {
      el.setAttribute(attr, String(value));
      continue;
    }
    if (value === null || value === undefined || value === false) {
      el.removeAttribute(attr);
      continue;
    }
    if (typeof value === "function" || typeof value === "object") continue;
    el.setAttribute(attr, value === true ? "" : String(value));
  }
}
function patch(parent, old, v, before = null) {
  if (!v) {
    if (old?.el) parent.removeChild(old.el);
    return;
  }
  if (!old || old.type !== v.type) {
    const el =
      v.type === "#text"
        ? document.createTextNode(v.text)
        : v.svg
          ? document.createElementNS("http://www.w3.org/2000/svg", v.type)
          : document.createElement(v.type);
    v.el = el;
    if (v.type !== "#text") {
      applyProps(el, {}, v.props);
      if (v.props.autoFocus) PET.effects.push(() => el.focus());
      for (const c of v.children.flatMap(flatNodes)) patch(el, null, c);
      if (v.props.value !== undefined) el.value = v.props.value;
    }
    if (old?.el) parent.replaceChild(el, old.el);
    else parent.insertBefore(el, before);
    return;
  }
  v.el = old.el;
  if (v.type === "#text") {
    if (old.text !== v.text) v.el.nodeValue = v.text;
    return;
  }
  applyProps(v.el, old.props, v.props);
  if (!v.props["data-native-map"]) {
    const a = old.children.flatMap(flatNodes),
      b = v.children.flatMap(flatNodes);
    for (let i = 0; i < Math.max(a.length, b.length); i++) patch(v.el, a[i], b[i]);
  }
  if (v.props.value !== undefined && v.el.type !== "file") v.el.value = v.props.value;
}
function _s() {
  return navigate;
}
function ms() {
  return { pathname: PET.route, search: typeof location === "undefined" ? "" : location.search };
}
function readRoute() {
  if (typeof location === "undefined") return PET.route;
  const p = decodeURIComponent(location.pathname).replace(/\/$/, "");
  if (!p || p.endsWith("/index.html")) return "/login";
  const last = p
    .split("/")
    .pop()
    .replace(/\.html$/, "");
  return last === "inicio" ? "/" : "/" + last;
}
function routeHref(to) {
  if (typeof to !== "string") return "#";
  if (to.startsWith("http") || to.startsWith("tel:") || to.startsWith("mailto:")) return to;
  const [path, query] = to.split("?");
  return (path === "/" ? "inicio" : path.replace(/^\//, "")) + ".html" + (query ? "?" + query : "");
}
function navigate(to) {
  if (typeof location !== "undefined" && location.protocol === "file:" && typeof to === "string") {
    location.href = routeHref(to);
    return;
  }
  if (typeof to === "number") {
    history.go(to);
    return;
  }
  const [path] = to.split("?");
  PET.route = path || "/";
  history.pushState({}, "", routeHref(to));
  window.scrollTo(0, 0);
  renderApp();
}
function cc({ to, children, onClick, ...props }) {
  return P.jsx("a", {
    ...props,
    href: routeHref(to),
    onClick: (event) => {
      if (event.ctrlKey || event.metaKey) return;
      event.preventDefault();
      onClick?.(event);
      navigate(to);
    },
    children,
  });
}
function lc({ to, children, className, ...props }) {
  const isActive = to === "/" ? PET.route === "/" : PET.route === to;
  return cc({
    ...props,
    to,
    className: typeof className === "function" ? className({ isActive }) : className,
    children: typeof children === "function" ? children({ isActive }) : children,
  });
}
function V(name, nodes) {
  return function Icon({ size = 24, className = "", ...rest }) {
    return P.jsx("svg", {
      xmlns: "http://www.w3.org/2000/svg",
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className:
        "lucide lucide-" +
        name.replace(/[A-Z]/g, (s, i) => (i ? "-" : "") + s.toLowerCase()) +
        " " +
        className,
      ...rest,
      children: nodes.map(([tag, props]) => P.jsx(tag, props)),
    });
  };
}
function QE({ src, alt = "", className = "", ...props }) {
  return P.jsx("span", {
    className: "inline-block relative " + className,
    children: P.jsx("span", {
      className: "block relative w-full h-full overflow-hidden",
      children: P.jsx("img", {
        src,
        alt,
        ...props,
        className: "w-full h-full inset-0 absolute object-cover",
      }),
    }),
  });
}
const pg = () => ({ user: null, isAuthenticated: true });
/* NINA não envia dados ao Base44. Os atalhos locais continuam disponíveis. */
const ug = {
  functions: {
    invoke: async () => {
      throw Error("A NINA online necessita de backend configurado.");
    },
  },
};
function BD(props) {
  const ref = y.useRef(null),
    mapRef = y.useRef(null),
    markerRef = y.useRef(null);
  const items = (Array.isArray(props.children) ? props.children : [props.children])
    .flat(Infinity)
    .filter(Boolean);
  const target = items.find((n) => n.type === GD && n.props.pos)?.props.pos;
  y.useEffect(() => {
    if (!window.L || !ref.current) return;
    const map = L.map(ref.current, {
      center: props.center,
      zoom: props.zoom,
      scrollWheelZoom: props.scrollWheelZoom !== false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);
  y.useEffect(() => {
    const map = mapRef.current;
    if (!map || !target) return;
    if (markerRef.current) markerRef.current.remove();
    const icon = L.divIcon({
      className: "",
      iconSize: [44, 44],
      iconAnchor: [22, 44],
      html: '<div style="position:relative;width:44px;height:44px"><div style="position:absolute;inset:0;border-radius:50%;background:#0b6468;opacity:.25"></div><div style="position:absolute;left:14px;top:6px;width:16px;height:16px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#0b6468;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div></div>',
    });
    markerRef.current = L.marker([target.lat, target.lng], { icon }).addTo(map);
    map.flyTo([target.lat, target.lng], 15, { duration: 1.2 });
  }, [target?.lat, target?.lng]);
  return P.jsx("div", { ref, className: props.className, style: props.style, "data-native-map": "true" });
}
function HD() {
  return null;
}
function VD() {
  return null;
}
function GD() {
  return null;
}
const WD = {};
function lO({ pos, onPick }) {
  const ref = y.useRef(null);
  y.useEffect(() => {
    if (!window.L || !ref.current) return;
    const map = L.map(ref.current, {
      center: pos ? [pos.lat, pos.lng] : [-14.235, -51.9253],
      zoom: pos ? 15 : 4,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    map.on("click", (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }));
    if (pos) L.circleMarker([pos.lat, pos.lng], { color: "#dc2626" }).addTo(map);
    return () => map.remove();
  }, []);
  return P.jsx("div", { ref, className: "w-full h-[260px] rounded-2xl", "data-native-map": "true" });
}
function kO({ variant = "default", className = "", children, ...rest }) {
  return P.jsx("button", {
    ...rest,
    className: "native-button " + (variant === "outline" ? "native-outline " : "native-primary ") + className,
    children,
  });
}
function AO({ className = "", ...props }) {
  return P.jsx("input", { ...props, className: "native-input " + className });
}
function IO({ children, ...props }) {
  return P.jsx("label", { ...props, className: "text-sm font-medium leading-none", children });
}
function zO() {
  return "/";
}
function mc() {
  return [new URLSearchParams(typeof location === "undefined" ? "" : location.search)];
}
function ne({ title, description }) {
  window.alert(title + (description ? "\n" + description : ""));
}
function ck({ value, onChange, ...rest }) {
  return P.jsx("input", {
    ...rest,
    children: undefined,
    inputMode: "numeric",
    maxLength: 6,
    value,
    onChange: (e) => onChange(e.target.value),
    className: "native-input text-center text-2xl tracking-widest",
  });
}
const lk = Gg;
function uk() {
  return null;
}
ug.auth = {
  loginViaEmailPassword: async () => {},
  loginWithProvider: () =>
    window.alert(
      "Esta cópia possui a interface de login. O acesso com Google precisa de OAuth e backend próprios.",
    ),
  register: async () => {
    throw Error("O cadastro de contas precisa de backend próprio.");
  },
  resetPasswordRequest: async () => {
    window.alert("A recuperação de senha precisa de backend próprio. Nenhum e-mail foi enviado.");
  },
  verifyOtp: async () => {
    throw Error("Verificação indisponível nesta cópia local.");
  },
};

function makeId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const n = (Math.random() * 16) | 0;
      return (c === "x" ? n : (n & 3) | 8).toString(16);
    })
  );
}
