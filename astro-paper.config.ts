import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://pendinor.github.io/",
    title: "Pendinor's Blog",
    description: "Pendinor's Blog",
    author: "pendinor",
    profile: "https://github.com/pendinor",
    ogImage: "default-og.jpg",
    lang: "zh-Hans",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 4,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: false,
      // url: "",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github",   url: "https://github.com/pendinor" },
    { name: "mail",     url: "mailto:gravelgalaxy@qq.com" },
  ],
  shareLinks: [
    { name: "mail",     url: "mailto:?subject=See%20this%20post&body=" },
  ],
});