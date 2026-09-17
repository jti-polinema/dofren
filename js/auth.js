import { getSupabase } from "./supabase-client.js";
import { state, renderAll } from "./app.js";

// Atur tampilan login/logout + panel admin. Kembalikan true bila admin.
export async function initAuth() {
  const sb = await getSupabase();
  const $ = (id) => document.getElementById(id);
  const modal = $("loginModal");

  const paint = () => {
    $("btnLogin").classList.toggle("hidden", state.admin);
    $("footAdmin").textContent = state.admin ? "Panel Admin" : "Login Admin";
    $("btnKelola").classList.toggle("hidden", !state.admin);
    $("btnLogout").classList.toggle("hidden", !state.admin);
    $("adminPanel").classList.toggle("hidden", !state.admin);
  };

  const openModal = () => { if (state.admin) { $("adminPanel").scrollIntoView({ behavior: "smooth" }); } else { modal.classList.remove("hidden"); } };
  $("btnLogin").onclick = openModal;
  $("footAdmin").onclick = openModal;
  $("btnKelola").onclick = () => $("adminPanel").scrollIntoView({ behavior: "smooth" });
  $("loginCancel").onclick = () => modal.classList.add("hidden");

  $("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const err = $("loginError");
    err.classList.add("hidden");
    if (!sb) { err.textContent = "Backend belum dihubungkan (isi js/config.js dulu)."; err.classList.remove("hidden"); return; }
    const { error } = await sb.auth.signInWithPassword({
      email: $("loginEmail").value.trim(),
      password: $("loginPassword").value,
    });
    if (error) { err.textContent = "Login gagal: " + error.message; err.classList.remove("hidden"); return; }
    modal.classList.add("hidden");
    e.target.reset();
    await refresh();
  };

  $("btnLogout").onclick = async () => { if (sb) await sb.auth.signOut(); state.admin = false; paint(); };

  async function refresh() {
    state.admin = false;
    if (sb) {
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data } = await sb.from("profiles").select("id").eq("id", user.id).maybeSingle();
        state.admin = !!data;
      }
    }
    paint();
    if (state.admin) {
      const [m, s, st] = await Promise.all([
        sb.from("menus").select("*").order("urutan"),
        sb.from("carousel_slides").select("*").order("urutan"),
        sb.from("settings").select("*"),
      ]);
      state.menus = m.data ?? state.menus;
      state.slides = s.data ?? state.slides;
      state.settings = Object.fromEntries((st.data ?? []).map((r) => [r.key, r.value]));
      renderAll();
      window.dispatchEvent(new CustomEvent("admin-data"));
    }
  }

  await refresh();
}
