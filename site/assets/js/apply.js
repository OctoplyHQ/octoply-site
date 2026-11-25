/* Job application form.
 *
 * The form is a Netlify Form (name="application"). Without this script the
 * browser's own checks run and the form posts normally; Netlify then shows
 * /thanks/. With it, applicants get written error messages next to each field,
 * a drag-and-drop CV box, and the form is sent in the background so they stay
 * on the page and see a confirmation.
 *
 * Submissions, including the CV, appear in Netlify under Forms → application.
 * Netlify accepts up to 8 MB per submission, so the CV is capped a little lower.
 */
(() => {
  const form = document.querySelector("[data-apply]");
  if (!form) return;
  form.noValidate = true; // this script does the checking and shows its own messages

  const MAX_BYTES = 7.5 * 1024 * 1024;
  const OK_TYPES = ["pdf", "doc", "docx", "odt", "rtf", "txt"];
  const TIMEOUT_MS = 90 * 1000;
  const $ = (sel) => form.querySelector(sel);
  const status = $("[data-status]");
  const submit = $("[data-submit]");
  const drop = $("[data-drop]");
  const fileInput = drop.querySelector("input[type=file]");
  const dropLabel = $("[data-drop-label]");
  // Kept as nodes rather than HTML, so no innerHTML is needed.
  const dropLabelDefault = [...dropLabel.childNodes].map((n) => n.cloneNode(true));
  const certify = $('[name="certify"]');
  const roleBoxes = [...form.querySelectorAll('input[name="roles[]"]')];
  const textFields = [...form.querySelectorAll('input[required]:not([type="checkbox"]):not([type="file"])')];

  /* Every check has a message element that is linked to its field(s), so
     screen readers read the message when the field is focused. */
  const messageFor = (name, fields) => {
    let el = form.querySelector(`[data-error="${name}"]`);
    if (!el) {
      el = document.createElement("span");
      el.className = "field-error";
      el.dataset.error = name;
      fields[0].closest("label").append(el);
    }
    el.id = `apply-error-${name}`;
    fields.forEach((f) => f.setAttribute("aria-describedby", el.id));
    return el;
  };
  const checks = [];
  const addCheck = (name, fields, test) => {
    const el = messageFor(name, fields);
    const run = () => {
      const msg = test();
      el.textContent = msg;
      fields.forEach((f) => {
        f.setAttribute("aria-invalid", String(Boolean(msg)));
        if (f.type !== "checkbox") f.classList.toggle("invalid", Boolean(msg));
      });
      return msg ? fields[0] : null;
    };
    checks.push(run);
    return run;
  };

  const MESSAGES = {
    first_name: "Please enter your first name.",
    surname: "Please enter your surname.",
    email: "Please enter an email address we can reply to.",
    phone: "Please enter a phone number.",
  };
  const checkRoles = addCheck("roles", roleBoxes, () =>
    roleBoxes.some((c) => c.checked) ? "" : "Choose at least one role.");
  textFields.forEach((input) => {
    const run = addCheck(input.name, [input], () =>
      input.checkValidity() ? "" : (MESSAGES[input.name] || "Please fill this in."));
    input.addEventListener("blur", () => { if (input.value) run(); });
    input.addEventListener("input", () => { if (input.getAttribute("aria-invalid") === "true") run(); });
  });
  const checkFile = addCheck("cv", [fileInput], () => {
    const files = fileInput.files;
    if (!files.length) return "Please attach your CV.";
    if (files.length > 1) return "Please attach just one file.";
    const f = files[0];
    if (!OK_TYPES.includes(f.name.split(".").pop().toLowerCase())) return "Please use a PDF, Word, ODT, RTF or text file.";
    if (f.size > MAX_BYTES) return "That file is over 7.5 MB. Please attach a smaller version.";
    return "";
  });
  const checkCertify = addCheck("certify", [certify], () =>
    certify.checked ? "" : "Please confirm your CV is accurate.");

  roleBoxes.forEach((c) => c.addEventListener("change", checkRoles));
  certify.addEventListener("change", checkCertify);

  /* CV drop zone */
  const describeFile = () => {
    const f = fileInput.files[0];
    drop.classList.toggle("has-file", Boolean(f));
    if (f) dropLabel.textContent = `${f.name} (${(f.size / 1024 / 1024).toFixed(1)} MB)`;
    else dropLabel.replaceChildren(...dropLabelDefault.map((n) => n.cloneNode(true)));
    checkFile();
  };
  ["dragenter", "dragover"].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((ev) => drop.addEventListener(ev, () => drop.classList.remove("dragging")));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; describeFile(); }
  });
  fileInput.addEventListener("change", describeFile);

  /* Submit */
  const reset = () => { submit.disabled = false; submit.textContent = "Send application"; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    const firstInvalid = checks.map((run) => run()).find(Boolean);
    if (firstInvalid) {
      firstInvalid.focus(); // the browser scrolls it into view
      status.textContent = "Please check the fields marked in red.";
      return;
    }
    submit.disabled = true;
    submit.textContent = "Sending…";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch("/", { method: "POST", body: new FormData(form), signal: ctrl.signal });
      if (!res.ok) throw new Error(String(res.status));
      [...form.children].forEach((c) => { if (!c.matches("[data-done]")) c.hidden = true; });
      const done = $("[data-done]");
      done.hidden = false;
      done.focus();
    } catch (err) {
      status.textContent = err.name === "AbortError"
        ? "This is taking too long. Please check your connection and try again."
        : "Sorry, your application didn't send. Please try again, or call us on 020 7582 1066 if it keeps happening.";
      reset();
    } finally {
      clearTimeout(timer);
    }
  });
})();
