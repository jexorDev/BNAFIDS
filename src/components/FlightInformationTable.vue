<script setup lang="ts">
import { ref, computed } from 'vue';
import axios from 'axios';
import Flight from "../models/Flight.js";

function loadFlights()  {
  axios.get(`${import.meta.env.VITE_API_BASE_URL}/RawFlightData?dispositionType=${disposition.value}&fromDateTime=${getDateTimeFromString('00:00').toISOString()}&toDateTime=${getDateTimeFromString('23:59').toISOString()}`).then((response) => {        
    flights.value = response.data as Flight[];      
  });
}

function formatTime(date: Date): string {
  if (!date) return "";
  return new Date(date).toLocaleTimeString('en-us', { hour: "2-digit", minute: "2-digit"})
}

function buildFlightAwareLink(airline: string, flightNumber: string): string {
  return `https://flightaware.com/live/flight/${airline}${flightNumber}`;
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



const flights = ref<Flight[]>([]);
const disposition = ref(1);
const airline = ref("");
const timeFrom = ref("00:00");
const timeTo = ref("23:59");

const numberResults = computed<number>(() => flights.value.length);

</script>

<template>
  <div>
    <div>FILTERS</div>
    <table>
      <tr>
        <th>
          Disposition:
        </th>
        <th>
          Airline:
        </th>
        <th>
          From:
        </th>
        <th>
          To:
        </th>
        <th></th>
      </tr>
      <tr>
        <td>
          <input type="radio" id="arrivals" name="disposition" value="1" @input="disposition = 1"> 
          <label for="arrivals">Arrivals</label>
          
          <input type="radio" id="departures" name="disposition" value="2" @input="disposition = 2"> 
          <label for="departures">Departures</label>
        </td>
        <td>
          <input v-model="airline" type="text" placeholder="ex: frontier, fft, f9" style="width:200px">
        </td>
        <td>
          <input v-model="timeFrom" type="text" placeholder="00:00" style="width:100px">
        </td>
        <td>
          <input v-model="timeTo" type="text" placeholder="23:59" style="width:100px">
        </td>
        <td>
          <a @click="loadFlights" style="margin-left: 5px; margin-right: 10px;">LOAD</a>
        </td>
      </tr>

    </table>

    <div>NUMBER OF FLIGHTS: {{ numberResults }}</div>  
  
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
