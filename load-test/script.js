import http from 'k6/http';
import { sleep, check } from 'k6';

// Define load testing scenarios to match concurrent requirements:
// - 100 virtual users browsing tours (GET /tours)
// - 50 virtual users viewing a specific tour (GET /tours/:id)
// - 20 virtual users booking a tour (POST /api/bookings)
export const options = {
  scenarios: {
    browse_tours: {
      executor: 'constant-vus',
      vus: 100,
      duration: '30s',
      exec: 'browseTours',
    },
    view_single_tour: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30s',
      exec: 'viewSingleTour',
    },
    book_tours: {
      executor: 'constant-vus',
      vus: 20,
      duration: '30s',
      exec: 'bookTours',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], // Error rate must be less than 5%
    http_req_duration: ['p(95)<1500'], // 95% of requests must complete under 1.5s
  },
};

// Target base URL (can be customized using --env BASE_URL=https://your-production.app)
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';

// Scenario 1: Browse Tours (GET /tours)
export function browseTours() {
  const res = http.get(`${BASE_URL}/tours`);
  check(res, {
    'browse tours status is 200': (r) => r.status === 200,
  });
  sleep(1); // Simulate user think time of 1 second
}

// Scenario 2: View a specific tour (GET /tours/:id)
export function viewSingleTour() {
  const tourId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01'; // Default seed tour ID
  const res = http.get(`${BASE_URL}/tours/${tourId}`);
  check(res, {
    'view single tour status is 200 or 404': (r) => r.status === 200 || r.status === 404,
  });
  sleep(1.5);
}

// Scenario 3: Book Tours (POST /bookings simulating payment/creation flows)
export function bookTours() {
  const payload = JSON.stringify({
    tour_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01',
    guest_name: 'Load Test Guest',
    guest_email: 'guest@loadtest.com',
    guest_phone: '+254700123456',
    booking_date: '2026-09-15',
    guest_count: 2,
    total_price: 7000
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.post(`${BASE_URL}/api/bookings`, payload, params);
  
  check(res, {
    'booking request received status is 200, 201 or 404': (r) => r.status === 200 || r.status === 201 || r.status === 404,
  });
  sleep(2);
}
