<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import Flight from "../models/Flight.js";
import GetFlightsResponseBody from '../models/GetFlightsResposneBody.js';
import ResultSetCache from '../models/ResultSetCache.js';

function loadFlights()  {
  if (previousSearchResults.value.has(terminalQuery.value)) {
    const previousSearchResult = previousSearchResults.value.get(terminalQuery.value);
    if (!previousSearchResult) return;
    flights.value = previousSearchResult.flights;
    status.value = "LOAD COMPLETE. FLIGHTS LOADED FROM CACHE. APPEND -refersh KEYWORD TO GET LATEST RESULTS."
  } else {      
      const apiParameters = parseQueryString(terminalQuery.value);
      if (apiParameters === "") return;

      status.value = "LOADING..."
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/AirportFlights?${apiParameters}`).then((response) => {
        const responseBody = response.data as GetFlightsResponseBody;
        flights.value = responseBody.results;
        nextDataPageUrl.value = responseBody.nextDataPageUrl;
        previousSearchResults.value.set(terminalQuery.value, {flights: responseBody.results, nextDataPageurl: responseBody.nextDataPageUrl, dataPullTimestamp: new Date()});
      }).finally(() => status.value = "LOAD COMPLETE. ALL FLIGHTS LISTED ARE FOR TODAY.");
  }
}

function loadNextPageFlights() {
   axios.get(`${import.meta.env.VITE_API_BASE_URL}/AirportFlights?parmString=blah&nextDataPageUrl=${nextDataPageUrl.value}`).then((response) => {
      const previousSearchResult = previousSearchResults.value.get(terminalQuery.value);
      if (!previousSearchResult) return;
      const responseBody = response.data as GetFlightsResponseBody;
      flights.value = [...flights.value, ...responseBody.results];
      nextDataPageUrl.value = responseBody.nextDataPageUrl;
      previousSearchResults.value.set(terminalQuery.value, {flights: [...previousSearchResult.flights, ...responseBody.results], nextDataPageurl: responseBody.nextDataPageUrl, dataPullTimestamp: new Date()});
    }).finally(() => status.value = "LOAD COMPLETE. ALL FLIGHTS LISTED ARE FOR TODAY.");
}

function executePreviousSearch(query: string) {
  terminalQuery.value = query;
  loadFlights();
}

function formatTime(date: Date): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString('en-us', { hour: "2-digit", minute: "2-digit"})
}

function buildFlightAwareLink(airline: string, flightNumber: string): string {
  return `https://flightaware.com/live/flight/${airline}${flightNumber}`;
}

function parseQueryString(queryString: string): string {
  let hasDispostion = false;
  let hasTimeFrame = false;
  
  const parametersFromInput = queryString.split('-');
  const parametersForQueryString: string[] = []
  
  for (var parm of parametersFromInput) {
    
    if (parm.trim().startsWith("arriving")) {
      parametersForQueryString.push("dispositionType=3");
      hasDispostion = true;
    } else if (parm.trim().startsWith("arrived")) {
      parametersForQueryString.push("dispositionType=1");
      hasDispostion = true;
    } else if (parm.trim().startsWith("departing")) {
      parametersForQueryString.push("dispositionType=4");
      hasDispostion = true;
    } else if (parm.trim().startsWith("departed")) {
      parametersForQueryString.push("dispositionType=2");
      hasDispostion = true;
    }

    if (parm.trim().startsWith("airline")) {
      parametersForQueryString.push(`airline=${parm.split(' ')[1]}`)
    }

    if (parm.trim().startsWith("airport")) {
      parametersForQueryString.push(`airport=${parm.split(' ')[1]}`)
    }

    if (parm.trim().startsWith("between")) {
      const fromTime = parm.split(' ')[1];
      const toTime = parm.split(' ')[2];
      
      parametersForQueryString.push(`dateTimeFrom=${getDateTimeFromString(fromTime).toUTCString()}`);
      parametersForQueryString.push(`dateTimeTo=${getDateTimeFromString(toTime).toUTCString()}`);
      
      hasTimeFrame = true;
    } else if(parm.trim().startsWith("at")) {
      const atTimeString = parm.split(' ')[1];
      const fromTime = getDateTimeFromString(atTimeString);
      const toTime = getDateTimeFromString(atTimeString);
      
      //create 1 hour window
      fromTime.setMinutes(fromTime.getMinutes() - 30);
      toTime.setMinutes(toTime.getMinutes() + 30);
      
      parametersForQueryString.push(`dateTimeFrom=${fromTime.toUTCString()}`)
      parametersForQueryString.push(`dateTimeTo=${toTime.toUTCString()}`)

      hasTimeFrame = true;
    }
  }

  if (!hasDispostion) {
    status.value = "ERROR: PLEASE SPECIFY FLIGHT DISPOSITION USING -ARRIVING, -ARRIVED, -DEPARTING, -DEPARTED KEYWORDS";
    return "";
  } else if (!hasTimeFrame) {
    status.value = "ERROR: PLEASE SPECIFY FLIGHT TIME FRAME USING -BETWEEN, -AT KEYWORDS"
    return "";
  }
  
  return parametersForQueryString.join('&')

}

function getDateTimeFromString(timeString: string): Date  {
    const timeHourString = timeString.split(":")[0];
    const timeMinuteString = timeString.split(":")[1];
    const timeHour = parseInt(timeHourString);
    const timeMinute = parseInt(timeMinuteString);
    var date = new Date(Date.now());
    date.setHours(timeHour);
    date.setMinutes(timeMinute);
    date.setSeconds(0);

    return date;
}

const previousSearchQueries = computed<string[]>(() => {
  
  return [...previousSearchResults.value.keys()];
})

const terminalPlaceholder = "-arriving frontier -between 16:00 17:30 -from den";
const status = ref("WELCOME TO FASTT - FLIGHT AWARE SIMPLIFIED TABULATED TERMINAL. ENTER A QUERY BELOW TO GET FLIGHT INFORMATION")
const terminalQuery = ref("");
const flights = ref<Flight[]>([]);
const previousSearchResults = ref<Map<string, ResultSetCache>>(new Map<string, ResultSetCache>());
const nextDataPageUrl = ref<string | null>(null);

</script>

<template>
  <div>
   
    <div class="header" v-text="status"></div>
  
    <table class="flight-table">
      <tr>
        <th>
          AIRLINE
        </th>
        <th>
          FLIGHT
        </th>
        <th>TO/FROM</th>
        <th>
          SCHEDULED
        </th>
        <th>ESTIMATED</th>
        <th>ACTUAL</th>
        <th>STATUS</th>
        <th>GATE</th>
      </tr>
      <tr v-for="flight in flights">
        <td>{{ flight.airlineName }}</td>
        <td><a :href="buildFlightAwareLink(flight.airlineIdentifier, flight.flightNumber)" target="_blank">{{ flight.airlineIdentifier }}{{ flight.flightNumber }}</a></td>
        <td>{{ flight.cityName }}-{{ flight.cityAirportName }}</td>

        <td>{{ formatTime(flight.disposition == 0 ? flight.scheduledArrivalTime : flight.scheduledDepartureTime) }}</td>
        <td>{{ formatTime(flight.disposition == 0 ? flight.estimatedArrivalTime : flight.estimatedDepartureTime) }}</td>
        <td>{{ formatTime(flight.disposition == 0 ? flight.actualArrivalTime : flight.actualDepartureTime) }}</td>
        <td>{{ flight.status }}</td>

        <td>{{ flight.airportGate }}</td>
      </tr>
      
      </table>
      <a v-show="nextDataPageUrl" @click="loadNextPageFlights">LOAD MORE RESULTS</a>
  
    <input type="text" class="query-input"  v-model="terminalQuery" v-on:keyup.enter="loadFlights" :placeholder="terminalPlaceholder"></input>
    <div v-show="previousSearchQueries.length > 0">
      PREVIOUS SEARCHES
    </div>
    <div v-for="query in previousSearchQueries">
      <div @click="executePreviousSearch(query)" class="previous-search" v-text="query"></div>
    </div>
  </div>
</template>

<style scoped>
.header {
  background-color: white;
  color: black;
  width: 100%;
}
.flight-table {
  width: 100%;
  height: 90%;
}
table, th, td {
  border-style: dashed;
  border-width: 1px;
  border-collapse: collapse;
}
.previous-search {
  color: white;
  background-color: gray;
  margin-top: 5px;
  cursor: pointer;
}
.query-input {
  width: 100%;
}
th {
  text-align: left
}

</style>
