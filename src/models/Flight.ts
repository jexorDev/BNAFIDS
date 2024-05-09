export default interface Flight {
    actualArrivalTime: Date;
    actualDepartureTime: Date;
    airlineIdentifier: string;
    airlineName: string;
    airportGate: string;    
    cityAirportName: string;
    cityCode: string;
    cityName: string;
    disposition: number;
    estimatedArrivalTime: Date;
    estimatedDepartureTime: Date;
    flightNumber: string;
    scheduledArrivalTime: Date;
    scheduledDepartureTime: Date;
    status: string;

}