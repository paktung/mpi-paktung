// =====================================================
// FILE: assets/js/materi.js
// FITUR LENGKAP:
// - Tambah materi
// - Tampil materi LMS style
// - Edit materi inline
// - YouTube embed
// - Audio player langsung
// - Komentar
// - Reply komentar
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // HELPER YOUTUBE EMBED
  // =========================
  function convertYoutube(url) {
    if (!url) return "";

    let videoId = "";

    if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split("?")[0];
    }

    if (!videoId) return "";

    return `
      <div class="video-wrapper">
        <iframe
          src="https://www.youtube.com/embed/${videoId}"
          title="YouTube video player"
          frameborder="0"
          allowfullscreen>
        </iframe>
      </div>
    `;
  }

  // =========================
  // SIMPAN DATA MATERI
  // =========================
  const form = document.getElementById("materiForm");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const data = {
        kode: document.getElementById("kode").value,
        mapel: document.getElementById("mapel").value,
        materi: document.getElementById("materi").value,
        gambar: document.getElementById("gambar").value,
        video: document.getElementById("video").value,
        audio: document.getElementById("audio").value,
        ppt: document.getElementById("ppt").value,
        status: 1
      };

      const { error } = await supabaseClient
        .from("materi")
        .insert([data]);

      if (error) {
        alert("Gagal menyimpan: " + error.message);
      } else {
        alert("Materi berhasil disimpan!");
        form.reset();
      }
    });
  }

  // =========================
  // LOAD KOMENTAR
  // =========================
  async function loadKomentar(materiId) {
    const { data, error } = await supabaseClient
      .from("komentar")
      .select("*")
      .eq("materi_id", materiId)
      .eq("status", 1)
      .order("created_at", { ascending: true });

    if (error) {
      return `<p>Gagal memuat komentar</p>`;
    }

    const komentarUtama = data.filter(k => !k.parent_id);

    if (!komentarUtama.length) {
      return `<p>Belum ada komentar.</p>`;
    }

    return komentarUtama.map(k => `
      <div class="komentar-item">
        <strong>${k.nama}</strong>
        <p>${k.isi}</p>

        <button class="reply-toggle" onclick="toggleReply(${k.id})">↩ Balas</button>

        <div class="reply-form hidden" id="reply-form-${k.id}">
          <input type="text" id="reply-nama-${k.id}" placeholder="Nama Anda">
          <textarea id="reply-isi-${k.id}" placeholder="Tulis balasan..."></textarea>
          <button onclick="kirimReply(${materiId}, ${k.id})">Kirim Balasan</button>
        </div>

        <div class="reply-list">
          ${data
            .filter(r => r.parent_id === k.id)
            .map(r => `
              <div class="reply-item">
                <strong>${r.nama}</strong>
                <p>${r.isi}</p>
              </div>
            `).join("")}
        </div>
      </div>
    `).join("");
  }

  // =========================
  // TAMPILKAN DATA MATERI
  // =========================
  const materiList = document.getElementById("materiList");

  async function loadMateri() {
    if (!materiList) return;

    const { data, error } = await supabaseClient
      .from("materi")
      .select("*")
      .eq("status", 1)
      .order("id", { ascending: false });

    if (error) {
      materiList.innerHTML = `<p>Gagal memuat data: ${error.message}</p>`;
      return;
    }

    if (!data.length) {
      materiList.innerHTML = `<p>Belum ada materi.</p>`;
      return;
    }

    materiList.innerHTML = data.map(item => `
      <div class="card">

        ${item.gambar ? `<img src="${item.gambar}" class="materi-img" alt="${item.mapel}">` : ""}

        <div class="card-content">

          <span class="badge">${item.kode}</span>

          <h3>${item.mapel}</h3>

          <div class="materi-text" id="text-${item.id}">
            <p>${item.materi}</p>
          </div>

          <!-- FORM EDIT -->
          <div class="edit-form hidden" id="edit-${item.id}">
            <input type="text" id="kode-${item.id}" value="${item.kode}">
            <input type="text" id="mapel-${item.id}" value="${item.mapel}">
            <textarea id="materi-${item.id}">${item.materi}</textarea>
            <input type="text" id="gambar-${item.id}" value="${item.gambar || ""}">
            <input type="text" id="video-${item.id}" value="${item.video || ""}">
            <input type="text" id="audio-${item.id}" value="${item.audio || ""}">
            <input type="text" id="ppt-${item.id}" value="${item.ppt || ""}">
          </div>

          <!-- VIDEO -->
          ${item.video ? convertYoutube(item.video) : ""}

          <!-- AUDIO -->
          ${item.audio ? `
            <audio controls style="width:100%; margin-top:14px;">
              <source src="${item.audio}" type="audio/mpeg">
              Browser Anda tidak mendukung audio.
            </audio>
          ` : ""}

          <!-- LINK PPT -->
          <div class="resource-links">
            ${item.ppt ? `<a href="${item.ppt}" target="_blank">📄 PPT</a>` : ""}
          </div>

          <!-- AKSI -->
          <div class="aksi">
            <button class="edit-btn" onclick="toggleEdit(${item.id})">✏️ Edit</button>
            <button class="save-btn hidden" id="save-${item.id}" onclick="saveEdit(${item.id})">💾 Simpan</button>
          </div>

          <!-- KOMENTAR -->
          <div class="komentar-box">
            <h4>💬 Diskusi Materi</h4>

            <div id="komentar-list-${item.id}">
              Memuat komentar...
            </div>

            <div class="komentar-form">
              <input type="text" id="nama-${item.id}" placeholder="Nama Anda">
              <textarea id="isi-${item.id}" placeholder="Tulis komentar..."></textarea>
              <button onclick="kirimKomentar(${item.id})">Kirim Komentar</button>
            </div>
          </div>

        </div>
      </div>
    `).join("");

    // LOAD komentar tiap materi
    for (const item of data) {
      const komentarHTML = await loadKomentar(item.id);
      const target = document.getElementById(`komentar-list-${item.id}`);
      if (target) {
        target.innerHTML = komentarHTML;
      }
    }
  }

  // =========================
  // TOGGLE EDIT
  // =========================
  window.toggleEdit = function(id) {
    document.getElementById(`text-${id}`).classList.toggle("hidden");
    document.getElementById(`edit-${id}`).classList.toggle("hidden");
    document.getElementById(`save-${id}`).classList.toggle("hidden");
  };

  // =========================
  // SAVE EDIT
  // =========================
  window.saveEdit = async function(id) {
    const updatedData = {
      kode: document.getElementById(`kode-${id}`).value,
      mapel: document.getElementById(`mapel-${id}`).value,
      materi: document.getElementById(`materi-${id}`).value,
      gambar: document.getElementById(`gambar-${id}`).value,
      video: document.getElementById(`video-${id}`).value,
      audio: document.getElementById(`audio-${id}`).value,
      ppt: document.getElementById(`ppt-${id}`).value
    };

    const { error } = await supabaseClient
      .from("materi")
      .update(updatedData)
      .eq("id", id);

    if (error) {
      alert("Gagal update: " + error.message);
      return;
    }

    alert("Materi berhasil diperbarui!");
    loadMateri();
  };

  // =========================
  // TOGGLE REPLY
  // =========================
  window.toggleReply = function(id) {
    document.getElementById(`reply-form-${id}`).classList.toggle("hidden");
  };

  // =========================
  // KIRIM KOMENTAR
  // =========================
  window.kirimKomentar = async function(materiId) {
    const nama = document.getElementById(`nama-${materiId}`).value;
    const isi = document.getElementById(`isi-${materiId}`).value;

    if (!nama || !isi) {
      alert("Nama dan komentar wajib diisi!");
      return;
    }

    const { error } = await supabaseClient
      .from("komentar")
      .insert([{
        materi_id: materiId,
        nama,
        isi,
        status: 1
      }]);

    if (error) {
      alert("Gagal komentar: " + error.message);
      return;
    }

    loadMateri();
  };

  // =========================
  // KIRIM REPLY
  // =========================
  window.kirimReply = async function(materiId, parentId) {
    const nama = document.getElementById(`reply-nama-${parentId}`).value;
    const isi = document.getElementById(`reply-isi-${parentId}`).value;

    if (!nama || !isi) {
      alert("Nama dan balasan wajib diisi!");
      return;
    }

    const { error } = await supabaseClient
      .from("komentar")
      .insert([{
        materi_id: materiId,
        nama,
        isi,
        parent_id: parentId,
        status: 1
      }]);

    if (error) {
      alert("Gagal reply: " + error.message);
      return;
    }

    loadMateri();
  };

  // =========================
  // START
  // =========================
  loadMateri();

});
