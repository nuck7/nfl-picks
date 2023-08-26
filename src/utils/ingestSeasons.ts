import { Timestamp, doc, setDoc } from "firebase/firestore";
import { getSeason, getSeasons } from "../resources/espn";
import { EspnSeasons, EspnRef, SeasonCreate } from "../types";
import { db } from "../resources/firebase.config";

export const IngestSeasons = () => {
    console.log("IngestSeasons")

    const getSeasonsEspn = async () => {
        const response = await getSeasons()
        processSeasons(response)
    }
    getSeasonsEspn().catch(console.error);
}

const processSeasons = async (seasons: EspnSeasons) => {
    let transformedSeasons = await Promise.all(seasons.items.map(async (seasonRef):Promise<any> => transformSeason(seasonRef)))
    createFirebaseSeason(transformedSeasons)
}

const transformSeason = async (seasonRef: EspnRef): Promise<any>=> {
    const season = await getSeason(seasonRef.$ref)
    if (season != null) {
        return {
            id: season.year.toString(),
            name: season.displayName,
            start: Timestamp.fromDate(new Date(season.startDate)),
            end: Timestamp.fromDate(new Date(season.endDate)),
        }
    }
}

const createFirebaseSeason = async (seasons: SeasonCreate[]) => {
    console.log("CREATE FIREBASE")
    for (const season of seasons) {
        await setDoc(doc(db, "seasons"), season);
    }
}