(function () {
  "use strict";

  // ---------- Yardımcılar ----------
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

  // ---------- Varsayılan veri ----------
  function defaultState() {
    return {
      kanallar: [
        { id: uid(), ad: "LinkedIn", url: "https://www.linkedin.com" },
        { id: uid(), ad: "Kariyer.net", url: "https://www.kariyer.net" }
      ],
      cvler: [
        { id: uid(), ad: "Genel CV", icerik: "", coverLetter: "", updated: "" },
        { id: uid(), ad: "QA Tester CV", icerik: "", coverLetter: "", updated: "" },
        { id: uid(), ad: "GSE Engineer CV", icerik: "", coverLetter: "", updated: "" },
        { id: uid(), ad: "AI Engineer CV (Portfolyo Gerekli)", icerik: "", coverLetter: "", updated: "" },
        { id: uid(), ad: "Turkish Language CV", icerik: "", coverLetter: "", updated: "" },
        { id: uid(), ad: "CRO Designer CV", icerik: "", coverLetter: "", updated: "" }
      ],
      donusAlinanlar: [
        { id: uid(), firma: "micro1", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
        { id: uid(), firma: "Odoo", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
        { id: uid(), firma: "Alignerr", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
        { id: uid(), firma: "Emirates", pozisyon: "", durum: "mulakat", notlar: "", updated: "" },
        { id: uid(), firma: "Ryanair", pozisyon: "", durum: "mulakat", notlar: "", updated: "" }
      ],
      halaBeklenenler: [],
      fikirler: [
        { id: uid(), ad: "Dropshipping", asama: "arastirma", notlar: "", sonrakiAdim: "", checklist: [], updated: "" },
        { id: uid(), ad: "Yayın Açma", asama: "fikir", notlar: "", sonrakiAdim: "", checklist: [], updated: "" },
        { id: uid(), ad: "PCB/Elektronik Kart Üretim", asama: "fikir", notlar: "", sonrakiAdim: "", checklist: [], updated: "" }
      ],
      hobiler: [
        { id: uid(), ad: "PCB Tasarım", seviye: "orta", kaynaklar: "", log: [] },
        { id: uid(), ad: "3D Çizim", seviye: "baslangic", kaynaklar: "", log: [] },
        { id: uid(), ad: "İngilizce", seviye: "orta", kaynaklar: "", log: [] },
        { id: uid(), ad: "Python", seviye: "baslangic", kaynaklar: "", log: [] },
        { id: uid(), ad: "HTML/CSS/Java", seviye: "baslangic", kaynaklar: "", log: [] }
      ]
    };
  }

  let state = defaultState();
  let firebaseRef = null;
  let saveTimer = null;

  function firebaseHazirMi() {
    return typeof firebaseConfig !== "undefined" && firebaseConfig.apiKey && firebaseConfig.databaseURL;
  }

  function setBanner(text, cls) {
    const banner = document.getElementById("syncBanner");
    banner.textContent = text;
    banner.className = "sync-banner show " + cls;
  }

  function setStatus(text) {
    document.getElementById("saveStatus").textContent = text;
  }

  function initFirebase() {
    if (!firebaseHazirMi()) {
      setBanner(
        "Firebase bağlantısı kurulmadı — veriler sadece bu sekmede, sayfa açık kaldığı sürece tutuluyor. Kalıcı/senkron kayıt için firebase-config.js dosyasını doldur.",
        "warn"
      );
      return;
    }
    try {
      firebase.initializeApp(firebaseConfig);
      const db = firebase.database();
      firebaseRef = db.ref(typeof DB_ROOT_PATH !== "undefined" && DB_ROOT_PATH ? DB_ROOT_PATH : "takip-sitesi");
      firebaseRef.on(
        "value",
        function (snap) {
          const data = snap.val();
          if (data) {
            state = data;
          } else {
            firebaseRef.set(state);
          }
          setBanner("Firebase'e bağlı — değişiklikler otomatik kaydediliyor.", "ok");
          render();
        },
        function (err) {
          setBanner("Firebase bağlantı hatası: " + err.message, "warn");
        }
      );
    } catch (e) {
      setBanner("Firebase başlatılamadı: " + e.message, "warn");
    }
  }

  function saveState() {
    if (firebaseRef) {
      setStatus("Kaydediliyor...");
      firebaseRef
        .set(state)
        .then(function () { setStatus("Kaydedildi (Firebase) · " + nowLabel()); })
        .catch(function (err) { setStatus("Kayıt hatası: " + err.message); });
    } else {
      setStatus("Bu sekmede tutuluyor (kalıcı değil) · " + nowLabel());
    }
  }

  function queueSave() {
    clearTimeout(saveTimer);
    setStatus("Yazılıyor...");
    saveTimer = setTimeout(saveState, 700);
  }

  function touch(obj, labelEl) {
    obj.updated = nowLabel();
    if (labelEl) labelEl.textContent = "Son güncelleme: " + obj.updated;
    queueSave();
  }

  // ---------- Render: Başvuru Kanalları ----------
  function renderKanallar() {
    const wrap = document.getElementById("kanallarList");
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-channel");
    state.kanallar.forEach(function (k) {
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
        state.kanallar = state.kanallar.filter(function (x) { return x.id !== k.id; });
        saveState();
        renderKanallar();
      });
      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz kanal eklenmedi.");
  }

  // ---------- Render: Güncel CV'ler ----------
  function renderCVler() {
    const wrap = document.getElementById("cvList");
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-cv");
    state.cvler.forEach(function (cv) {
      const node = tpl.content.cloneNode(true);
      const nameField = node.querySelector(".cv-name-field");
      const contentField = node.querySelector(".cv-content-field");
      const coverField = node.querySelector(".cover-letter-field");
      const updLabel = node.querySelector(".updated-label");

      nameField.value = cv.ad || "";
      contentField.value = cv.icerik || "";
      coverField.value = cv.coverLetter || "";
      updLabel.textContent = cv.updated ? "Son güncelleme: " + cv.updated : "Henüz güncellenmedi";

      nameField.addEventListener("input", function (e) { cv.ad = e.target.value; touch(cv, updLabel); });
      contentField.addEventListener("input", function (e) { cv.icerik = e.target.value; touch(cv, updLabel); });
      coverField.addEventListener("input", function (e) { cv.coverLetter = e.target.value; touch(cv, updLabel); });

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
        state.cvler = state.cvler.filter(function (x) { return x.id !== cv.id; });
        saveState();
        renderCVler();
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz CV eklenmedi.");
  }

  // ---------- Render: İş başvuruları (ortak) ----------
  function renderJobs(list, containerId) {
    const wrap = document.getElementById(containerId);
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-job");
    list.forEach(function (job) {
      const node = tpl.content.cloneNode(true);
      const companyField = node.querySelector(".company-field");
      const positionField = node.querySelector(".position-field");
      const statusField = node.querySelector(".status-field");
      const notesField = node.querySelector(".notes-field");
      const updLabel = node.querySelector(".updated-label");

      companyField.value = job.firma || "";
      positionField.value = job.pozisyon || "";
      statusField.value = job.durum || "beklemede";
      notesField.value = job.notlar || "";
      updLabel.textContent = job.updated ? "Son güncelleme: " + job.updated : "";

      companyField.addEventListener("input", function (e) { job.firma = e.target.value; touch(job, updLabel); });
      positionField.addEventListener("input", function (e) { job.pozisyon = e.target.value; touch(job, updLabel); });
      statusField.addEventListener("change", function (e) { job.durum = e.target.value; touch(job, updLabel); });
      notesField.addEventListener("input", function (e) { job.notlar = e.target.value; touch(job, updLabel); });

      node.querySelector(".del-btn").addEventListener("click", function () {
        const idx = list.indexOf(job);
        if (idx > -1) list.splice(idx, 1);
        saveState();
        renderJobs(list, containerId);
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz kayıt yok.");
  }

  // ---------- Render: İş kurma fikirleri ----------
  function renderFikirler() {
    const wrap = document.getElementById("fikirList");
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-idea");
    state.fikirler.forEach(function (f) {
      const node = tpl.content.cloneNode(true);
      const nameField = node.querySelector(".idea-name-field");
      const stageField = node.querySelector(".stage-field");
      const notesField = node.querySelector(".idea-notes-field");
      const nextField = node.querySelector(".idea-next-field");
      const updLabel = node.querySelector(".updated-label");

      nameField.value = f.ad || "";
      stageField.value = f.asama || "fikir";
      notesField.value = f.notlar || "";
      nextField.value = f.sonrakiAdim || "";
      updLabel.textContent = f.updated ? "Son güncelleme: " + f.updated : "";

      nameField.addEventListener("input", function (e) { f.ad = e.target.value; touch(f, updLabel); });
      stageField.addEventListener("change", function (e) { f.asama = e.target.value; touch(f, updLabel); });
      notesField.addEventListener("input", function (e) { f.notlar = e.target.value; touch(f, updLabel); });
      nextField.addEventListener("input", function (e) { f.sonrakiAdim = e.target.value; touch(f, updLabel); });

      node.querySelector(".del-btn").addEventListener("click", function () {
        if (!confirm("\"" + f.ad + "\" fikrini silmek istediğine emin misin?")) return;
        state.fikirler = state.fikirler.filter(function (x) { return x.id !== f.id; });
        saveState();
        renderFikirler();
      });

      // Kontrol listesi
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
            queueSave();
          });
          itemNode.querySelector(".del-btn-small").addEventListener("click", function () {
            f.checklist = f.checklist.filter(function (x) { return x !== item; });
            saveState();
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
        saveState();
        renderChecklist();
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz fikir eklenmedi.");
  }

  // ---------- Render: Hobiler ----------
  function renderHobiler() {
    const wrap = document.getElementById("hobiList");
    wrap.innerHTML = "";
    const tpl = document.getElementById("tpl-hobby");
    state.hobiler.forEach(function (h) {
      const node = tpl.content.cloneNode(true);
      const nameField = node.querySelector(".hobby-name-field");
      const levelField = node.querySelector(".level-field");
      const resourcesField = node.querySelector(".hobby-resources-field");

      nameField.value = h.ad || "";
      levelField.value = h.seviye || "baslangic";
      resourcesField.value = h.kaynaklar || "";

      nameField.addEventListener("input", function (e) { h.ad = e.target.value; queueSave(); });
      levelField.addEventListener("change", function (e) { h.seviye = e.target.value; queueSave(); });
      resourcesField.addEventListener("input", function (e) { h.kaynaklar = e.target.value; queueSave(); });

      node.querySelector(".del-btn").addEventListener("click", function () {
        if (!confirm("\"" + h.ad + "\" hobisini silmek istediğine emin misin?")) return;
        state.hobiler = state.hobiler.filter(function (x) { return x.id !== h.id; });
        saveState();
        renderHobiler();
      });

      // Günlük / ilerleme kaydı
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
            saveState();
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
        saveState();
        renderLog();
      });

      wrap.appendChild(node);
    });
    emptyState(wrap, "Henüz hobi eklenmedi.");
  }

  function render() {
    renderKanallar();
    renderCVler();
    renderJobs(state.donusAlinanlar, "donusAlinanlarList");
    renderJobs(state.halaBeklenenler, "halaBeklenenlerList");
    renderFikirler();
    renderHobiler();
  }

  // ---------- Üst seviye ekleme formları ----------
  function attachTopForms() {
    document.getElementById("kanalForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const ad = document.getElementById("kanalAd").value.trim();
      const url = document.getElementById("kanalUrl").value.trim();
      if (!ad) return;
      state.kanallar.push({ id: uid(), ad: ad, url: url });
      e.target.reset();
      saveState();
      renderKanallar();
    });

    document.getElementById("cvForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const ad = document.getElementById("cvAd").value.trim();
      if (!ad) return;
      state.cvler.push({ id: uid(), ad: ad, icerik: "", coverLetter: "", updated: "" });
      e.target.reset();
      saveState();
      renderCVler();
    });

    document.getElementById("donusAlinanForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const firma = document.getElementById("donusFirma").value.trim();
      const pozisyon = document.getElementById("donusPozisyon").value.trim();
      if (!firma) return;
      state.donusAlinanlar.push({ id: uid(), firma: firma, pozisyon: pozisyon, durum: "mulakat", notlar: "", updated: "" });
      e.target.reset();
      saveState();
      renderJobs(state.donusAlinanlar, "donusAlinanlarList");
    });

    document.getElementById("bekleyenForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const firma = document.getElementById("bekleyenFirma").value.trim();
      const pozisyon = document.getElementById("bekleyenPozisyon").value.trim();
      if (!firma) return;
      state.halaBeklenenler.push({ id: uid(), firma: firma, pozisyon: pozisyon, durum: "beklemede", notlar: "", updated: "" });
      e.target.reset();
      saveState();
      renderJobs(state.halaBeklenenler, "halaBeklenenlerList");
    });

    document.getElementById("fikirForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const ad = document.getElementById("fikirAd").value.trim();
      if (!ad) return;
      state.fikirler.push({ id: uid(), ad: ad, asama: "fikir", notlar: "", sonrakiAdim: "", checklist: [], updated: "" });
      e.target.reset();
      saveState();
      renderFikirler();
    });

    document.getElementById("hobiForm").addEventListener("submit", function (e) {
      e.preventDefault();
      const ad = document.getElementById("hobiAd").value.trim();
      if (!ad) return;
      state.hobiler.push({ id: uid(), ad: ad, seviye: "baslangic", kaynaklar: "", log: [] });
      e.target.reset();
      saveState();
      renderHobiler();
    });
  }

  // ---------- Akordeon ----------
  function attachAccordions() {
    document.querySelectorAll(".group-header").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.closest(".group").classList.toggle("open");
      });
    });
    document.querySelectorAll(".sub-header").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.closest(".subsection").classList.toggle("open");
      });
    });
  }

  // ---------- Başlangıç ----------
  function init() {
    const firstGroup = document.querySelector('.group[data-group="isBulma"]');
    if (firstGroup) firstGroup.classList.add("open");
    attachAccordions();
    attachTopForms();
    render();
    initFirebase();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
