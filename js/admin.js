import { getSupabase } from "./supabase-client.js";
import { state, esc, rupiah, renderAll } from "./app.js";

// Panel admin: CRUD menu, carousel, settings. Aktif hanya bila state.admin.
export function initAdmin() {
  const $ = (id) => document.getElementById(id);

  document.querySelectorAll(".admin-tab").forEach((b) => {
    b.onclick = () => {
      document.querySelectorAll(".admin-tab").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      document.querySelectorAll(".admin-tabpane").forEach((p) => p.classList.add("hidden"));
      $("tab-" + b.dataset.tab).classList.remove("hidden");
    };
  });
  document.querySelector(".admin-tab").classList.add("active");

  window.addEventListener("admin-data", () => { paintMenus(); paintSlides(); paintSettings(); });
  paintMenus(); paintSlides(); paintSettings();

  // ---------- MENU ----------
  function paintMenus() {
    $("adminMenuTable").innerHTML = state.menus.map((m) => `
      <div class="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
        <span class="font-bold flex-1">${esc(m.nama)} <span class="text-stone-500 font-normal">· ${rupiah(m.harga)}${m.is_populer ? " · 🔥" : ""}${m.is_available === false ? " · habis" : ""}</span></span>
        <button data-edit="${m.id}" class="text-choco underline">Edit</button>
        <button data-del="${m.id}" class="text-red-600 underline">Hapus</button>
      </div>`).join("");
  }
  $("adminMenuTable").onclick = async (e) => {
    const sb = await getSupabase();
    const edit = e.target.closest("[data-edit]");
    const del = e.target.closest("[data-del]");
    if (edit) {
      const m = state.menus.find((x) => String(x.id) === edit.dataset.edit);
      $("mId").value = m.id; $("mNama").value = m.nama; $("mHarga").value = m.harga;
      $("mKategori").value = m.kategori; $("mDeskripsi").value = m.deskripsi || "";
      $("mPopuler").checked = !!m.is_populer; $("mTersedia").checked = m.is_available !== false;
      $("menuForm").scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (del && sb && confirm("Hapus menu ini?")) {
      await sb.from("menus").delete().eq("id", del.dataset.del);
      state.menus = state.menus.filter((x) => String(x.id) !== del.dataset.del);
      paintMenus(); renderAll();
    }
  };
  $("menuReset").onclick = () => $("menuForm").reset();
  $("menuForm").onsubmit = async (e) => {
    e.preventDefault();
    const sb = await getSupabase();
    if (!sb) return alert("Hubungkan Supabase dulu (isi js/config.js).");
    const id = $("mId").value || null;
    let foto_url;
    if ($("mFoto").files[0]) foto_url = await uploadImage(sb, "foto-menu", $("mFoto").files[0], 1200);
    const row = {
      nama: $("mNama").value.trim(),
      harga: Math.max(0, +$("mHarga").value || 0),
      kategori: $("mKategori").value,
      deskripsi: $("mDeskripsi").value.trim(),
      is_populer: $("mPopuler").checked,
      is_available: $("mTersedia").checked,
      ...(foto_url ? { foto_url } : {}),
    };
    const { data, error } = id
      ? await sb.from("menus").update(row).eq("id", id).select().single()
      : await sb.from("menus").insert({ ...row, urutan: state.menus.length + 1 }).select().single();
    if (error) return alert("Gagal simpan: " + error.message);
    state.menus = id ? state.menus.map((x) => (String(x.id) === String(id) ? data : x)) : [...state.menus, data];
    $("menuForm").reset();
    paintMenus(); renderAll();
  };

  // ---------- CAROUSEL ----------
  function paintSlides() {
    $("adminSlideList").innerHTML = state.slides.map((s, i) => `
      <div class="flex items-center gap-2 bg-cream rounded-lg px-3 py-2">
        <span class="font-bold flex-1">${esc(s.judul)} <span class="text-stone-500 font-normal">${s.is_active ? "· aktif" : "· nonaktif"}</span></span>
        <button data-up="${i}" class="underline">↑</button>
        <button data-down="${i}" class="underline">↓</button>
        <button data-sedit="${s.id}" class="text-choco underline">Edit</button>
        <button data-sdel="${s.id}" class="text-red-600 underline">Hapus</button>
      </div>`).join("");
  }
  $("adminSlideList").onclick = async (e) => {
    const sb = await getSupabase();
    const up = e.target.closest("[data-up]");
    const down = e.target.closest("[data-down]");
    const ed = e.target.closest("[data-sedit]");
    const del = e.target.closest("[data-sdel]");
    if ((up || down) && sb) {
      const i = +(up || down).dataset[up ? "up" : "down"];
      const j = up ? i - 1 : i + 1;
      if (j < 0 || j >= state.slides.length) return;
      const [a, b] = [state.slides[i], state.slides[j]];
      await sb.from("carousel_slides").update({ urutan: b.urutan }).eq("id", a.id);
      await sb.from("carousel_slides").update({ urutan: a.urutan }).eq("id", b.id);
      [state.slides[i], state.slides[j]] = [b, a];
      paintSlides(); renderAll();
    }
    if (ed) {
      const s = state.slides.find((x) => String(x.id) === ed.dataset.sedit);
      $("sId").value = s.id; $("sJudul").value = s.judul; $("sSubjudul").value = s.subjudul || "";
      $("sCtaLink").value = s.cta_link || ""; $("sCtaText").value = s.cta_text || "";
      $("sAktif").checked = !!s.is_active;
    }
    if (del && sb && confirm("Hapus slide ini?")) {
      await sb.from("carousel_slides").delete().eq("id", del.dataset.sdel);
      state.slides = state.slides.filter((x) => String(x.id) !== del.dataset.sdel);
      paintSlides(); renderAll();
    }
  };
  $("slideReset").onclick = () => $("slideForm").reset();
  $("slideForm").onsubmit = async (e) => {
    e.preventDefault();
    const sb = await getSupabase();
    if (!sb) return alert("Hubungkan Supabase dulu (isi js/config.js).");
    const id = $("sId").value || null;
    let foto_url;
    if ($("sFoto").files[0]) foto_url = await uploadImage(sb, "foto-carousel", $("sFoto").files[0], 1280);
    if (!id && !foto_url) return alert("Slide baru wajib ada foto.");
    const row = {
      judul: $("sJudul").value.trim(),
      subjudul: $("sSubjudul").value.trim(),
      cta_link: $("sCtaLink").value.trim() || "#pesan",
      cta_text: $("sCtaText").value.trim() || "Pesan Sekarang",
      is_active: $("sAktif").checked,
      ...(foto_url ? { foto_url } : {}),
    };
    const { data, error } = id
      ? await sb.from("carousel_slides").update(row).eq("id", id).select().single()
      : await sb.from("carousel_slides").insert({ ...row, urutan: state.slides.length + 1 }).select().single();
    if (error) return alert("Gagal simpan: " + error.message);
    state.slides = id ? state.slides.map((x) => (String(x.id) === String(id) ? data : x)) : [...state.slides, data];
    $("slideForm").reset();
    paintSlides(); renderAll();
  };

  // ---------- SETTINGS ----------
  const KEYS = ["wa_order_link", "wa_number", "gofood_url", "shopeefood_url", "grabfood_url",
    "gmaps_url", "alamat", "jam_buka", "instagram", "tiktok", "promo_text"];
  function paintSettings() {
    KEYS.forEach((k) => { const el = $("set_" + k); if (el) el.value = state.settings[k] || ""; });
  }
  $("settingsForm").onsubmit = async (e) => {
    e.preventDefault();
    const sb = await getSupabase();
    if (!sb) return alert("Hubungkan Supabase dulu (isi js/config.js).");
    const rows = KEYS.map((k) => ({ key: k, value: $("set_" + k).value.trim() }));
    const { error } = await sb.from("settings").upsert(rows, { onConflict: "key" });
    if (error) return alert("Gagal simpan: " + error.message);
    rows.forEach((r) => (state.settings[r.key] = r.value));
    renderAll();
    alert("Pengaturan tersimpan ✅");
  };

  // Kompres di browser → upload ke bucket → kembalikan public URL.
  async function uploadImage(sb, bucket, file, maxSide) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Format harus JPG/PNG/WebP");
    if (file.size > 2 * 1024 * 1024) throw new Error("File max 2MB");
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.82));
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    const { error } = await sb.storage.from(bucket).upload(path, blob, { contentType: "image/webp" });
    if (error) throw error;
    return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}
