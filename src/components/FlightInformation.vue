<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import Flight from "../models/Flight.js";
import GetFlightsResponseBody from '../models/GetFlightsResposneBody.js';
import ResultSetCache from '../models/ResultSetCache.js';

function loadFlights()  {
  status.value = "LOADING..."
  console.log(previousSearchResults.value)
  if (previousSearchResults.value.has(terminalQuery.value)) {
    const previousSearchResult = previousSearchResults.value.get(terminalQuery.value);
    if (!previousSearchResult) return;
    flights.value = previousSearchResult.flights;
    status.value = "LOAD COMPLETE. FLIGHTS LOADED FROM CACHE. APPEND -refersh KEYWORD TO GET LATEST RESULTS."
  } else {      
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/AirportFlights?${parseQueryString(terminalQuery.value)}`).then((response) => {
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
  const parametersFromInput = queryString.split('-');
  const parametersForQueryString: string[] = []
  
  for (var parm of parametersFromInput) {
    
    if (parm.trim().startsWith("arriving")) {
      parametersForQueryString.push("dispositionType=3");
    } else if (parm.trim().startsWith("arrived")) {
      parametersForQueryString.push("dispositionType=1");
    } else if (parm.trim().startsWith("departing")) {
      parametersForQueryString.push("dispositionType=4");
    } else if (parm.trim().startsWith("departed")) {
      parametersForQueryString.push("dispositionType=2");
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

      const fromTimeHourString = fromTime.split(":")[0];
      const fromTimeMinuteString = fromTime.split(":")[1];
      const fromTimeHour = parseInt(fromTimeHourString);
      const fromTimeMinute = parseInt(fromTimeMinuteString);

      const toTimeHourString = toTime.split(":")[0];
      const toTimeMinuteString = toTime.split(":")[1];
      const toTimeHour = parseInt(toTimeHourString);
      const toTimeMinute = parseInt(toTimeMinuteString);

      var fromDate = new Date(Date.now());
      fromDate.setHours(fromTimeHour);
      fromDate.setMinutes(fromTimeMinute);
      fromDate.setSeconds(0);
      parametersForQueryString.push(`dateTimeFrom=${fromDate.toUTCString()}`)

      var toDate = new Date(Date.now());
      toDate.setHours(toTimeHour);
      toDate.setMinutes(toTimeMinute);
      toDate.setSeconds(0);
      parametersForQueryString.push(`dateTimeTo=${toDate.toUTCString()}`)

    }

  }
  
  return parametersForQueryString.join('&')

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
  <div class="container">
    <div>
      <a href="">[PROBLEM AIRLINE REPORT]</a>
      <a href="">[STATISTICS]</a>
      <a href="">[HELP]</a>
    </div>
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
  
    <input type="text"  v-model="terminalQuery" v-on:keyup.enter="loadFlights" :placeholder="terminalPlaceholder"></input>
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
.container {
  position:absolute;
  height: 100%;
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
.terminal {
  bottom: 0;
  width: 100%;
}
.previous-search {
  color: white;
  background-color: gray;
  margin-top: 5px;
  cursor: pointer;
}
a {
  color: orange
}
th {
  text-align: left
}
input[type=text] {
  width: 100%;
  border:none;
  outline: none;
  background:transparent;
  color: limegreen;
  font-family: 'Courier New', Courier, monospace;
  font-weight: bold;
}
</style>
