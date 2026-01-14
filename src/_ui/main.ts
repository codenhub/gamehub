document.addEventListener("DOMContentLoaded", () => {
  const els = document.querySelectorAll("img, a") as
    | NodeListOf<HTMLImageElement>
    | NodeListOf<HTMLAnchorElement>;

  els.forEach((e) => {
    e.draggable = false;
  });
});
