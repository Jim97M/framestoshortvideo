import express from "express";
import path from "path";
import axios from "axios";
import cors from "cors";
import url from "url";
import fs from "fs";
import ytdl from "ytdl-core";
import { spawn } from "child_process";
import sharp from "sharp"; // Import Sharp

const app = express();
const port = process.env.PORT || 5000;

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.__basedir = __dirname;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "build")));

app.use("/video", express.static("frames"));

// Define a promisified function for downloading a video using axios
const downloadVideo = async (videoUrl, outputPath) => {
  const response = await axios.get(videoUrl, { responseType: "stream" });
  const writer = fs.createWriteStream(outputPath);

  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

// Function to extract frames from a video using ffmpeg
const extractFrames = async (inputPath, outputDir) => {
  return new Promise((resolve, reject) => {
    const args = [
      "-i",
      inputPath,
      "-vf",
      "fps=1",
      path.join(outputDir, "frame%03d.png"),
    ];

    const ffmpegProcess = spawn("ffmpeg", args);

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        const frameFiles = fs.readdirSync(outputDir);
        const framePaths = frameFiles.map((frameFile) =>
          path.join(outputDir, frameFile)
        );
        resolve(framePaths);
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
};

// Function to create a short video from frames using ffmpeg
const createVideoFromFrames = async (
  framePaths,
  outputVideoPath,
  frameRate
) => {
  return new Promise((resolve, reject) => {
    const args = [
      "-r",
      frameRate.toString(),
      "-f",
      "image2",
      "-i",
      path.join(__dirname, "frames", "frame%03d.png"),
      "-vcodec",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      outputVideoPath,
    ];

    const ffmpegProcess = spawn("ffmpeg", args);

    ffmpegProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}`));
      }
    });
  });
};

app.post("/processVideo", async (req, res) => {
  const { videoUrl } = req.body;
  const outputPath = path.join(__dirname, "frames", "video.mp4");

  try {
    // Check if the provided videoUrl is a YouTube URL
    if (ytdl.validateURL(videoUrl)) {
      // Download video using ytdl-core
      const videoInfo = await ytdl.getInfo(videoUrl);
      const videoStream = ytdl.downloadFromInfo(videoInfo);
      videoStream.pipe(fs.createWriteStream(outputPath));
    } else {
      // Download the video using axios
      await downloadVideo(videoUrl, outputPath);
    }

    // Extract frames from the downloaded video using ffmpeg
    const frameOutputDir = path.join(__dirname, "frames");
    const framePaths = await extractFrames(outputPath, frameOutputDir);

    console.log("Frames extracted successfully:", framePaths);

    // Create a short video from the frames using ffmpeg
    const outputVideoPath = path.join(__dirname, "frames", "output.mp4");
    await createVideoFromFrames(framePaths, outputVideoPath, 30); // Specify frame rate (e.g., 30 fps)

    console.log("Video created successfully");
    res.status(200).json({ message: "Video processing completed" });
  } catch (error) {
    console.error("Error processing video:", error);
    res.status(500).json({ error: "Video processing failed" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
