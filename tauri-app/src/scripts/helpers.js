const log = (msg) => {
  const logEl = document.querySelector("#log-window");
  logEl.innerHTML += `[${new Date().toISOString().slice(11, 19)}] ${msg}<br />`;
};

const template = (html, obj, clickHooks, extraClasses) => {
  Object.keys(obj).forEach(
    (key) => (html = html.replace(new RegExp(`{{${key}}}`, "g"), obj[key]))
  );

  let elem = document.createElement("div");
  if (extraClasses) {
    elem.classList.add(...extraClasses);
  }
  elem.innerHTML = html;
  if (Object.keys(clickHooks).length > 0) {
    Object.keys(clickHooks).forEach((key) => {
      elem.querySelector(key).addEventListener("click", clickHooks[key]);
    });
  }
  return elem;
};

const onClick = (selector, callback) =>
  document.querySelector(selector).addEventListener("click", callback);

export { log, template, onClick };
