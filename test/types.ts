import axios from "axios";
import {
  UniUploadAdapter,
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
