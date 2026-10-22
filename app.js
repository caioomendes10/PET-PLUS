function Base44Badge() {
  const [open, setOpen] = y.useState(true);
  return open
    ? P.jsxs("div", {
        className: "base44-copy",
        children: [
          P.jsx("img", { src: "assets/pet-27.png", alt: "base44" }),
          P.jsxs("span", { children: ["Edit with ", P.jsx("strong", { children: "Base44" })] }),
          P.jsx("button", { "aria-label": "Close badge", onClick: () => setOpen(false), children: "×" }),
        ],
      })
    : null;
}
const pageViews = {
  "/": DashboardPage,
  "/meu-pet": PetPage,
  "/saude": HealthPage,
  "/medicamentos": MedicinePage,
  "/agenda": AgendaPage,
  "/gps": GpsPage,
  "/ia": NinaPage,
  "/ajuda": HelpPage,
  "/shop": ShopPage,
  "/responsavel": OwnerPage,
  "/configuracoes": SettingsPage,
};
function Hs() {
  const View = pageViews[PET.route] || DashboardPage;
  return P.jsx(View, {});
}
function Screen() {
  const auth = {
    "/login": LoginPage,
    "/register": RegisterPage,
    "/forgot-password": ForgotPasswordPage,
    "/reset-password": ResetPasswordPage,
  };
  const Auth = auth[PET.route];
  return P.jsx(AccessibilityProvider, {
    children: P.jsx(DataProvider, {
      children: P.jsxs(P.Fragment, {
        children: [
          Auth
            ? P.jsx(Auth, {})
            : PET.route === "/sos"
              ? P.jsx(EmergencyPage, {})
              : P.jsx(ApplicationLayout, {}),
          P.jsx(AccessibilityMenu, {}),
          P.jsx(ReadAloudButton, {}),
          P.jsx(EmergencyButton, {}),
          P.jsx(Base44Badge, {}),
        ],
      }),
    }),
  });
}
function renderApp() {
  for (const i of PET.instances.values()) i.active = false;
  PET.effects = [];
  const next = resolveView(P.jsx(Screen, {}));
  const root = document.getElementById("root");
  if (!PET.tree) root.textContent = "";
  const view = { type: "div", props: {}, children: flatNodes(next) };
  view.el = root;
  if (PET.tree) {
    const a = PET.tree.children,
      b = view.children;
    for (let i = 0; i < Math.max(a.length, b.length); i++) patch(root, a[i], b[i]);
  } else for (const node of view.children) patch(root, null, node);
  PET.tree = view;
  for (const [key, instance] of PET.instances)
    if (!instance.active) {
      for (const hook of instance.hooks) hook?.cleanup?.();
      PET.instances.delete(key);
    }
  for (const fn of PET.effects)
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
}
if (typeof window !== "undefined" && !window.PET_EXPORT) {
  PET.route = readRoute();
  window.addEventListener("popstate", () => {
    PET.route = readRoute();
    renderApp();
  });
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", renderApp) : renderApp();
}
