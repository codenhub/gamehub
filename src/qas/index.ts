import { showAlert } from "../_core/utils/alerts";

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn");

  btn?.addEventListener("click", () => {
    showAlert({
      message: "Hello World",
      type: "success",
    });
  });
});
