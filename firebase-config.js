// ============================================================
// FIREBASE YAPILANDIRMASI
// ============================================================
// Bu dosya, envanter sitende (ahmetgorkem0.github.io/envanter)
// kullandığın Firebase projesiyle AYNI şekilde çalışır.
//
// Ne yapman gerekiyor:
// 1) Envanter sitesinde kullandığın firebaseConfig objesini buraya
//    kopyala (Firebase konsolu > Project settings > Your apps).
//    Aynı projeyi kullanmak istersen aynı config'i kullanabilirsin;
//    veriler farklı bir "path" altında tutulduğu için envanter
//    verilerinle karışmaz (aşağıdaki DB_ROOT_PATH ayarına bakabilirsin).
// 2) Realtime Database kurallarının bu path'e yazmaya izin verdiğinden
//    emin ol.
//
// Firebase bilgisi girmezsen site yine çalışır, ama veriler sadece
// o an açık olan sekmede tutulur ve sayfa yenilenince (ya da dosya
// yeniden açılınca) sıfırlanır — bu yüzden GitHub Pages'e atıp
// gerçek kullanıma geçmeden önce bu adımı tamamlaman önemli.
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyAGSj4dH0Ha1AyMUA7cSVdEi24EOe1VcNE",
  authDomain: "envanter-720f7.firebaseapp.com",
  databaseURL: "https://envanter-720f7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "envanter-720f7",
  storageBucket: "envanter-720f7.firebasestorage.app",
  messagingSenderId: "216833894102",
  appId: "1:216833894102:web:52b3debc60e3beefac8b77"
};

const DB_ROOT_PATH = "takip-sitesi";
