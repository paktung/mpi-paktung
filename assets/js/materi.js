document.addEventListener("DOMContentLoaded", () => {

  // =========================
  // SIMPAN DATA
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
  // TAMPILKAN DATA
  // =========================
  const materiList = document.getElementById("materiList");

  if (materiList) {
    async function loadMateri() {
      const { data, error } = await supabaseClient
        .from("materi")
        .select("*")
        .eq("status", 1)
        .order("id", { ascending: false });

      if (error) {
        materiList.innerHTML = "Gagal memuat data.";
        return;
      }

      if (data.length === 0) {
        materiList.innerHTML = "Belum ada materi.";
        return;
      }

      materiList.innerHTML = data.map(item => `
        <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
          <h3>${item.kode} - ${item.mapel}</h3>
          <p>${item.materi}</p>

          ${item.gambar ? `<img src="${item.gambar}" width="200"><br>` : ""}
          ${item.video ? `<p><a href="${item.video}" target="_blank">Video</a></p>` : ""}
          ${item.audio ? `<p><a href="${item.audio}" target="_blank">Audio</a></p>` : ""}
          ${item.ppt ? `<p><a href="${item.ppt}" target="_blank">PPT</a></p>` : ""}
        </div>
      `).join("");
    }

    loadMateri();
  }

});
