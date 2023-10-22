// src/VideoProcessor.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styless.css";
function VideoProcessing() {
  const [videoUrl, setVideoUrl] = useState("");
  const [processing, setProcessing] = useState(false);
  const [videoProcessed, setVideoProcessed] = useState(false);
  const handleVideoUrlChange = (e) => {
    setVideoUrl(e.target.value);
  };

  useEffect(() => {
    setVideoProcessed(true);
  }, []);

  const handleProcessClick = async () => {
    setProcessing(true);

    try {
      // Send a request to the backend to start the video processing
      await axios.post("http://38.242.239.1:5000/processVideo", { videoUrl });
      alert("Video processing started!");
    } catch (error) {
      console.error("Error processing video:", error);
      alert("Error processing video");
    } finally {
      setProcessing(false);
    }
  };

  const onButtonClick = () => {
    const pdfUrl = "http://38.242.239.1:5000/video/output.mp4";
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "short.mp4"; // specify the filename
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container">
      <h1 className="title">Video Processor</h1>
      <input
        type="text"
        className="input"
        placeholder="Enter Video URL"
        value={videoUrl}
        onChange={handleVideoUrlChange}
      />
      <button
        onClick={handleProcessClick}
        disabled={processing}
        className="button"
      >
        <h2 className="button-text">
          {processing ? "Processing..." : "Process Video"}{" "}
        </h2>
      </button>
      {/* Render the video element if video has been processed */}
      {videoProcessed && (
        <div className="video-container">
          <h2 className="video-title">Processed Video</h2>
          <video controls className="video-player" width="390" height="200">
            <source
              src="http://localhost:5000/video/output.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
          <button onClick={onButtonClick}>Download Video</button>
          {/* <h2 className="button-text">Download Video</h2> */}
        </div>
      )}
    </div>
  );
}

export default VideoProcessing;
