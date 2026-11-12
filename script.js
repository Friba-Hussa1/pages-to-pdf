
const form = document.getElementById("converterForm");
const fileInput = document.getElementById("pagesFile");
const status = document.getElementById("status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const file = fileInput.files[0];

  if (!file) {
    status.textContent = "Please select a Pages file.";
    return;
  }

  status.textContent = "Converting, please wait...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/convert", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = file.name.replace(/\.pages$/i, ".pdf");

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
    status.textContent = "Conversion successful!";
  } catch (error) {
    status.textContent = "Conversion failed: " + error.message;
  }
});
