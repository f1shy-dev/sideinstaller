import { toastCard as toastTemplate } from "./templates";

export const log = (msg) => {
  const logEl = document.querySelector("#log-window");
  logEl.innerHTML += `[${new Date().toISOString().slice(11, 19)}] ${msg}<br />`;
};

export const template = (html, obj, clickHooks, extraClasses) => {
  Object.keys(obj).forEach(
    (key) => (html = html.replace(new RegExp(`{{${key}}}`, "g"), obj[key]))
  );

  let elem = document.createElement("div");
  if (extraClasses) {
    elem.classList.add(...extraClasses);
  }
  elem.innerHTML = html;
  if (clickHooks && Object.keys(clickHooks).length > 0) {
    Object.keys(clickHooks).forEach((key) => {
      elem.querySelector(key).addEventListener("click", clickHooks[key]);
    });
  }
  return elem;
};

export const showErrorToast = (msg) => {
  const toastBox = document.querySelector("#toast-box");
  const uniqueid = Math.random().toString(36).substring(7);
  let toast = template(toastTemplate, {
    msg,
    uniqueid,
  });
  toastBox.insertAdjacentElement("beforeend", toast);

  let toastCard = document.querySelector(`#toast-${uniqueid}`);
  window.requestAnimationFrame(() => {
    toastCard.classList.add("translate-x-0");
    toastCard.classList.remove("translate-x-full");

    setTimeout(() => {
      toastCard.classList.remove("translate-x-0");
      toastCard.classList.add("translate-x-full");
      // delete the element
      toastCard.addEventListener("transitionend", () => {
        toastCard.remove();
      });
    }, 2500);
  });
};

export const onClick = (selector, callback) =>
  document.querySelector(selector).addEventListener("click", callback);
