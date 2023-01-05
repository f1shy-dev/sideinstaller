const log = (msg) => {
  const logEl = document.querySelector("#log-window");
  logEl.innerHTML += `[${new Date().toISOString().slice(11, 19)}] ${msg}<br />`;
};

const template = (html, obj) => {
  Object.keys(obj).forEach(
    (key) => (html = html.replace(new RegExp(`{{${key}}}`, "g"), obj[key]))
  );
  return html;
};

const onClick = (selector, callback) =>
  document.querySelector(selector).addEventListener("click", callback);


export { log, template, onClick };