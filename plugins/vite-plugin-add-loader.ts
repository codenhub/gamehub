import type { Plugin } from "vite";

const LOADER_STYLES = `
  #page-loader {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-background, #fafafa);
    transition: opacity 0.3s ease;
  }

  #page-loader.hidden {
    opacity: 0;
    pointer-events: none;
  }

  #page-loader .spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 4px solid var(--color-border, #d4d4d4);
    border-top-color: var(--color-primary, #0a0a0a);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LOADER_HTML = `
  <div id="page-loader">
    <div class="spinner"></div>
  </div>
  <style>${LOADER_STYLES}</style>
  <script>
    window.addEventListener("load", function () {
      var loader = document.getElementById("page-loader");
      if (!loader) return;
      loader.classList.add("hidden");
      loader.addEventListener("transitionend", function () {
        loader.remove();
      });
    });
  </script>
`;

export default function addLoaderPlugin(): Plugin {
  return {
    name: "vite-plugin-add-loader",
    enforce: "post",
    transformIndexHtml: {
      order: "post",
      handler(html: string) {
        return html.replace("<body>", `<body>${LOADER_HTML}`);
      },
    },
  };
}
