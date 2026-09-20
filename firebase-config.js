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
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Envanter verileriyle çakışmaması için bu sitenin verileri bu kök
// altında tutulur. İstersen değiştirebilirsin.
const DB_ROOT_PATH = "takip-sitesi";
