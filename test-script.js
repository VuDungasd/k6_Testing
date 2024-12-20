import http from "k6/http";
import { check, sleep } from "k6";
// import { randomSeed, randomIntBetween } from "k6/util";

// Cấu hình kịch bản kiểm thử
export let options = {
  scenarios: {
    smoke_test: {
      executor: "shared-iterations",
      vus: 1, // 1 người dùng ảo
      iterations: 5, // 5 lần gọi API
      exec: "smokeTest",
      startTime: "0s",
    },
    load_test: {
      executor: "constant-vus",
      vus: 10, // 10 người dùng ảo
      duration: "30s", // Chạy trong 30 giây
      exec: "loadTest",
      startTime: "10s",
    },
    stress_test: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 50 }, // Tăng đến 50 người dùng trong 30 giây
        { duration: "1m", target: 50 }, // Duy trì tải với 50 người dùng trong 1 phút
        { duration: "1m", target: 100 }, // Tăng đến 100 người dùng trong 1 phút
        { duration: "30s", target: 125 }, // Tăng đến 120 người dùng trong 30 giây
        { duration: "30s", target: 150 }, // Tăng đến 150 người dùng trong 30 giây
        { duration: "30s", target: 200 }, // Tăng đến 200 người dùng trong 30 giây
        { duration: "30s", target: 0 }, // Giảm tải về 0 người dùng
      ],
      exec: "stressTest",
      startTime: "50s",
    },
  },
};

const baseURL = "http://localhost:8899/api/v1/products/filter"; // Thay URL API của bạn

// Tập các query ngẫu nhiên
const querySamples = [
  "m",
  "Điện thoại",
  "Liên quân",
  "Máy ảnh",
  "Lúa gạo",
  "Lúa mì",
  "Đồ chơi",
  "Búp bê",
];

function randomIntBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
// Hàm tạo filters với query ngẫu nhiên
function generateFilters() {
  const randomQuery =
    querySamples[randomIntBetween(0, querySamples.length - 1)];
  return {
    type: 1,
    keyword: randomQuery,
    brand_id: "",
    category_id: "",
    location_ids: [],
    priceFrom: 0,
    priceTo: 10000000,
    sort: 1,
    review: 0,
    page: randomIntBetween(0, 5), // Trang ngẫu nhiên từ 0 đến 5
    size: 10,
  };
}

// Smoke Test
export function smokeTest() {
  const filters = generateFilters();
  const headers = { "Content-Type": "application/json" };

  const res = http.post(baseURL, JSON.stringify(filters), { headers });

  // Kiểm tra phản hồi
  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}

// Load Test
export function loadTest() {
  const filters = generateFilters();
  const headers = { "Content-Type": "application/json" };

  const res = http.post(baseURL, JSON.stringify(filters), { headers });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 800ms": (r) => r.timings.duration < 800,
    "response contains products": (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.products.length >= 0;
    },
  });

  sleep(0.5);
}

// Stress Test
export function stressTest() {
  const filters = generateFilters();
  const headers = { "Content-Type": "application/json" };

  const res = http.post(baseURL, JSON.stringify(filters), { headers });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 1s": (r) => r.timings.duration < 1000,
    "response contains products": (r) => {
      const body = JSON.parse(r.body);
      return body.data && body.data.products.length >= 0;
    },
  });

  sleep(randomIntBetween(1, 3)); // Thời gian nghỉ ngẫu nhiên giữa các yêu cầu
}
