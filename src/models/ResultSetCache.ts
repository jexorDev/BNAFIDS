import Flight from "./Flight";

export default interface ResultSetCache {
    flights: Flight[];
    dataPullTimestamp: Date;
    nextDataPageurl: string | null;
}