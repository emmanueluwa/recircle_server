const form = document.getElementById("form");
const messageTag = document.getElementById("message");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirm-password");
const notification = document.getElementById("notification");
const submitButton = document.getElementById("submit");

const passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

form.style.display = "none";

let token, id;

window.addEventListener("DOMContentLoaded", async () => {
  const params = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => {
      return searchParams.get(prop);
    },
  });

  token = params.token;
  id = params.id;

  //send token and id to verify endpoint
  const res = await fetch("/auth/verify-pass-reset-token", {
    method: "POST",
    body: JSON.stringify({ token, id }),
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
  });

  if (!res.ok) {
    const { message } = await res.json();
    messageTag.innerText = message;
    messageTag.classList.add("error");
    return;
  }

  messageTag.style.display = "none";
  form.style.display = "block";
});

const displayNotification = (message, type) => {
  notification.style.display = "block";
  notification.innerText = message;
  notification.classList.add(type);
};

const handleSubmit = async (e) => {
  e.preventDefault();

  //validate form
  if (!passwordRegex.test(password.value)) {
    return displayNotification(
      "Password is invalid, use letters, numbers and specical chars!",
      "error"
    );
  }

  if (password.value !== confirmPassword.value) {
    return displayNotification("Passwords do not match!", "error");
  }

  //submit form
  submitButton.disabled = true;
  submitButton.innerText = "Please wait...";

  const res = await fetch("/auth/reset-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify({ id, token, password: password.value }),
  });

  submitButton.disabled = false;
  submitButton.innerText = "Update Password";

  if (!res.ok) {
    const { message } = await res.json();
    return displayNotification(message, "error");
  }

  messageTag.style.display = "block";
  messageTag.innerText = "Your password updated successfully!";
  form.style.display = "none";
};
console.log("whynot");
form.addEventListener("submit", handleSubmit);
