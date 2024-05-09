<script setup lang="ts">
import { ref } from 'vue';
import axios from 'axios';
import Flight from "../models/Flight";

function loadFlights()  {
  status.value = "LOADING..."
  axios.get(`https://fidsapi.azurewebsites.net/AirportFlights?parmString=${terminalQuery.value}`).then((response) => {
    flights.value = response.data;
  }).finally(() => status.value = "LOAD COMPLETE. ALL FLIGHTS LISTED ARE FOR TODAY.");
}

function formatTime(date: Date): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString('en-us', { hour: "2-digit", minute: "2-digit"})
}

const terminalPlaceholder = "-arriving frontier -between 16:00 17:30 -from den";
const status = ref("")
const terminalQuery = ref("");
const flights = ref<Flight[]>([]);
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
        <td>{{ flight.airlineIdentifier }}{{ flight.flightNumber }}</td>
        <td>{{ flight.cityName }}-{{ flight.cityAirportName }}</td>

        <td>{{ formatTime(flight.disposition == 0 ? flight.scheduledArrivalTime : flight.scheduledDepartureTime) }}</td>
        <td>{{ formatTime(flight.disposition == 0 ? flight.estimatedArrivalTime : flight.estimatedDepartureTime) }}</td>
        <td>{{ formatTime(flight.disposition == 0 ? flight.actualArrivalTime : flight.actualDepartureTime) }}</td>
        <td>{{ flight.status }}</td>

        <td>{{ flight.airportGate }}</td>
      </tr>
      
      </table>
  
    <input type="text" class="terminal" v-model="terminalQuery" v-on:keyup.enter="loadFlights" :placeholder="terminalPlaceholder"></input>

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
th {
  text-align: left
}
</style>
