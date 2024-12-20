import http from "k6/http";
import { check, sleep } from "k6";

// Chọn loại test (smoke, load, stress) dựa trên tham số dòng lệnh
export let options = {};

const testType = __ENV.TEST_TYPE || "smoke"; // Mặc định là smoke nếu không truyền tham số TEST_TYPE

if (testType === "smoke") {
  options = {
    vus: 1, // 1 người dùng ảo
    duration: "30s", // Kiểm tra trong 30 giây
  };
} else if (testType === "load") {
  options = {
    stages: [
      { duration: "1m", target: 50 }, // Tăng dần lên 50 người dùng trong 1 phút
      { duration: "3m", target: 50 }, // Duy trì 50 người dùng trong 3 phút
      { duration: "1m", target: 0 }, // Giảm tải về 0 người dùng
    ],
  };
} else if (testType === "stress") {
  options = {
    stages: [
      { duration: "30s", target: 100 }, // Tăng lên 100 người dùng trong 30 giây
      { duration: "1m", target: 500 }, // Tăng lên 500 người dùng trong 1 phút
      { duration: "30s", target: 1000 }, // Tăng lên 1.000 người dùng
      { duration: "30s", target: 0 }, // Giảm tải về 0 người dùng
    ],
  };
} else {
  throw new Error(`Unknown TEST_TYPE: ${testType}`);
}

export default function () {
  const url = "http://localhost:8899/api/v1/categories/list"; // Thay URL này bằng endpoint API của bạn

  const res = http.get(url);

  if (testType === "smoke") {
    // Kịch bản cho Smoke Test
    check(res, {
      "status is 200": (r) => r.status === 200,
      "response time < 500ms": (r) => r.timings.duration < 500,
    });
    sleep(1); // Nghỉ 1 giây giữa các yêu cầu
  } else if (testType === "load") {
    // Kịch bản cho Load Test
    check(res, {
      "status is 200": (r) => r.status === 200,
      "response time < 1000ms": (r) => r.timings.duration < 1000,
    });
  } else if (testType === "stress") {
    // Kịch bản cho Stress Test
    check(res, {
      "status is 200 or 429": (r) => r.status === 200 || r.status === 429, // Chấp nhận lỗi 429 (Too Many Requests)
      "response time < 2000ms": (r) => r.timings.duration < 2000,
    });
  }
}
