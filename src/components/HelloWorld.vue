<script setup lang="ts">
import { onMounted } from 'vue';
import axios from 'axios';

onMounted(() => {
  axios.get('https://fidsapi.azurewebsites.net/AirportFlights').then((data) => {
    console.log(data);
  });
});
</script>

<template>
  <div style="background-color: 999999">blah</div>

  <textarea class="terminal"></textarea>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
.termainal {
  bottom: 0;
}
</style>
