import { showErrorToast } from "../helpers";
import { authenticate } from "../authenticate3";

const emailregex =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

const step = {
  container: "#apple-login",
  onstart: [
    async (contID, stepData) => {
      let container = document.querySelector(contID);
      console.log(stepData);

      document
        .querySelector("#login-btn")
        .addEventListener("click", async () => {
          let email = document.querySelector("#appleid-email").value;
          let password = document.querySelector("#appleid-password").value;

          // check if email is valid with regex
          if (!email.match(emailregex))
            return showErrorToast("Please enter a valid email address");

          if (password.length < 1)
            return showErrorToast("Please enter a password");

          document.querySelector("#login-btn").style.display = "none";
          document.querySelector("#login-btn-loading").style.display = "flex";
          const auth = await authenticate(email, password);
          if (auth.success == false) {
            document.querySelector("#login-btn").style.display = "block";
            document.querySelector("#login-btn-loading").style.display = "none";
          }
        });
    },
  ],
  next: "optional-2fa",
};

export default step;
