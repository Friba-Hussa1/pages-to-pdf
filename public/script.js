
const form = document.getElementById("convertForm");
const fileInput = document.getElementById("pagesFile");
const status = document.getElementById("status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files[0];

  if (!file || !file.name.toLowerCase().endsWith(".pages")) {
    status.textContent = "Please select a .pages file.";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  status.textContent = "Converting...";

  try {
    const response = await fetch("/convert", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Conversion failed.");
    }

    const pdf = await response.blob();
    const url = URL.createObjectURL(pdf);

    const link = document.createElement("a");
    link.href = url;
    link.download = file.name.replace(/\.pages$/i, ".pdf");

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = "PDF converted successfully!";
  } catch (error) {
    status.textContent = error.message;
  }
});
