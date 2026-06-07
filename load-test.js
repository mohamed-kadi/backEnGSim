import http from "k6/http";
import { sleep, check } from "k6";

// Configuration: 10 concurrent users running for 5 minutes
export const options = {
  vus: 10,
  duration: "5m",
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests should be below 500ms normally
  },
};

const BASE_URL = __ENV.BASE_URL || "http://host.docker.internal:8080/api/users";

export default function () {
  // 1. Simulate a READ operation
  let getRes = http.get(`${BASE_URL}/1`);
  check(getRes, {
    "GET status is 200": (r) => r.status === 200,
    "GET response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);

  // 2. Simulate a WRITE operation
  let payload = JSON.stringify({
    username: "load_user_" + __VU + "_" + __ITER,
    email: "load" + __VU + "@example.com",
  });

  let postRes = http.post(BASE_URL, payload, {
    headers: { "Content-Type": "application/json" },
  });
  check(postRes, {
    "POST status is 200": (r) => r.status === 200,
    "POST response time < 500ms": (r) => r.timings.duration < 500,
  });

  sleep(1);
}
