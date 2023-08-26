import schedule from "node-schedule"
import { IngestSeasons } from './ingestSeasons'

// Season job
export const runJobs = () => {
    schedule.scheduleJob('1 * * * *', IngestSeasons)
}