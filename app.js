(function () {
  "use strict";

  // ================= Yardımcılar =================
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function nowLabel() {
    return new Date().toLocaleString("tr-TR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text || "";
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) { /* yoksay */ }
    document.body.removeChild(ta);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text || "").catch(function () {
        fallbackCopy(text);
      });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }

  function emptyState(wrap, text) {
    if (wrap.children.length === 0) {
      const p = document.createElement("p");
      p.className = "empty-state";
      p.textContent = text;
      wrap.appendChild(p);
    }
  }

  // ================= Varsayılan veriler =================
  function defaultKanallar() {
    return [
      { id: uid(), ad: "LinkedIn", url: "https://www.linkedin.com" },
      { id: uid(), ad: "Kariyer.net", url: "https://www.kariyer.net" }
    ];
  }
  function defaultCVler() {
    return [
      { id: uid(), ad: "Genel CV", icerik: "", coverLetter: "", updated: "" },
      { id: uid(), ad: "QA Tester CV", icerik: "", coverLetter: "", updated: "" },
      { id: uid(), ad: "GSE Engineer CV", icerik: "", coverLetter: "", updated: "" },
      { id: uid(), ad: "AI Engineer CV (Portfolyo Gerekli)", icerik: "", coverLetter: "", updated: "" },
      { id: uid(), ad: "Turkish Language CV", icerik: "", coverLetter: "", updated: "" },
      { id: uid(), ad: "CRO Designer CV", icerik: "", coverLetter: "", updated: "" }
    ];
  }
  function defaultDonusAlinanlar() {
    return [
      { id: uid(), firma: "micro1", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
      { id: uid(), firma: "Odoo", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
      { id: uid(), firma: "Alignerr", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
      { id: uid(), firma: "Emirates", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
      { id: uid(), firma: "Ryanair", pozisyon: "", durum: "mulakat", notlar: "", updated: "" }
    ];
  }
  function defaultHalaBeklenenler() { return []; }
  function defaultFikirler() {
    return [
      { id: uid(), ad: "Dropshipping", asama: "arastirma", notlar: "", sonrakiAdim: "", checklist: [], updated: "" },
      { id: uid(), ad: "Yayın Açma", asama: "fikir", notlar: "", sonrakiAdim: "", checklist: [], updated: "" },
      { id: uid(), ad: "PCB/Elektronik Kart Üretim", asama: "fikir", notlar: "", sonrakiAdim: "", checklist: [], updated: "" }
    ];
  }
  function defaultHobiler() {
    return [
      { id: uid(), ad: "PCB Tasarım", seviye: "orta", kaynaklar: "", log: [] },
      { id: uid(), ad: "3D Çizim", seviye: "baslangic", kaynaklar: "", log: [] },
      { id: uid(), ad: "İngilizce", seviye: "orta", kaynaklar: "", log: [] },
      { id: uid(), ad: "Python", seviye: "baslangic", kaynaklar: "", log: [] },
      { id: uid(), ad: "HTML/CSS/Java", seviye: "baslangic", kaynaklar: "", log: [] }
    ];
  }

  // ================= Durum (her bölüm bağımsız) =================
  let kanallar = [];
  let cvler = [];
  let donusAlinanlar = [];
  let halaBeklenenler = [];
  let fikirler = [];
  let hobiler = [];

  // ================= Firebase (bölüm bazlı senkron) =================
  let db = null;
  const refs = {};
  const saveTimers = {};

  function firebaseHazirMi() {
    return typeof firebaseConfig !== "undefined" && firebaseConfig.apiKey && firebaseConfig.databaseURL;
  }

  function setBanner(text, cls) {
    const banner = document.getElementById("syncBanner");
    if (!banner) return;
    banner.textContent = text;
    banner.className = "sync-banner show " + cls;
  }

  function setStatus(text) {
    const el = document.getElementById("saveStatus");
    if (el) el.textContent = text;
  }

  function rootPath() {
    return (typeof DB_ROOT_PATH !== "undefined" && DB_ROOT_PATH) ? DB_ROOT_PATH : "takip-sitesi";
  }

  function initFirebaseApp() {
    if (!firebaseHazirMi()) {
      setBanner(
        "Firebase bağlantısı kurulmadı — veriler sadece bu sekmede, sayfa açık kaldığı sürece tutuluyor. Kalıcı/senkron kayıt için firebase-config.js dosyasını doldur.",
        "warn"
      );
      return false;
    }
    try {
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.database();
      setBanner("Firebase'e bağlı — değişiklikler otomatik kaydediliyor.", "ok");
      return true;
    } catch (e) {
      setBanner("Firebase başlatılamadı: " + e.message, "warn");
      return false;
    }
  }

  // Bir alt yolu dinle; veri yoksa varsayılanla doldurup yaz
  function bindSection(path, defaultsFn, onData) {
    if (!db) {
      onData(defaultsFn());
      return;
    }
    const ref = db.ref(rootPath() + "/" + path);
    refs[path] = ref;
    ref.on(
      "value",
      function (snap) {
        const data = snap.val();
        if (data) {
          onData(data);
        } else {
          const def = defaultsFn();
          ref.set(def);
          onData(def);
        }
      },
      function (err) {
        setBanner("Firebase bağlantı hatası: " + err.message, "warn");
      }
    );
  }

  function saveSection(path, data) {
    if (refs[path]) {
      setStatus("Kaydediliyor...");
      refs[path]
        .set(data)
        .then(function () { setStatus("Kaydedildi (Firebase) · " + nowLabel()); })
        .catch(function (err) { setStatus("Kayıt hatası: " + err.message); });
    } else {
      setStatus("Bu sekmede tutuluyor (kalıcı değil) · " + nowLabel());
    }
  }

  function queueSave(path, getData) {
    clearTimeout(saveTimers[path]);
    setStatus("Yazılıyor...");
    saveTimers[path] = setTimeout(function () { saveSection(path, getData()); }, 700);
  }

  function touch(obj, labelEl, path, getData) {
    obj.updated = nowLabel();
    if (labelEl) labelEl.textContent = "Son güncelleme: " + obj.updated;
    queueSave(path, getData);
  }

  // ================= Render: Başvuru Kanalları =================
  function renderKanallar() {
    const wrap = document.getElementById("kanallarList");
    if (!wrap) return;
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-channel");
    kanallar.forEach(function (k) {
      const node = tpl.content.cloneNode(true);
      const linkEl = node.querySelector(".link");
      const plainEl = node.querySelector(".plain");
      if (k.url) {
        linkEl.textContent = k.ad;
        linkEl.href = k.url;
        plainEl.remove();
      } else {
        plainEl.textContent = k.ad;
        linkEl.remove();
      }
      node.querySelector(".del-btn").addEventListener("click", function () {
        kanallar = kanallar.filter(function (x) { return x.id !== k.id; });
        saveSection("kanallar", kanallar);
        renderKanallar();
      });
      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz kanal eklenmedi.");
  }

  // ================= Render: Güncel CV'ler =================
  function renderCVler() {
    const wrap = document.getElementById("cvList");
    if (!wrap) return;
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-cv");
    cvler.forEach(function (cv) {
      const node = tpl.content.cloneNode(true);
      const nameField = node.querySelector(".cv-name-field");
      const contentField = node.querySelector(".cv-content-field");
      const coverField = node.querySelector(".cover-letter-field");
      const updLabel = node.querySelector(".updated-label");
      const getData = function () { return cvler; };

      nameField.value = cv.ad || "";
      contentField.value = cv.icerik || "";
      coverField.value = cv.coverLetter || "";
      updLabel.textContent = cv.updated ? "Son güncelleme: " + cv.updated : "Henüz güncellenmedi";

      nameField.addEventListener("input", function (e) { cv.ad = e.target.value; touch(cv, updLabel, "cvler", getData); });
      contentField.addEventListener("input", function (e) { cv.icerik = e.target.value; touch(cv, updLabel, "cvler", getData); });
      coverField.addEventListener("input", function (e) { cv.coverLetter = e.target.value; touch(cv, updLabel, "cvler", getData); });

      const copyBtn = node.querySelector(".copy-btn");
      copyBtn.addEventListener("click", function () {
        copyText(cv.coverLetter).then(function () {
          const original = copyBtn.textContent;
          copyBtn.textContent = "Kopyalandı!";
          setTimeout(function () { copyBtn.textContent = original; }, 1500);
        });
      });

      node.querySelector(".del-btn").addEventListener("click", function () {
        if (!confirm("\"" + cv.ad + "\" adlı CV'yi silmek istediğine emin misin?")) return;
        cvler = cvler.filter(function (x) { return x.id !== cv.id; });
        saveSection("cvler", cvler);
        renderCVler();
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz CV eklenmedi.");
  }

  // ================= Render: İş başvuruları (ortak) =================
  function renderJobs(list, containerId, sectionPath, setList) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-job");
    list.forEach(function (job) {
      const node = tpl.content.cloneNode(true);
      const companyField = node.querySelector(".company-field");
      const positionField = node.querySelector(".position-field");
      const statusField = node.querySelector(".status-field");
      const notesField = node.querySelector(".notes-field");
      const updLabel = node.querySelector(".updated-label");
      const getData = function () { return list; };

      companyField.value = job.firma || "";
      positionField.value = job.pozisyon || "";
      statusField.value = job.durum || "beklemede";
      notesField.value = job.notlar || "";
      updLabel.textContent = job.updated ? "Son güncelleme: " + job.updated : "";

      companyField.addEventListener("input", function (e) { job.firma = e.target.value; touch(job, updLabel, sectionPath, getData); });
      positionField.addEventListener("input", function (e) { job.pozisyon = e.target.value; touch(job, updLabel, sectionPath, getData); });
      statusField.addEventListener("change", function (e) { job.durum = e.target.value; touch(job, updLabel, sectionPath, getData); });
      notesField.addEventListener("input", function (e) { job.notlar = e.target.value; touch(job, updLabel, sectionPath, getData); });

      node.querySelector(".del-btn").addEventListener("click", function () {
        const idx = list.indexOf(job);
        if (idx > -1) list.splice(idx, 1);
        saveSection(sectionPath, list);
        renderJobs(list, containerId, sectionPath, setList);
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz kayıt yok.");
  }

  // ================= Render: İş kurma fikirleri =================
  function renderFikirler() {
    const wrap = document.getElementById("fikirList");
    if (!wrap) return;
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-idea");
    fikirler.forEach(function (f) {
      const node = tpl.content.cloneNode(true);
      const nameField = node.querySelector(".idea-name-field");
      const stageField = node.querySelector(".stage-field");
      const notesField = node.querySelector(".idea-notes-field");
      const nextField = node.querySelector(".idea-next-field");
      const updLabel = node.querySelector(".updated-label");
      const getData = function () { return fikirler; };

      nameField.value = f.ad || "";
      stageField.value = f.asama || "fikir";
      notesField.value = f.notlar || "";
      nextField.value = f.sonrakiAdim || "";
      updLabel.textContent = f.updated ? "Son güncelleme: " + f.updated : "";

      nameField.addEventListener("input", function (e) { f.ad = e.target.value; touch(f, updLabel, "fikirler", getData); });
      stageField.addEventListener("change", function (e) { f.asama = e.target.value; touch(f, updLabel, "fikirler", getData); });
      notesField.addEventListener("input", function (e) { f.notlar = e.target.value; touch(f, updLabel, "fikirler", getData); });
      nextField.addEventListener("input", function (e) { f.sonrakiAdim = e.target.value; touch(f, updLabel, "fikirler", getData); });

      node.querySelector(".del-btn").addEventListener("click", function () {
        if (!confirm("\"" + f.ad + "\" fikrini silmek istediğine emin misin?")) return;
        fikirler = fikirler.filter(function (x) { return x.id !== f.id; });
        saveSection("fikirler", fikirler);
        renderFikirler();
      });

      const checklistWrap = node.querySelector(".checklist");
      f.checklist = f.checklist || [];
      function renderChecklist() {
        checklistWrap.innerHTML = "";
        const itemTpl = document.getElementById("tpl-checklist-item");
        f.checklist.forEach(function (item) {
          const itemNode = itemTpl.content.cloneNode(true);
          const label = itemNode.querySelector(".checklist-item");
          const check = itemNode.querySelector(".checklist-check");
          const text = itemNode.querySelector(".checklist-text");
          check.checked = !!item.done;
          text.textContent = item.text;
          if (item.done) label.classList.add("done");
          check.addEventListener("change", function () {
            item.done = check.checked;
            label.classList.toggle("done", item.done);
            saveSection("fikirler", fikirler);
          });
          itemNode.querySelector(".del-btn-small").addEventListener("click", function () {
            f.checklist = f.checklist.filter(function (x) { return x !== item; });
            saveSection("fikirler", fikirler);
            renderChecklist();
          });
          checklistWrap.appendChild(itemNode);
        });
      }
      renderChecklist();

      const checklistInput = node.querySelector(".checklist-input");
      node.querySelector(".checklist-form").addEventListener("submit", function (e) {
        e.preventDefault();
        const val = checklistInput.value.trim();
        if (!val) return;
        f.checklist.push({ text: val, done: false });
        checklistInput.value = "";
        saveSection("fikirler", fikirler);
        renderChecklist();
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz fikir eklenmedi.");
  }

  // ================= Render: Hobiler =================
  function renderHobiler() {
    const wrap = document.getElementById("hobiList");
    if (!wrap) return;
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-hobby");
    hobiler.forEach(function (h) {
      const node = tpl.content.cloneNode(true);
      const nameField = node.querySelector(".hobby-name-field");
      const levelField = node.querySelector(".level-field");
      const resourcesField = node.querySelector(".hobby-resources-field");

      nameField.value = h.ad || "";
      levelField.value = h.seviye || "baslangic";
      resourcesField.value = h.kaynaklar || "";

      nameField.addEventListener("input", function (e) { h.ad = e.target.value; queueSave("hobiler", function () { return hobiler; }); });
      levelField.addEventListener("change", function (e) { h.seviye = e.target.value; queueSave("hobiler", function () { return hobiler; }); });
      resourcesField.addEventListener("input", function (e) { h.kaynaklar = e.target.value; queueSave("hobiler", function () { return hobiler; }); });

      node.querySelector(".del-btn").addEventListener("click", function () {
        if (!confirm("\"" + h.ad + "\" hobisini silmek istediğine emin misin?")) return;
        hobiler = hobiler.filter(function (x) { return x.id !== h.id; });
        saveSection("hobiler", hobiler);
        renderHobiler();
      });

      const logWrap = node.querySelector(".log-list");
      h.log = h.log || [];
      function renderLog() {
        logWrap.innerHTML = "";
        const itemTpl = document.getElementById("tpl-log-item");
        h.log.slice().reverse().forEach(function (entry) {
          const itemNode = itemTpl.content.cloneNode(true);
          itemNode.querySelector(".log-date").textContent = entry.tarih;
          itemNode.querySelector(".log-text").textContent = entry.not;
          itemNode.querySelector(".del-btn-small").addEventListener("click", function () {
            h.log = h.log.filter(function (x) { return x !== entry; });
            saveSection("hobiler", hobiler);
            renderLog();
          });
          logWrap.appendChild(itemNode);
        });
        emptyState(logWrap, "Henüz kayıt yok.");
      }
      renderLog();

      const logInput = node.querySelector(".log-input");
      node.querySelector(".log-form").addEventListener("submit", function (e) {
        e.preventDefault();
        const val = logInput.value.trim();
        if (!val) return;
        h.log.push({ tarih: nowLabel(), not: val });
        logInput.value = "";
        saveSection("hobiler", hobiler);
        renderLog();
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz hobi eklenmedi.");
  }

  // ================= Üst seviye ekleme formları =================
  function attachTopForms() {
    const kanalForm = document.getElementById("kanalForm");
    if (kanalForm) {
      kanalForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const ad = document.getElementById("kanalAd").value.trim();
        const url = document.getElementById("kanalUrl").value.trim();
        if (!ad) return;
        kanallar.push({ id: uid(), ad: ad, url: url });
        e.target.reset();
        saveSection("kanallar", kanallar);
        renderKanallar();
      });
    }

    const cvForm = document.getElementById("cvForm");
    if (cvForm) {
      cvForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const ad = document.getElementById("cvAd").value.trim();
        if (!ad) return;
        cvler.push({ id: uid(), ad: ad, icerik: "", coverLetter: "", updated: "" });
        e.target.reset();
        saveSection("cvler", cvler);
        renderCVler();
      });
    }

    const donusForm = document.getElementById("donusAlinanForm");
    if (donusForm) {
      donusForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const firma = document.getElementById("donusFirma").value.trim();
        const pozisyon = document.getElementById("donusPozisyon").value.trim();
        if (!firma) return;
        donusAlinanlar.push({ id: uid(), firma: firma, pozisyon: pozisyon, durum: "mulakat", notlar: "", updated: "" });
        e.target.reset();
        saveSection("donusAlinanlar", donusAlinanlar);
        renderJobs(donusAlinanlar, "donusAlinanlarList", "donusAlinanlar");
      });
    }

    const bekleyenForm = document.getElementById("bekleyenForm");
    if (bekleyenForm) {
      bekleyenForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const firma = document.getElementById("bekleyenFirma").value.trim();
        const pozisyon = document.getElementById("bekleyenPozisyon").value.trim();
        if (!firma) return;
        halaBeklenenler.push({ id: uid(), firma: firma, pozisyon: pozisyon, durum: "beklemede", notlar: "", updated: "" });
        e.target.reset();
        saveSection("halaBeklenenler", halaBeklenenler);
        renderJobs(halaBeklenenler, "halaBeklenenlerList", "halaBeklenenler");
      });
    }

    const fikirForm = document.getElementById("fikirForm");
    if (fikirForm) {
      fikirForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const ad = document.getElementById("fikirAd").value.trim();
        if (!ad) return;
        fikirler.push({ id: uid(), ad: ad, asama: "fikir", notlar: "", sonrakiAdim: "", checklist: [], updated: "" });
        e.target.reset();
        saveSection("fikirler", fikirler);
        renderFikirler();
      });
    }

    const hobiForm = document.getElementById("hobiForm");
    if (hobiForm) {
      hobiForm.addEventListener("submit", function (e) {
        e.preventDefault();
        const ad = document.getElementById("hobiAd").value.trim();
        if (!ad) return;
        hobiler.push({ id: uid(), ad: ad, seviye: "baslangic", kaynaklar: "", log: [] });
        e.target.reset();
        saveSection("hobiler", hobiler);
        renderHobiler();
      });
    }
  }

  // ================= Başlangıç =================
  function init() {
    attachTopForms();
    initFirebaseApp();

    if (document.getElementById("kanallarList")) {
      bindSection("kanallar", defaultKanallar, function (data) { kanallar = data; renderKanallar(); });
    }
    if (document.getElementById("cvList")) {
      bindSection("cvler", defaultCVler, function (data) { cvler = data; renderCVler(); });
    }
    if (document.getElementById("donusAlinanlarList")) {
      bindSection("donusAlinanlar", defaultDonusAlinanlar, function (data) {
        donusAlinanlar = data;
        renderJobs(donusAlinanlar, "donusAlinanlarList", "donusAlinanlar");
      });
    }
    if (document.getElementById("halaBeklenenlerList")) {
      bindSection("halaBeklenenler", defaultHalaBeklenenler, function (data) {
        halaBeklenenler = data;
        renderJobs(halaBeklenenler, "halaBeklenenlerList", "halaBeklenenler");
      });
    }
    if (document.getElementById("fikirList")) {
      bindSection("fikirler", defaultFikirler, function (data) { fikirler = data; renderFikirler(); });
    }
    if (document.getElementById("hobiList")) {
      bindSection("hobiler", defaultHobiler, function (data) { hobiler = data; renderHobiler(); });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
