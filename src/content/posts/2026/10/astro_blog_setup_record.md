---
title: Astro 博客建立
author: pendinor
pubDatetime: 2026-10-31T08:36:22Z
featured: false
draft: false
tags:
  - blog
description: 记录我通过 Astro 框架创建 Github Page 博客的过程
intendedAudience: 想要通过 Astro 框架、Github Page 在 Windows 上快速创建和维护自己的 Blog 的开发者
---

# 1. 安装 nodejs 等环境

`Astro` 作为前端框架，需要使用 `npm` 等工具进行安装，而 npm 可以通过安装 `nodejs` 运行时获取。在 Windows 上，如果不是前端开发者，不需要维护多个 nodejs 版本，可以直接在 nodejs 的 [官方网站](https://nodejs.org/zh-cn) 下载 `msi` 安装包安装即可。

Windows 上 nodejs 的版本管理工具如 `fnm` 等工具个人感觉很麻烦，对 `CMD`, `powershell` 等各种 `bash` 都要执行 fnm 的初始化命令才能找到 nodejs，对我来说我只能接受 `Linux` 环境下修改 bash 的配置文件，Windows 下感觉不适合这种操作。

安装好 nodejs 的安装包后，npm 就随之安装到机器上了。npm 是 nodejs 的包管理器，在国内使用首先需要换源。在 `C:\User\xxx\` 用户目录下添加 `.npmrc` 文件夹，添加以下内容：

```
registry=https://registry.npmmirror.com
```

保存后在一个新 Windows 终端执行 `npm config get registry`，以验证是否成功换源。成功换源后建议安装 `pnpm`，即 `npm install -g pnpm` ，通过 pnpm 来管理 nodejs 的包，比 npm 更能节省磁盘空间。安装完成 pnpm 后可以在 `C:\Users\xxx\AppData\Local\pnpm\config` 目录下创建 `config.yaml` ，修改 pnpm 的包存储位置：

```yaml
storeDir: E:\pnpm\store
globalDir: E:\pnpm\global
globalBinDir: E:\pnpm\global\bin
cacheDir: E:\pnpm\cache
```

# 2. 安装 Astro 框架
使用 pnpm 安装 Astro 框架及主题。在你的博客目录中执行以下命令：
```bash
pnpm create astro@latest --template satnaing/astro-paper
pnpm install

# start running the project
pnpm dev
```

pnpm 就会把 Astro 框架及其 `AstroPaper` 主题下载到当前目录。通过`pnpm dev`即可启动这个示例博客，在浏览器中访问该命令给出的本地网址即可开始浏览该博客。

# 3. 添加简体中文支持
在 Astro 框架中可以通过`src/i18n/lang`(`internationalization`) 文件夹下创建 `zh-Hans.ts` 文件，将英文翻译成中文：
```Typescript
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

```

之后修改`/astro.config.ts` 中的配置，将中文设置为默认的语言
```Typescript
  i18n: {
	locales: ["en", "zh-Hans"],
    defaultLocale: "zh-Hans",
    routing: {
      prefixDefaultLocale: false,
    },
  },
```

然后可以修改 `astro-paper.config.ts` 主题配置，修改为你的个人信息：
```TypeScript
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
```

# 4. 处理字体来源
Astro 中默认提供了谷歌字体，但是在国内无法正常访问，所以需要将其改为国内的镜像字体网站`googlefonts.cn (fonts.font.im)`。可以让`agent`按照官方文档 (`https://docs.astro.build/en/reference/font-provider-reference/#building-a-font-provider`) 写一个该网站的`Provider`。或者参考[我的仓库](https://github.com/pendinor/pendinor.github.io/blob/main/src/fonts/googlefonts-cn.ts) 

# 5. 禁用 Jekyll 构建
因为 Github Page 在构建时会使用 `Jekyll` 进行构建，该构建模式会忽略掉`_`开头的文件，而我们的可发布目录中包含 `_astro`，必须禁用 Jekyll 构建防止我们的资源丢失。在 `public` 目录创建一个 `.nojekyll` 文件，重新 `pnpm bulid` 后即可。

```bash
touch public/.nojekyll
```

# 6. 创建 `Github Page`
处理好博客框架的基础内容后，就可以尝试发布到 Github Page 了。 在 github 上创建一个公开的 `yourname.github.io` 仓库即可，不需要用两个仓库分别装源码和静态网页，因为这两项可以保存在同一个仓库的不同分支，nodejs 包中还有 `gh-pages` 工具简化发布流程 。创建完成后按github 的提示先将 Astro 框架博客源码推送到这个仓库。

将源码推送到 `main` 分支后，我们再来创建出目标静态网页。依托 Astro 框架的能力，在源码目录执行 `pnpm build` 即可创建出 `dist` 文件夹。dist 目录是前端项目构建后生成的可发布目录，我们只要把这个可发布目录放到 github 的仓库上，就能通过 Github Page 生成我们自己的博库。

`gh-pages` 工具可以帮助我们完成这一步。首先通过 `pnpm install -g gh-pages` 安装该工具，然后修改 `package.json` 脚本，在 `script` 中添加 `deploy` 的动作命令 `gh-pages -d dist --dotfiles` 。

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro check && astro build && pagefind --site dist && cp -r dist/pagefind public/",
  "preview": "astro preview",
  "sync": "astro sync",
  "astro": "astro",
  "format:check": "prettier --check .",
  "format": "prettier --write .",
  "lint": "eslint .",
  "deploy": "gh-pages -d dist --dotfiles"
},
```

> [!WARNING]
> 其中 **`--dotfiles`** 是必要的，否则 `.nojekyll` 无法上传到发布目录

这样在 `pnpm build` 构建出 dist 目录后，就能通过执行 `pnpm deploy` 将发布目录上传到 Github 了。
上传到 Github 后，可以在该仓库中的 `Settings->(Code, planning, and automation) Pages` 创建 Github Page，选择 `Deploy from a branch`，用 `gh-pages` 分支进行部署，保存后，`Github Action`就会自动开启部署流程，此时访问 `https://xxx.github.io/` 就能在公网看到你自己的博客了！

# 7. 自动修正发布时间和修改时间
Astro 强制每篇文章都要写 `pubDatetime` 发布时间，其实我觉得让用户写时间有点奇怪，应该自动生成发布时间比较符合直觉。可以让 agent 写一个脚本，在 `pnpm build` 时自动按官方要求的格式`YYYY-MM-DDTHH:mm:ssZ` 修改发布时间和修改时间。发布时间可以是添加到 git 仓库的时间，这样写完文章后不用考虑时间该写什么了。你也可以参考 [我的仓库](https://github.com/pendinor/pendinor.github.io/blob/main/scripts/sync-post-datetime.mjs) 


# 8. 使用 Obsidian 撰写博客

Astro 框架中的文章需要放到`src/content/posts`目录下。我觉得用`Obsidian`在这个目录或者上一层目录创建 Obsidian 知识库比较方便，因为 Obsidian 的 markdown 能实时渲染，和 `typora` 差不多，且默认资源目录形式、能够创建模板，跟写博客很搭，不用再去管 Astro 框架的源码了。