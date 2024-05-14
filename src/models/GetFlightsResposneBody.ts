import Flight from "./Flight";

export default interface GetFlightsResponseBody {
    nextDataPageUrl: string;
    results: Flight[];
}