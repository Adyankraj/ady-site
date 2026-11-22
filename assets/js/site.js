/* Ady Ankraj : apparition de la signature, langue FR/EN, formulaire « être prévenu·e ». */
/* ---------- Entrée de la signature ---------- */
(function () {
  if (
    !(
      window.matchMedia &&
      matchMedia("(prefers-reduced-motion: no-preference)").matches
    )
  )
    return;
  var img = document.querySelector("header img");
  if (!img) return;
  var r = img.getBoundingClientRect();
  var dx = window.innerWidth / 2 - (r.left + r.width / 2),
    dy = window.innerHeight / 2 - (r.top + r.height / 2);
  var root = document.documentElement;
  root.style.setProperty("--dx", Math.round(dx) + "px");
  root.style.setProperty("--dy", Math.round(dy) + "px");
  root.classList.add("intro");
  window.__introStart = performance.now();
})();

/* ---------- Langue : celle de l'appareil, ou le choix FR/EN du visiteur ---------- */
var T = {
  en: {
    title: "The shop opens soon.",
    lede: "Original paintings and limited prints. Leave your details and be the first to know when the doors open.",
    email: "Email",
    emailPh: "you@email.com",
    phone: "Phone",
    optional: "(optional)",
    consent:
      "By signing up, you agree to receive news from Ady Ankraj about the opening and new works. Unsubscribe anytime.",
    cta: "Be notified",
    invite: "Be notified",
    sms: "Also by text message",
    thanks: "You'll be notified.",
    docTitle: "Ady Ankraj · Original paintings and limited prints",
    metaDesc:
      "Ady Ankraj is a painter. The shop for original paintings and limited prints opens soon: leave your email to be told first.",
    demo: "Preview: nothing is sent yet.",
    errEmail: "Please check your email address, for example name@example.com.",
    errPhone:
      "The phone number can only contain digits. You can also leave it empty.",
  },
  fr: {
    title: "La boutique ouvre bientôt.",
    lede: "Toiles originales et tirages limités. Laissez vos coordonnées pour être prévenu·e en premier de l'ouverture.",
    email: "E-mail",
    emailPh: "vous@email.com",
    phone: "Téléphone",
    optional: "(facultatif)",
    consent:
      "En vous inscrivant, vous acceptez de recevoir des nouvelles d'Ady Ankraj sur l'ouverture et les nouvelles œuvres. Désinscription possible à tout moment.",
    cta: "Être prévenu·e",
    invite: "Être prévenu·e",
    sms: "Aussi par SMS",
    thanks: "Vous serez prévenu·e.",
    docTitle: "Ady Ankraj · Toiles originales et tirages limités",
    metaDesc:
      "Ady Ankraj est peintre. La boutique de toiles originales et de tirages limités ouvre bientôt : laissez votre e-mail pour être prévenu·e en premier.",
    demo: "Aperçu : rien n'est envoyé pour l'instant.",
    errEmail: "Vérifiez votre adresse e-mail, par exemple nom@exemple.com.",
    errPhone:
      "Le numéro ne doit contenir que des chiffres. Vous pouvez aussi le laisser vide.",
  },
};
var LANG = "en";
function t(k) {
  return (T[LANG] && T[LANG][k]) || T.en[k];
}
function applyLang(l) {
  LANG = l;
  document.documentElement.lang = l;
  document.title = t("docTitle");
  var md = document.querySelector("meta[name=description]");
  if (md) md.setAttribute("content", t("metaDesc"));
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
    el.placeholder = t(el.dataset.i18nPh);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
    el.setAttribute("aria-label", t(el.dataset.i18nAria));
  });
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.setAttribute("aria-pressed", String(b.dataset.lang === l));
  });
  var e = document.getElementById("err");
  if (e) e.textContent = "";
}
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem("ady-lang");
  } catch (x) {}
  var dev =
    (navigator.languages && navigator.languages[0]) ||
    navigator.language ||
    "en";
  applyLang(
    saved === "fr" || saved === "en" ? saved : /^fr/i.test(dev) ? "fr" : "en",
  );
  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () {
      applyLang(b.dataset.lang);
      try {
        localStorage.setItem("ady-lang", b.dataset.lang);
      } catch (x) {}
    });
  });
})();

/* ---------- Formulaire ---------- */
(function () {
  var form = document.getElementById("form"),
    err = document.getElementById("err");
  var email = document.getElementById("email"),
    phone = document.getElementById("phone");
  var cc = document.getElementById("cc");
  var orb = form.querySelector(".orb"),
    smsT = document.getElementById("smsToggle"),
    smsB = document.getElementById("smsBox");
  smsT.addEventListener("click", function () {
    var open = !smsB.classList.contains("is-open");
    smsB.classList.toggle("is-open", open);
    smsT.setAttribute("aria-expanded", String(open));
    phone.tabIndex = open ? 0 : -1;
    cc.tabIndex = open ? 0 : -1;
    if (open)
      setTimeout(function () {
        phone.focus();
      }, 200);
  });
  cc.tabIndex = -1;

  /* Envoi : Netlify Forms (formulaire « ouverture »). Les inscriptions arrivent dans Netlify > Forms.
     Hors du site en ligne (fichier ouvert sur l'ordinateur), rien n'est envoyé : mode aperçu. */
  var LIVE = /(^|\.)adyankraj\.(com|fr)$|\.netlify\.app$/.test(
    location.hostname,
  );
  var demoLine = document.querySelector(".demo");
  if (LIVE && demoLine) demoLine.hidden = true;
  function sendSignup(data) {
    if (!LIVE) return Promise.resolve(data);
    var body = new URLSearchParams({
      "form-name": "ouverture",
      email: data.email,
      phone: data.phone || "",
      langue: LANG,
      "bot-field": "",
    });
    return fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return data;
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    err.textContent = "";
    var mail = email.value.trim(),
      tel = phone.value.replace(/[\s.\-()]/g, "").replace(/^0/, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      err.textContent = t("errEmail");
      email.focus();
      return;
    }
    if (tel && !/^\d{6,15}$/.test(tel)) {
      err.textContent = t("errPhone");
      phone.focus();
      return;
    }
    orb.classList.add("is-busy");
    orb.disabled = true;
    sendSignup({
      email: mail,
      phone: tel ? cc.value + " " + tel : null,
      consent: true,
      date: new Date().toISOString(),
    })
      .then(function () {
        orb.classList.remove("is-busy");
        orb.disabled = false;
        form.classList.add("is-sent");
        email.blur();
        email.readOnly = true;
        orb.disabled = true;
        email.tabIndex = -1;
        orb.tabIndex = -1;
      })
      .catch(function () {
        orb.classList.remove("is-busy");
        orb.disabled = false;
        err.textContent =
          LANG === "fr"
            ? "Oups, l'envoi n'a pas marché. Réessayez dans un instant."
            : "Something went wrong. Please try again in a moment.";
      });
  });
})();
