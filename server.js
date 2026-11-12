
const express = require("express");
const multer = require("multer");
const { execFile } = require("child_process");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Serve the website files
app.use(express.static(path.join(__dirname, "public")));

// Receive a Pages file and convert it
app.post("/convert", upload.single("file"), async (req, res) => {
  if (!req.file || !/\.pages$/i.test(req.file.originalname)) {
    return res.status(400).send("Please upload a .pages file.");
  }

  let tempDir;

  try {
    // Create a temporary folder
    tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "pages-to-pdf-")
    );

    const inputPath = path.join(tempDir, "input.pages");
    const outputPath = path.join(tempDir, "output.pdf");

    // Save the uploaded document
    await fs.writeFile(inputPath, req.file.buffer);

    // Tell Apple Pages to export a PDF
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

    // Execute AppleScript
    await new Promise((resolve, reject) => {
      execFile(
        "osascript",
        ["-e", script, inputPath, outputPath],
        { timeout: 120000 },
        (error) => {
          if (error) reject(error);
          else resolve();
        }
      );
    });

    // Read and send the converted PDF
    const pdf = await fs.readFile(outputPath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="converted.pdf"'
    );
    res.send(pdf);

  } catch (error) {
    console.error("Conversion error:", error);
    res.status(500).send("PDF conversion failed.");
  } finally {
    // Delete temporary files
    if (tempDir) {
      await fs.rm(tempDir, {
        recursive: true,
        force: true
      });
    }
  }
});

// Start the server
app.listen(3000, "127.0.0.1", () => {
  console.log("Server running at http://localhost:3000");
});
