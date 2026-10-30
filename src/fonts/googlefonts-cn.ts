import type { FontProvider } from "astro";

/**
 * googlefonts.cn (fonts.font.im) 的 Astro 字体提供器。
 *
 * 该镜像实现了 Google Fonts 的 css2 API，字体文件由 fonts.gstatic.font.im 提供，
 * 请求结构与 fontProviders.google() 一致，只是换成了国内可访问的域名。
 *
 * @see https://docs.astro.build/en/reference/font-provider-reference/#building-a-font-provider
 */

type FontType = "woff2" | "woff" | "otf" | "ttf" | "eot";

/** CSS format() 名称 -> Astro 字体格式 */
const FORMAT_BY_CSS: Record<string, FontType> = {
  woff2: "woff2",
  woff: "woff",
  opentype: "otf",
  truetype: "ttf",
  "embedded-opentype": "eot",
};

/**
 * 与 Google 一样，镜像通过 user-agent 决定返回的文件格式。
 * 实测镜像会缓存首次请求生成的 CSS，所以实际拿到的格式可能与请求的不一致。
 */
const USER_AGENTS: Partial<Record<FontType, string>> = {
  eot: "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)",
  ttf: "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
  woff: "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0",
  woff2:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
};

const DEFAULT_CSS_URL = "https://fonts.font.im/css2";

const FONT_FACE_RE =
  /(?:\/\*\s*([^*\r\n]+?)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g;
const DECLARATION_RE = /([\w-]+)\s*:\s*([^;]+)/g;
const SRC_RE = /url\((['"]?)([^'")]+)\1\)(?:\s*format\((['"]?)([^'")]+)\3\))?/g;
const VARIABLE_WEIGHT_RE = /\d\s+\d|\.\./;

/**
 * 镜像按完整 query 缓存 CSS，同一 query 只会按首次请求的 user-agent 生成，
 * 因此每种格式要用不同的 URL，否则多格式配置只会拿到同一种文件。
 * font-display 由 Astro 生成，这里只是借它制造不同的缓存键。
 */
const CACHE_BUSTING_DISPLAY = ["swap", "block", "fallback", "optional"];

export interface GoogleFontsCnProviderOptions {
  /** css2 端点，默认 https://fonts.font.im/css2，可换成 https://fonts.googleapis.cn/css2 */
  cssUrl?: string;
  /** 所有字体族默认只包含这些字符，用于精简字体体积 */
  glyphs?: string[];
}

export interface GoogleFontsCnFamilyOptions {
  /** 只包含这些字符（对应 Google Fonts 的 text= 参数），可显著减小字体体积 */
  glyphs?: string[];
}

interface FontFaceData {
  src: Array<{ url: string; format: FontType }>;
  weight?: string;
  style?: string;
  unicodeRange?: string[];
  meta?: { priority?: number; subset?: string };
}

interface ProviderInitContext {
  storage: {
    getItem: {
      <T>(key: string): Promise<T | null>;
      <T>(key: string, init: () => T | Promise<T>): Promise<T>;
    };
  };
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
}

export function googleFontsCn(
  config: GoogleFontsCnProviderOptions = {}
): FontProvider<GoogleFontsCnFamilyOptions | undefined> {
  let context: ProviderInitContext;

  return {
    name: "googlefonts-cn",
    config,
    init(ctx) {
      context = ctx;
    },
    async resolveFont({
      familyName,
      weights,
      styles,
      subsets,
      formats,
      options,
    }) {
      const glyphs = options?.glyphs ?? config.glyphs;
      const cssUrl = config.cssUrl ?? DEFAULT_CSS_URL;
      const family = encodeURIComponent(familyName).replace(/%20/g, "+");
      const ital = [
        ...new Set(styles.map(style => (style === "normal" ? "0" : "1"))),
      ].sort();
      const ranges = weights
        .filter(weight => VARIABLE_WEIGHT_RE.test(weight))
        .map(weight => weight.trim().replace(/\s+/g, ".."));
      const statics = weights
        .filter(weight => !VARIABLE_WEIGHT_RE.test(weight))
        .map(weight => weight.trim());

      const groups = [ranges, statics].filter(values => values.length > 0);
      if (groups.length === 0) groups.push(["400"]);

      // css2 轴参数：ital,wght@0,300;0,400;1,300 ...
      const buildRequest = (weightValues: string[]) => {
        const axes = ital.includes("1") ? ["ital", "wght"] : ["wght"];
        let variants: string[] = [];
        for (const axis of axes) {
          const values = axis === "ital" ? ital : weightValues;
          variants = variants.length
            ? variants.flatMap(v => values.map(o => `${v},${o}`))
            : values;
        }
        return `${family}:${axes.join(",")}@${variants.join(";")}`;
      };

      const facesByKey = new Map<string, FontFaceData>();
      let priority = 0;

      for (const format of formats) {
        const userAgent = USER_AGENTS[format];
        if (!userAgent) continue;

        for (const weightValues of groups) {
          const request = buildRequest(weightValues);
          const display =
            CACHE_BUSTING_DISPLAY[priority % CACHE_BUSTING_DISPLAY.length];
          const url =
            `${cssUrl}?family=${request}&display=${display}` +
            (glyphs ? `&text=${encodeURIComponent(glyphs.join(""))}` : "");
          const css = await context.storage.getItem(
            `googlefonts-cn:${format}:${url}`,
            () =>
              context
                .fetch(url, { headers: { "user-agent": userAgent } })
                .then(res => res.text())
          );

          for (const { subset, data } of parseFontFaces(css, {
            formats: [format],
            subsets,
            priority,
          })) {
            const key = `${data.style}:${data.weight}:${data.unicodeRange?.join(",")}:${subset ?? ""}`;
            const existing = facesByKey.get(key);
            if (existing) {
              const urls = new Set(existing.src.map(source => source.url));
              existing.src.push(
                ...data.src.filter(source => !urls.has(source.url))
              );
              continue;
            }
            facesByKey.set(key, data);
          }
        }

        priority++;
      }

      return { fonts: [...facesByKey.values()] };
    },
  };
}

function parseFontFaces(
  css: string,
  {
    formats,
    subsets,
    priority,
  }: { formats: FontType[]; subsets: string[]; priority: number }
): Array<{ subset?: string; data: FontFaceData }> {
  const faces: Array<{ subset?: string; data: FontFaceData }> = [];

  for (const match of css.matchAll(FONT_FACE_RE)) {
    const subset = match[1];
    // 未使用 text= 时镜像会返回全部子集，只保留配置中请求的
    if (subset && subsets.length > 0 && !subsets.includes(subset)) continue;

    const declarations = new Map<string, string>();
    for (const declaration of match[2].matchAll(DECLARATION_RE)) {
      declarations.set(declaration[1], declaration[2].trim());
    }

    const rawSrc = declarations.get("src");
    if (!rawSrc) continue;

    const src = [...rawSrc.matchAll(SRC_RE)]
      .map(source => ({
        url: source[2],
        format: FORMAT_BY_CSS[source[4]],
      }))
      .filter(source => formats.includes(source.format));
    if (src.length === 0) continue;

    const unicodeRange = declarations
      .get("unicode-range")
      ?.split(",")
      .map(range => range.trim())
      .filter(Boolean);

    faces.push({
      subset,
      data: {
        src,
        style: declarations.get("font-style"),
        weight: declarations.get("font-weight"),
        ...(unicodeRange ? { unicodeRange } : {}),
        meta: { priority, ...(subset ? { subset } : {}) },
      },
    });
  }

  return faces;
}
