export default interface Flight {
    actualArrivalTime: Date;
    actualDepartureTime: Date;
    airlineIdentifier: string;
    airlineName: string;
    airportGate: string;    
    cityAirportname: string;
    cityCode: string;
    cityName: string;
    disposition: number;
    flightNumber: string;
    scheduledArrivalTime: Date;
    scheduledDepartureTime: Date;
    status: string;

}