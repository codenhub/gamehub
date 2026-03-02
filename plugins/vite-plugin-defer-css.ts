import type { Plugin } from "vite";

const STYLESHEET_RE = /<link\s+rel="stylesheet"((?=[^>]*\shref=)[^>]*?)\/?>/g;

export default function deferCssPlugin(): Plugin {
  return {
    name: "vite-plugin-defer-css",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html: string) {
        let noscript = "";
        const transformed = html.replace(STYLESHEET_RE, (_, attrs: string) => {
          noscript += `    <link rel="stylesheet"${attrs}>\n`;

          return `<link rel="preload" as="style"${attrs} onload="this.onload=null;this.rel='stylesheet'">`;
        });

        if (!noscript) {
          return transformed;
        }

        return transformed.replace("</head>", `  <noscript>\n${noscript}  </noscript>\n  </head>`);
      },
    },
  };
}
