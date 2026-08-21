import { Actor, log } from 'apify';
import { fetchDiseaseCounts } from './cdc.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { diseaseKeyword = 'Measles', area = 'U.S. Residents', maxResults = 20 } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const DISEASE_SEARCH_EVENT = 'disease-search';

const results = await fetchDiseaseCounts({
    diseaseKeyword,
    area,
    maxResults: Math.min(maxResults, 200),
});

for (const result of results) {
    await Actor.pushData(result);
}

await Actor.charge({ eventName: DISEASE_SEARCH_EVENT });

log.info(`Pushed ${results.length} record(s)`);

await Actor.exit();
