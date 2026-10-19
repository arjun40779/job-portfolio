// Open Graph images (1200×630) for link previews on LinkedIn, Slack and X,
// rendered at build time with satori (layout → SVG) and resvg (SVG → PNG).
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import type { APIRoute, GetStaticPaths } from "astro";
import satori from "satori";
import { getSiteContent } from "../../lib/content";

interface Props {
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const getStaticPaths = (async () => {
  const { profile, caseStudies } = await getSiteContent();
  return [
    {
      params: { slug: "home" },
      props: {
        eyebrow: profile.title,
        title: profile.name,
        subtitle: profile.statement,
      },
    },
    ...caseStudies.map((project) => ({
      params: { slug: `projects-${project.id}` },
      props: {
        eyebrow: "Case study",
        title: project.title,
        subtitle: project.summary,
      },
    })),
  ];
}) satisfies GetStaticPaths;

// satori needs WOFF/TTF (not WOFF2), so these come from @fontsource/inter.
const fontDir = join(process.cwd(), "node_modules/@fontsource/inter/files");
const fonts = Promise.all([
  readFile(join(fontDir, "inter-latin-400-normal.woff")),
  readFile(join(fontDir, "inter-latin-600-normal.woff")),
]);

// Light-theme tokens from global.css (§4.3).
const colors = {
  bg: "#ffffff",
  surface: "#f5f5f7",
  text: "#1d1d1f",
  muted: "#6e6e73",
  link: "#0066cc",
};

export const GET: APIRoute = async ({ props }) => {
  const { eyebrow, title, subtitle } = props as Props;
  const [regular, semibold] = await fonts;

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: colors.bg,
          fontFamily: "Inter",
        },
        children: [
          {
            type: "div",
            props: {
              style: { display: "flex", alignItems: "center", gap: 16 },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 56,
                      height: 56,
                      borderRadius: 14,
                      backgroundColor: colors.text,
                      color: colors.surface,
                      fontSize: 24,
                      fontWeight: 600,
                    },
                    children: "AS",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: { fontSize: 26, color: colors.muted },
                    children: "arjun.buzz",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: { display: "flex", flexDirection: "column", gap: 20 },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 30,
                      fontWeight: 600,
                      color: colors.link,
                    },
                    children: eyebrow,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: title.length > 18 ? 76 : 92,
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.05,
                      color: colors.text,
                    },
                    children: title,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: 36,
                      lineHeight: 1.3,
                      color: colors.muted,
                      maxWidth: 960,
                    },
                    children: subtitle,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );

  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
    .render()
    .asPng();
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
