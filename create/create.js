/**
 * Adaptació catalana – Esplai MIV
 * Basat en el projecte original de Jacob Strieb (MIT License)
 */


/*******************************************************************************
 * Funcions auxiliars
 ******************************************************************************/

// Ressalta el text d’un input amb l’id indicat
function highlight(id) {
  let output = document.querySelector("#" + id);
  output.focus();
  output.select();
  output.setSelectionRange(0, output.value.length + 1);
  return output;
}


// Valida els inputs i mostra error si cal
function validateInputs() {
  var inputs = document.querySelectorAll(".form .labeled-input input");
  for (let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    input.reportValidity = input.reportValidity || (() => true);
    if (!input.reportValidity()) {
      return false;
    }
  }

  const url = document.querySelector("#url");
  let urlObj;

  try {
    urlObj = new URL(url.value);
  } catch {
    if (!("reportValidity" in url)) {
      alert("L'URL no és vàlida. Assegureu-vos que comença amb 'http://' o 'https://'.");
    }
    return false;
  }

  if (!(urlObj.protocol == "http:"
        || urlObj.protocol == "https:"
        || urlObj.protocol == "magnet:")) {

    url.setCustomValidity(
      "L'enllaç utilitza un protocol no permès (" + urlObj.protocol +
      "). Per motius de seguretat, només s'admeten enllaços http, https o magnet."
    );
    url.reportValidity();
    return false;
  }

  return true;
}


// Genera el fragment xifrat
async function generateFragment(url, passwd, hint, useRandomSalt, useRandomIv) {
  const api = apiVersions[LATEST_API_VERSION];

  const salt = useRandomSalt ? await api.randomSalt() : null;
  const iv = useRandomIv ? await api.randomIv() : null;
  const encrypted = await api.encrypt(url, passwd, salt, iv);

  const output = {
    v: LATEST_API_VERSION,
    e: b64.binaryToBase64(new Uint8Array(encrypted))
  };

  if (hint != "") {
    output["h"] = hint;
  }

  if (useRandomSalt) {
    output["s"] = b64.binaryToBase64(salt);
  }
  if (useRandomIv) {
    output["i"] = b64.binaryToBase64(iv);
  }

  return b64.encode(JSON.stringify(output));
}



/*******************************************************************************
 * Funcions principals de la interfície
 ******************************************************************************/

// Quan es prem el botó "Encripta"
async function onEncrypt() {
  if (!validateInputs()) {
    return;
  }

  const password = document.querySelector("#password").value;
  const confirmPassword = document.querySelector("#confirm-password");
  const confirmation = confirmPassword.value;

  if (password != confirmation) {
    confirmPassword.setCustomValidity("Les contrasenyes no coincideixen.");
    confirmPassword.reportValidity();
    return;
  }

  const url = document.querySelector("#url").value;
  const useRandomIv = document.querySelector("#iv").checked;
  const useRandomSalt = document.querySelector("#salt").checked;
  const hint = document.querySelector("#hint").value;

  const encrypted = await generateFragment(
    url,
    password,
    hint,
    useRandomSalt,
    useRandomIv
  );

  // Generació automàtica del domini actual
  const baseUrl = window.location.origin + "/Links-Protegits/";
  const output = `${baseUrl}#${encrypted}`;

  document.querySelector("#output").value = output;
  highlight("output");

  // Ajusta enllaç del marcador ocult
  document.querySelector("#bookmark").href =
    `${baseUrl}hidden/#${encrypted}`;

  // Ajusta enllaç d’obertura directa
  document.querySelector("#open").href = output;

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
}


// Quan es prem el botó "Copia"
function onCopy(id) {
  const output = highlight(id);
  document.execCommand("copy");

  const alertArea = document.querySelector(".alert");
  alertArea.innerText = `S'han copiat ${output.value.length} caràcters.`;
  alertArea.style.opacity = "1";

  setTimeout(() => {
    alertArea.style.opacity = 0;
  }, 3000);

  output.selectionEnd = output.selectionStart;
  output.blur();
}


// Avís si es desactiva la randomització de l'IV
function onIvCheck(checkbox) {
  if (!checkbox.checked) {
    checkbox.checked = !confirm(
      "Només desactiveu la generació aleatòria del vector d'inicialització " +
      "si teniu coneixements tècnics suficients. Aquesta acció redueix la " +
      "seguretat de l'enllaç protegit i només escurça lleugerament la seva longitud.\n\n" +
      "Premeu «Cancel·la» si no n'esteu completament segurs."
    );
  }
}
