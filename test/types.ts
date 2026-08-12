import axios from "axios";
import {
  UniDownloadAdapter,
  UniUploadAdapter,
  type UniDownloadOptions,
  type UniUploadOptions,
} from "../index";

const upload: UniUploadOptions = {
  filePath: "/tmp/photo.jpg",
  name: "avatar",
  formData: { userId: "1" },
};

axios.post("/files", undefined, {
  adapter: UniUploadAdapter,
  uniUpload: upload,
});

const download: UniDownloadOptions = {
  filePath: "/tmp/archive.zip",
};

axios.get("/files/archive", {
  adapter: UniDownloadAdapter,
  uniDownload: download,
});
