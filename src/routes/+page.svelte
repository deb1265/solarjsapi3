<script lang="ts">
  import * as GMAPILoader from '@googlemaps/js-api-loader';
  const { Loader } = GMAPILoader;
  import { onMount } from 'svelte';
  import SearchBar from './components/SearchBar.svelte';
  import BuildingInsightsSection from './sections/BuildingInsightsSection.svelte';
  import SolarPotentialSection from './sections/SolarPotentialSection.svelte';
  import type { BuildingInsightsResponse } from './solar';
  import Sections from './sections/Sections.svelte';
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  let defaultPlace = { name: '', address: '' };
  let monthlyAverageEnergyBillInput = 0;
  let location: google.maps.LatLng;
  const zoom = 19;
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let buildingInsights: BuildingInsightsResponse;
  let configId = 0;
  let expandedSection = '';
  let showPanels = true;
  let panelCapacityWattsInput = 400;
  let energyCostPerKwhInput = 0.31;
  let dcToAcDerateInput = 0.85;
  let placesLibrary: google.maps.PlacesLibrary;
  onMount(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    defaultPlace = {
      name: urlParams.get('name') || '',
      address: urlParams.get('address') || '',
    };
    monthlyAverageEnergyBillInput = Number(urlParams.get('monthlyAverageEnergyBillInput')) || 0;
    
    const loader = new Loader({ apiKey: googleMapsApiKey });
    const libraries = {
      geometry: loader.importLibrary('geometry'),
      maps: loader.importLibrary('maps'),
    };
    geometryLibrary = await libraries.geometry;
    mapsLibrary = await libraries.maps;

    const geocoder = new google.maps.Geocoder();
    const geocoderResponse = await geocoder.geocode({ address: defaultPlace.address });
    const geocoderResult = geocoderResponse.results[0];

    location = geocoderResult.geometry.location;
    map = new mapsLibrary.Map(mapElement, {
      center: location,
      zoom: zoom,
      tilt: 0,
      mapTypeId: 'satellite',
      mapTypeControl: false,
      fullscreenControl: false,
      rotateControl: false,
      streetViewControl: false,
      zoomControl: false,
    });
  });
</script>

<!-- Top bar -->
<div class="flex flex-row h-full">
  <!-- Main map -->
  <div bind:this={mapElement} class="w-full" />

  <!-- Side bar -->
  <aside class="flex-none md:w-96 w-80 p-2 pt-3 overflow-auto">
    <div class="flex flex-col space-y-2 h-full">
      {#if placesLibrary && map}
        <SearchBar bind:location {placesLibrary} {map} initialValue={defaultPlace.name} />
      {/if}

      <div class="p-4 surface-variant outline-text rounded-lg space-y-3">
      </div>
      {#if location}
        <Sections {location} {map} {geometryLibrary} {googleMapsApiKey} initialMonthlyAverageEnergyBillInput={monthlyAverageEnergyBillInput} />
      {/if}

      <div class="grow" />
      <div class="place-info">
        <span class="label text-lg font-bold mb-1">Design for:</span>
        <h2 class="place-name text-4xl font-bold mb-2">{defaultPlace.name}</h2>
        <p class="place-address text-2xl">{defaultPlace.address}</p>
      </div>
      <span class="pb-4 text-center outline-text label-small">
        
      </span>
    </div>
  </aside>
</div>

<style>
  .place-info {
    margin-bottom: 1.5rem;
  }

  .label {
    font-size: 1.25rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
  }

  .place-name {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .place-address {
    font-size: 1.5rem;
  }
</style>
