import type { UIStrings } from "../types";

export default {
  nav: {
    home: "主页",
    posts: "文章",
    tags: "标签",
    about: "关于",
    archives: "归档",
    search: "搜索",
  },
  post: {
    publishedAt: "发布于",
    updatedAt: "更新于",
    sharePostIntro: "分享这篇帖子:",
    sharePostOn: "在 {{platform}} 上分享这篇帖子",
    sharePostViaEmail: "通过电子邮件分享这篇帖子",
    tagLabel: "标签",
    backToTop: "返回顶部",
    goBack: "返回",
    editPage: "编辑文章",
    previousPost: "上一篇",
    nextPost: "下一篇",
    comments: "评论",
  },
  pagination: {
    prev: "Prev",
    next: "Next",
    page: "Page",
  },
  home: {
    socialLinks: "社交链接",
    featured: "精选",
    recentPosts: "最近的帖子",
    allPosts: "所有的帖子",
  },
  footer: {
    copyright: "Copyright",
    allRightsReserved: "All rights reserved.",
  },
  pages: {
    tagTitle: "Tag",
    tagDesc: "所有带有该标签的文章 ...",

    tagsTitle: "Tags",
    tagsDesc: "帖子中使用的所有标签 ...",

    postsTitle: "Posts",
    postsDesc: "我发布的所有文章 ...",

    archivesTitle: "Archives",
    archivesDesc: "时间归档 ...",

    searchTitle: "Search",
    searchDesc: "搜索任意文章 ...",
  },
  a11y: {
    skipToContent: "跳转到主要内容",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    toggleTheme: "切换「明 / 暗」主题",
    searchPlaceholder: "正在搜索文章...",
    noResults: "没有找到结果",
    goToPreviousPage: "上一篇",
    goToNextPage: "下一篇",
  },
  notFound: {
    title: "404 Not Found",
    message: "文章不见了",
    goHome: "返回主页",
  },
} satisfies UIStrings;
