const log = (msg) => {
  const logEl = document.querySelector("#log-window");
  logEl.innerHTML += `[${new Date().toISOString().slice(11, 19)}] ${msg}<br />`;
};

const template = (html, obj, clickHooks) => {
  Object.keys(obj).forEach(
    (key) => (html = html.replace(new RegExp(`{{${key}}}`, "g"), obj[key]))
  );

  let elem = document.createElement("div");
  elem.innerHTML = html;
  if (clickHooks) {
    Object.keys(clickHooks).forEach((key) => {
      elem.querySelector(key).addEventListener("click", clickHooks[key]);
    });
  }
  return elem;
};

const onClick = (selector, callback) =>
  document.querySelector(selector).addEventListener("click", callback);


export { log, template, onClick };