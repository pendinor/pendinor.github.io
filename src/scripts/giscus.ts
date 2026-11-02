/**
 * Mounts the giscus iframe from the data attributes rendered by
 * `components/Giscus.astro` and keeps its theme in sync with the site.
 *
 * The script is re-run on every `astro:page-load` because View Transitions
 * replace the container element on navigation, while giscus keeps its state
 * inside the injected iframe.
 */
const GISCUS_ORIGIN = "https://giscus.app";

type GiscusContainer = HTMLElement & {
  dataset: DOMStringMap & {
    repo?: string;
    repoId?: string;
    category?: string;
    categoryId?: string;
    mapping?: string;
    strict?: string;
    reactionsEnabled?: string;
    inputPosition?: string;
    lang?: string;
    themeLight?: string;
    themeDark?: string;
    mounted?: string;
  };
};

function currentTheme(container: GiscusContainer): string {
  const isDark = document.documentElement.dataset.theme === "dark";
  return (
    (isDark ? container.dataset.themeDark : container.dataset.themeLight) ??
    "light"
  );
}

function mount(): void {
  const container = document.querySelector<GiscusContainer>("[data-giscus]");
  if (!container || container.dataset.mounted === "true") return;
  if (!container.dataset.repoId || !container.dataset.categoryId) return;

  container.dataset.mounted = "true";
  container.replaceChildren();

  const script = document.createElement("script");
  script.src = `${GISCUS_ORIGIN}/client.js`;
  script.async = true;
  script.crossOrigin = "anonymous";

  const attributes: Record<string, string | undefined> = {
    "data-repo": container.dataset.repo,
    "data-repo-id": container.dataset.repoId,
    "data-category": container.dataset.category,
    "data-category-id": container.dataset.categoryId,
    "data-mapping": container.dataset.mapping,
    "data-strict": container.dataset.strict,
    "data-reactions-enabled": container.dataset.reactionsEnabled,
    "data-input-position": container.dataset.inputPosition,
    "data-lang": container.dataset.lang,
    "data-loading": "lazy",
    "data-theme": currentTheme(container),
  };

  for (const [name, value] of Object.entries(attributes)) {
    if (value !== undefined) script.setAttribute(name, value);
  }

  container.appendChild(script);
}

/** Push the current site theme into the already mounted giscus iframe. */
function syncTheme(): void {
  const container = document.querySelector<GiscusContainer>("[data-giscus]");
  const frame = document.querySelector<HTMLIFrameElement>(
    "iframe.giscus-frame"
  );
  if (!container || !frame?.contentWindow) return;

  frame.contentWindow.postMessage(
    { giscus: { setConfig: { theme: currentTheme(container) } } },
    GISCUS_ORIGIN
  );
}

new MutationObserver(syncTheme).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

document.addEventListener("astro:page-load", mount);
