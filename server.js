
const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/convert", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  if (!/\.pages$/i.test(req.file.originalname)) {
    fs.unlinkSync(req.file.path);
    return res.status(400).send("Only .pages files allowed");
  }

  const inputPath = req.file.path + ".pages";
  const outputPath = req.file.path + ".pdf";

  fs.renameSync(req.file.path, inputPath);

  const script = `
    on run argv
      set inputFile to POSIX file (item 1 of argv)
      set outputFile to POSIX file (item 2 of argv)

      tell application "Pages"
        set doc to open inputFile
        export doc to outputFile as PDF
        close doc saving no
      end tell
    end run
  `;

  execFile(
    "osascript",
    ["-e", script, inputPath, outputPath],
    { timeout: 120000 },
    (error) => {
      if (error || !fs.existsSync(outputPath)) {
        fs.rmSync(inputPath, { force: true });
        fs.rmSync(outputPath, { force: true });
        console.error(error);
        return res.status(500).send("Conversion failed");
      }

      res.download(outputPath, "converted.pdf", () => {
        fs.rmSync(inputPath, { force: true });
        fs.rmSync(outputPath, { force: true });
      });
    }
  );
});

app.listen(3000, "127.0.0.1", () => {
  console.log("Server running at http://localhost:3000");
});
