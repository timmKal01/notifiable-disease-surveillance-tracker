import { log } from 'apify';

const BASE_URL = 'https://data.cdc.gov/resource/x9gk-5huc.json';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000;

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

/** Escapes a value for safe embedding inside a Socrata SoQL string literal. */
function escapeSoqlString(value) {
    return String(value).replace(/'/g, "''");
}

function toNumber(value) {
    if (typeof value !== 'string' && typeof value !== 'number') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

export async function fetchDiseaseCounts({ diseaseKeyword, area, maxResults }) {
    const where = [
        `upper(label) like upper('%${escapeSoqlString(diseaseKeyword)}%')`,
        `states = '${escapeSoqlString(area)}'`,
    ].join(' AND ');

    const url = new URL(BASE_URL);
    url.searchParams.set('$where', where);
    url.searchParams.set('$order', 'year DESC, week DESC, label ASC');
    url.searchParams.set('$limit', String(maxResults));

    let lastErr;
    let rows = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            const res = await fetchWithTimeout(url);
            const body = await res.json().catch(() => null);

            if (res.ok && Array.isArray(body)) {
                rows = body;
                break;
            }

            const retryable = res.status === 429 || res.status >= 500 || body === null;
            const message = body && typeof body === 'object' && body.message ? body.message : `${res.status} ${res.statusText}`;
            lastErr = new Error(`CDC NNDSS API request failed: ${message}`);
            if (!retryable) throw lastErr;
        } catch (err) {
            lastErr = err.name === 'AbortError'
                ? new Error(`CDC NNDSS API request timed out (attempt ${attempt}/${MAX_ATTEMPTS})`)
                : err;
        }
        if (attempt < MAX_ATTEMPTS) {
            const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
            log.warning(`Retrying CDC NNDSS request in ${delay}ms (attempt ${attempt}/${MAX_ATTEMPTS}): ${lastErr.message}`);
            await new Promise((r) => setTimeout(r, delay));
        }
    }
    if (rows === null) throw lastErr;

    const results = [];
    for (const row of rows) {
        try {
            if (!row || typeof row !== 'object') continue;
            results.push({
                disease: row.label ?? null,
                reportingArea: row.states ?? null,
                mmwrYear: row.year ?? null,
                mmwrWeek: row.week ?? null,
                currentWeekCount: toNumber(row.m1),
                currentWeekFlag: row.m1_flag ?? null,
                previous52WeekMax: toNumber(row.m2),
                previous52WeekMaxFlag: row.m2_flag ?? null,
                cumulativeYtdCurrentYear: toNumber(row.m3),
                cumulativeYtdCurrentYearFlag: row.m3_flag ?? null,
                cumulativeYtdPreviousYear: toNumber(row.m4),
                cumulativeYtdPreviousYearFlag: row.m4_flag ?? null,
            });
        } catch (err) {
            log.warning(`Skipping malformed NNDSS record: ${err.message}`);
        }
    }
    return results;
}
