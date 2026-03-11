/**
 * Calls external ML service to predict consultation duration.
 * Returns duration in minutes.
 * Falls back to null if ML service fails.
 */

const ML_SERVICE_BASE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const circuitBreaker = {
  failures: 0,
  openUntil: null,

  isOpen() {
    if (!this.openUntil) return false;
    if (Date.now() >= this.openUntil) {
      this.openUntil = null;
      this.failures = 0;
      return false;
    }
    return true;
  },

  recordSuccess() {
    this.failures = 0;
    this.openUntil = null;
  },

  recordFailure() {
    this.failures += 1;
    if (this.failures >= 3) {
      this.openUntil = Date.now() + 2 * 60 * 1000;
      console.warn(`[mlClient] Circuit breaker OPEN until ${new Date(this.openUntil).toISOString()}`);
    }
  },
};

async function mlFetch(path, options = {}, attempt = 1) {
  if (circuitBreaker.isOpen()) {
    throw Object.assign(new Error('Circuit breaker open'), { code: 'CIRCUIT_OPEN' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 500);

  try {
    const response = await fetch(`${ML_SERVICE_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const body = await response.text();
      throw Object.assign(new Error(`ML service ${response.status}: ${body}`), {
        code: 'ML_HTTP_ERROR',
        status: response.status,
      });
    }

    const data = await response.json();
    circuitBreaker.recordSuccess();
    return data;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError' && attempt === 1) {
      await new Promise((r) => setTimeout(r, 100));
      return mlFetch(path, options, 2);
    }

    if (err.code !== 'CIRCUIT_OPEN' && err.code !== 'ML_HTTP_ERROR') {
      circuitBreaker.recordFailure();
    }

    throw err;
  }
}

export async function predictDuration({ doctor_id, visit_type, day_of_week, time_slot, month, patient_age_group, corrected_baseline }) {
  return mlFetch('/predict/duration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doctor_id, visit_type, day_of_week, time_slot, month, patient_age_group, corrected_baseline }),
  });
}

export async function healthCheck() {
  return mlFetch('/health', { method: 'GET' });
}
