import type { SiteConfig } from "@/types";
import type { AstroExpressiveCodeOptions } from "astro-expressive-code";

export const siteConfig: SiteConfig = {
	author: "Ankur Kumar Agarwal",
	date: {
		locale: "en-US",
		options: {
			day: "numeric",
			month: "short",
			year: "numeric",
		},
	},
	description:
		"My name is Ankur. I ask questions to understand things that either interest me or trouble me. I write about some of these questions here. Read the About section for more.\nI am exploring x86 Intel virtualization in Linux (KVM) right now.",
	lang: "en-US",
	ogLocale: "en_US",
	sortPostsByUpdatedDate: false,
	title: "Ankur Agarwal",
	hideThemeCredit: false,
	profile: {
		name: "Ankur Kumar Agarwal",
		email: "aggrawal_ankur@protonmail.com",
		github: "https://github.com/aggrawal-ankur/",
		linkedin: "https://www.linkedin.com/in/ankur-agarwal-a31895428/",
		jobTitle: "",
		employer: "",
		employerUrl: "",
		alumni: "",
		avatar: "/avatar.png",
	},
	// Uncomment & fill in to enable Giscus comments on every post.
	// comments: {
	// 	repo: "your-handle/your-repo",
	// 	repoId: "...",
	// 	category: "General",
	// 	categoryId: "...",
	// },

	// Uncomment to enable analytics. Both providers load via Partytown.
	analytics: {
		// googleAnalyticsId: "G-XXXXXXX",
		goatcounterUrl: "https://aggarwal-ankur.goatcounter.com/count",
	},
};

export const menuLinks: { path: string; title: string }[] = [
	{
		path: "/",
		title: "Home",
	},
	{
		path: "/posts/",
		title: "Posts",
	},
	{
		path: "/showcase/",
		title: "Showcase",
	},
	{
		path: "/about/",
		title: "About",
	},
	{
		path: "/site-credits/",
		title: "Site Credits",
	},
];

export const expressiveCodeOptions: AstroExpressiveCodeOptions = {
  styleOverrides: {
    borderRadius: "6px",
    borderWidth: "1px",
    borderColor: "var(--hairline)",
    codeBackground: "var(--paper)",
    codeFontFamily:
      '"JetBrains Mono", "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
    codeFontSize: "0.85rem",
    codeLineHeight: "1.65",
    codePaddingInline: "1.1rem",
    codePaddingBlock: "1rem",
    uiFontFamily:
      '"JetBrains Mono", "JetBrains Mono Variable", ui-monospace, SFMono-Regular, Menlo, monospace',
    uiFontSize: "0.8rem",
    uiLineHeight: "inherit",
    frames: {
      editorActiveTabBackground: "var(--paper)",
      editorTabBarBackground: "var(--theme-bg)",
      editorTabBarBorderColor: "var(--hairline)",
      editorTabBarBorderBottomColor: "var(--hairline)",
      editorActiveTabBorderColor: "var(--hairline)",
      frameBoxShadowCssValue: "none",
      terminalBackground: "var(--paper)",
      terminalTitlebarBackground: "var(--theme-bg)",
      terminalTitlebarBorderBottomColor: "var(--hairline)",
      terminalTitlebarDotsOpacity: "0.4",
    },
  },
  themeCssSelector(theme) {
    if (theme.name === "github-dark-dimmed") return "[data-theme='eink'], [data-theme='dark'], :root:not([data-theme])";
    if (theme.name === "material-theme-ocean") return "[data-theme='glacier']";
    if (theme.name === "material-theme-darker") return "[data-theme='sage']";
    if (theme.name === "dracula") return "[data-theme='twilight']";
    if (theme.name === "material-theme-palenight") return "[data-theme='steel']";
    if (theme.name === "github-light") return "[data-theme='light']";
    return `[data-theme='${theme.name}']`;
  },
  themes: [
    "github-dark-dimmed",
    "material-theme-ocean",
    "material-theme-darker",
    "dracula",
    "material-theme-palenight",
    "github-light",
  ],
  useThemedScrollbars: false,
};
