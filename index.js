function error(text) {
  document.querySelector(".form").style.display = "none";
  document.querySelector(".error").style.display = "inherit";
  document.querySelector("#errortext").innerText = `Error: ${text}`;
}

// Run when the <body> loads
function main() {
  if (window.location.hash) {
    document.querySelector(".form").style.display = "inherit";
    document.querySelector("#password").value = "";
    document.querySelector("#password").focus();
    document.querySelector(".error").style.display = "none";
    document.querySelector("#errortext").innerText = "";

    // Comprova que les llibreries necessàries s'han carregat
    if (!("b64" in window)) {
      error("No s'ha pogut carregar la llibreria Base64.");
      return;
    }
    if (!("apiVersions" in window)) {
      error("No s'ha pogut carregar la llibreria de l'API.");
      return;
    }

    // Intenta obtenir les dades de la URL
    const hash = window.location.hash.slice(1);
    let params;
    try {
      params = JSON.parse(b64.decode(hash));
    } catch {
      error("L'enllaç sembla malmès o incorrecte.");
      return;
    }

    // Comprova que hi ha els paràmetres necessaris
    if (!("v" in params && "e" in params)) {
      error("L'enllaç és incomplet o està malmès.");
      return;
    }

    // Comprova que la versió de l'API és compatible
    if (!(params["v"] in apiVersions)) {
      error("La versió d'aquest enllaç no és compatible.");
      return;
    }

    const api = apiVersions[params["v"]];

    // Obté els valors per a la desencriptació
    const encrypted = b64.base64ToBinary(params["e"]);
    const salt = "s" in params ? b64.base64ToBinary(params["s"]) : null;
    const iv = "i" in params ? b64.base64ToBinary(params["i"]) : null;

    let hint, password;
    if ("h" in params) {
      hint = params["h"];
      document.querySelector("#hint").innerText = "Pista: " + hint;
    }

    const unlockButton = document.querySelector("#unlockbutton");
    const passwordPrompt = document.querySelector("#password");

    passwordPrompt.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        unlockButton.click();
      }
    });

    unlockButton.addEventListener("click", async () => {
      password = passwordPrompt.value;

      // Intenta desencriptar i redirigir
      let url;
      try {
        url = await api.decrypt(encrypted, password, salt, iv);
      } catch {
        error("La contrasenya introduïda no és correcta.");

        // Enllaços alternatius (si els mantens)
        document.querySelector("#no-redirect").href =
          `https://esplaimiv.github.io/Links-Protegits/decrypt/#${hash}`;

        document.querySelector("#hidden").href =
          `https://esplaimiv.github.io/Links-Protegits/hidden/#${hash}`;

        return;
      }

      try {
        let urlObj = new URL(url);

        if (!(urlObj.protocol == "http:"
              || urlObj.protocol == "https:"
              || urlObj.protocol == "magnet:")) {
          error(
            `L'enllaç utilitza un protocol no permès (${urlObj.protocol}). `
            + `Per motius de seguretat, no es pot redirigir.`
          );
          return;
        }

        window.location.href = url;

      } catch {
        error("L'adreça desencriptada no és vàlida. No es pot redirigir.");
        console.log(url);
        return;
      }
    });

  } else {
    // Si no hi ha hash, redirigeix al creador
    window.location.replace("./create");
  }
}
