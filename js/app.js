import { getSupabase } from "./supabase-client.js";
import { FALLBACK_IMAGES } from "./config.js";
import { initAuth } from "./auth.js";
import { initAdmin } from "./admin.js";

export const state = { menus: [], slides: [], settings: {}, admin: false };
let activeCat = "semua";

export const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
export const fallbackImg = (i) => FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];

async function loadData() {
  const sb = await getSupabase();
  if (sb) {
    try {
      const [m, s, st] = await Promise.all([
        sb.from("menus").select("*").order("urutan"),
        sb.from("carousel_slides").select("*").order("urutan"),
        sb.from("settings").select("*"),
      ]);
      if (m.data?.length || s.data?.length) {
        state.menus = m.data ?? [];
        state.slides = s.data ?? [];
        state.settings = Object.fromEntries((st.data ?? []).map((r) => [r.key, r.value]));
        return;
      }
    } catch { /* jatuh ke seed */ }
  }
  const res = await fetch("data/seed.json");
  const seed = await res.json();
  state.menus = seed.menus;
  state.slides = seed.slides;
  state.settings = seed.settings;
}

function waItemLink(menu) {
  const num = state.settings.wa_number || "6281234567890";
  const text = `Halo Dofren, saya mau pesan ${menu.nama} (${rupiah(menu.harga)})`;
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`;
}

function renderCarousel() {
  const track = document.getElementById("carouselTrack");
  const dots = document.getElementById("carouselDots");
  const slides = state.slides.filter((s) => s.is_active !== false);
  track.innerHTML = slides.map((s, i) => `
    <article class="relative min-w-full h-56 md:h-80">
      <img src="${esc(s.foto_url || fallbackImg(i))}" alt="${esc(s.judul)}" ${i > 0 ? 'loading="lazy"' : ""} class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
      <div class="absolute bottom-8 left-0 right-0 text-center text-white px-6">
        <h2 class="text-xl md:text-3xl font-extrabold drop-shadow">${esc(s.judul)}</h2>
        <p class="text-xs md:text-sm text-white/90 mt-1">${esc(s.subjudul || "")}</p>
        <a href="${esc(s.cta_link || "#pesan")}" class="inline-block mt-3 bg-brand text-choco text-sm font-bold rounded-full px-6 py-2">${esc(s.cta_text || "Pesan Sekarang")}</a>
      </div>
    </article>`).join("");
  dots.innerHTML = slides.map((_, i) => `<button data-i="${i}" aria-label="Slide ${i + 1}" class="car-dot w-2.5 h-2.5 rounded-full bg-white/50"></button>`).join("");

  let idx = 0, timer;
  const go = (i) => {
    idx = (i + slides.length) % slides.length;
    track.scrollTo({ left: track.clientWidth * idx, behavior: "smooth" });
    dots.querySelectorAll(".car-dot").forEach((d, j) => (d.className = `car-dot w-2.5 h-2.5 rounded-full ${j === idx ? "bg-white" : "bg-white/50"}`));
  };
  const auto = () => { clearInterval(timer); timer = setInterval(() => go(idx + 1), 5000); };
  document.getElementById("carPrev").onclick = () => { go(idx - 1); auto(); };
  document.getElementById("carNext").onclick = () => { go(idx + 1); auto(); };
  dots.onclick = (e) => { const b = e.target.closest("[data-i]"); if (b) { go(+b.dataset.i); auto(); } };
  track.onscroll = () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== idx) { idx = i; dots.querySelectorAll(".car-dot").forEach((d, j) => (d.className = `car-dot w-2.5 h-2.5 rounded-full ${j === idx ? "bg-white" : "bg-white/50"}`)); }
  };
  go(0); auto();
}

function menuCard(m, i) {
  return `
  <article class="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col">
    <div class="relative">
      <img src="${esc(m.foto_url || fallbackImg(i))}" alt="${esc(m.nama)}" loading="lazy" class="menu-photo w-full" />
      ${m.is_populer ? '<span class="absolute top-2 left-2 bg-brand text-choco text-[11px] font-extrabold rounded-full px-2.5 py-0.5">🔥 Populer</span>' : ""}
      ${m.is_available === false ? '<span class="absolute inset-0 bg-black/50 text-white font-bold flex items-center justify-center">Habis</span>' : ""}
    </div>
    <div class="p-3 flex flex-col gap-1 flex-1">
      <h3 class="font-bold text-sm leading-snug">${esc(m.nama)}</h3>
      <p class="text-xs text-stone-500 line-clamp-2">${esc(m.deskripsi || "")}</p>
      <div class="mt-auto flex items-center justify-between pt-2">
        <span class="font-extrabold text-choco">${rupiah(m.harga)}</span>
        <a href="${esc(waItemLink(m))}" target="_blank" rel="noopener" class="text-xs font-bold bg-choco text-white rounded-full px-3 py-1.5">Pesan</a>
      </div>
    </div>
  </article>`;
}

function renderMenus() {
  const q = document.getElementById("menuSearch").value.toLowerCase();
  const avail = state.menus.filter((m) => m.is_available !== false)
    .filter((m) => activeCat === "semua" || m.kategori === activeCat)
    .filter((m) => (m.nama + " " + (m.deskripsi || "")).toLowerCase().includes(q));
  document.getElementById("menuGrid").innerHTML =
    avail.map(menuCard).join("") || '<p class="text-sm text-stone-500 col-span-full">Menu tidak ditemukan.</p>';
  const pop = state.menus.filter((m) => m.is_populer && m.is_available !== false).slice(0, 4);
  document.getElementById("populerGrid").innerHTML =
    pop.map(menuCard).join("") || '<p class="text-sm text-stone-500 col-span-full">Belum ada menu populer.</p>';
}

function renderOrder() {
  const s = state.settings;
  const channels = [
    { name: "GoFood", url: s.gofood_url, bg: "bg-[#FF0000]" },
    { name: "ShopeeFood", url: s.shopeefood_url, bg: "bg-[#EE4D2D]" },
    { name: "GrabFood", url: s.grabfood_url, bg: "bg-[#00B14F]" },
    { name: "WA Bisnis", url: s.wa_order_link, bg: "bg-[#25D366]" },
  ].filter((c) => c.url);
  document.getElementById("orderButtons").innerHTML = channels.map((c) => `
    <a href="${esc(c.url)}" target="_blank" rel="noopener"
       class="order-btn ${c.bg} text-white rounded-2xl p-5 text-center font-extrabold shadow hover:opacity-90">
      Pesan via<br /><span class="text-lg">${esc(c.name)}</span>
    </a>`).join("") || '<p class="text-sm text-stone-500 col-span-full">Link pemesanan belum diisi admin.</p>';
  document.getElementById("floatWa").href = s.wa_order_link || "#pesan";
}

function renderSettings() {
  const s = state.settings;
  const set = (id, v) => { const el = document.getElementById(id); if (el && v) el.textContent = v; };
  set("siteTagline", s.tagline); set("promoText", s.promo_text);
  set("alamatText", s.alamat); set("jamText", s.jam_buka);
  set("footAlamat", s.alamat); set("footJam", s.jam_buka); set("footTagline", s.tagline);
  if (s.maps_embed_url) document.getElementById("mapsFrame").src = s.maps_embed_url;
  const g = s.gmaps_url || "";
  ["gmapsLink", "gmapsLink2", "routeBtn"].forEach((id) => { const el = document.getElementById(id); if (el) el.href = g || "#lokasi"; });
  if (s.instagram) document.getElementById("igLink").href = s.instagram;
  if (s.tiktok) document.getElementById("tiktokLink").href = s.tiktok;
  document.getElementById("year").textContent = new Date().getFullYear();
}

export function renderAll() {
  renderCarousel(); renderMenus(); renderOrder(); renderSettings();
}

document.querySelectorAll(".filter-btn").forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll(".filter-btn").forEach((x) => x.classList.remove("active"));
    b.classList.add("active");
    activeCat = b.dataset.cat;
    renderMenus();
  };
});
document.querySelector(".filter-btn").classList.add("active");
document.getElementById("menuSearch").oninput = renderMenus;

await loadData();
renderAll();
await initAuth();
initAdmin();
