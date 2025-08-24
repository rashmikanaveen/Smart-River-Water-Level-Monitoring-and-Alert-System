import axios from "axios";

const AxiosInstance = axios.create({
  baseURL: "https://your-api-url.com", // Change to your API base URL
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default AxiosInstance;