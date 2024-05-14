<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import Flight from "../models/Flight";
import GetFlightsResponseBody from '../models/GetFlightsResposneBody';
import ResultSetCache from '../models/ResultSetCache';

function loadFlights()  {
  status.value = "LOADING..."
  console.log(previousSearchResults.value)
  if (previousSearchResults.value.has(terminalQuery.value)) {
    const previousSearchResult = previousSearchResults.value.get(terminalQuery.value);
    if (!previousSearchResult) return;
    flights.value = previousSearchResult.flights;
    status.value = "LOAD COMPLETE. FLIGHTS LOADED FROM CACHE. APPEND -refersh KEYWORD TO GET LATEST RESULTS."
  } else {      
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/AirportFlights?parmString=${terminalQuery.value}`).then((response) => {
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

const previousSearchQueries = computed<string[]>(() => {
  
  return [...previousSearchResults.value.keys()];
})

const terminalPlaceholder = "-arriving frontier -between 16:00 17:30 -from den";
const status = ref("")
const terminalQuery = ref("");
const flights = ref<Flight[]>([]);
const previousSearchResults = ref<Map<string, ResultSetCache>>(new Map<string, ResultSetCache>());
const nextDataPageUrl = ref<string | null>(null);

</script>

<template>
  <div class="container">
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
  
    <input type="text" class="terminal" v-model="terminalQuery" v-on:keyup.enter="loadFlights" :placeholder="terminalPlaceholder"></input>
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
  top: 0;
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
th {
  text-align: left
}
</style>
