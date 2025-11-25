
// === Weather Widget Placeholder ===
async function loadWeather() {
  const el = document.getElementById("weather-box");
  if (!el) return;
  el.innerHTML = "🌤 29°C  •  หนองคาย";
}

// === Smart Suggestion System ===
function loadSuggestions() {
  const box = document.getElementById("suggestion-box");
  if (!box) return;
  box.innerHTML = `
    <h3>แนะนำสถานที่ตอนนี้</h3>
    <ul>
      <li>ริมโขงยามเย็น (แสงสวยมาก)</li>
      <li>วัดโพธิ์ชัย (เหมาะไปช่วงบ่าย)</li>
      <li>ศาลาแก้วกู่ (ถ่ายรูปโทนสวย)</li>
    </ul>
  `;
}

// === Map Integration Placeholder ===
function initTravelMap() {
  const mapBox = document.getElementById("travel-map");
  if (!mapBox) return;
  mapBox.innerHTML = "<p>📍 แผนที่กำลังพัฒนา</p>";
}

// === Init ===
window.addEventListener("DOMContentLoaded", () => {
  loadWeather();
  loadSuggestions();
  initTravelMap();
});
