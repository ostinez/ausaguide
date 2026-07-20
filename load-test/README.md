# Load Testing Guide

This directory contains scripts and configurations for load testing the Ausaguide application using [K6](https://k6.io/).

---

## 1. Prerequisites

You need to have `k6` installed on your machine.

### Installation
- **macOS** (Homebrew): `brew install k6`
- **Windows** (Chocolatey): `choco install k6`
- **Windows** (Winget): `winget install gnu.k6`
- **Linux** (Debian/Ubuntu):
  ```bash
  sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5D85C49EE11E1D5CBB77F7975680DF110C50DE0
  echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update
  sudo apt-get install k6
  ```

---

## 2. Test Configuration

The script `load-test-script.js` simulates three concurrent user scenarios over a period of 30 seconds:
1. **100 concurrent users** browsing tours (`/tours`).
2. **50 concurrent users** booking tours (`/api/bookings`).
3. **20 concurrent users** sending messages (`/api/messages`).

---

## 3. Running the Load Test

### A. Local Development Run
To test against a local running Vite dev server (usually `http://localhost:5173`):
```bash
k6 run load-test-script.js
```

### B. Custom Target Environment Run
You can override the target URL using the `BASE_URL` environment variable:
```bash
k6 run --env BASE_URL=https://your-production.app load-test-script.js
```

---

## 4. Analyzing Results

Once complete, K6 reports the following metrics:
- `http_req_duration`: Request latency (95th percentile should be `< 1500ms`).
- `http_req_failed`: Error rate (should be `< 5.00%`).
- `http_reqs`: Total throughput (requests per second).
- `vus`: Active Virtual Users.
