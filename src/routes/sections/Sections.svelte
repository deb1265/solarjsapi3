

<script lang="ts">
  /* global google */

  import type { BuildingInsightsResponse } from '../solar';
  import { findSolarConfig } from '../utils';
  import BuildingInsightsSection from './BuildingInsightsSection.svelte';
  import DataLayersSection from './DataLayersSection.svelte';

  export let location: google.maps.LatLng;
  export let map: google.maps.Map;
  export let geometryLibrary: google.maps.GeometryLibrary;
  export let googleMapsApiKey: string;

  let buildingInsights: BuildingInsightsResponse | undefined;

  // State
  let expandedSection: string = '';
  let showPanels = true;

  // User settings
  let monthlyAverageEnergyBillInput = 300;
  let panelCapacityWattsInput = 400;
  let energyCostPerKwhInput = 0.31;
  let dcToAcDerateInput = 1.35;

  // Find the config that covers the yearly energy consumption.
  let yearlyKwhEnergyConsumption: number;
  $: yearlyKwhEnergyConsumption = (monthlyAverageEnergyBillInput / energyCostPerKwhInput) * 12;

  let configId: number | undefined;
  $: if (configId === undefined && buildingInsights) {
    const defaultPanelCapacity = buildingInsights.solarPotential.panelCapacityWatts;
    const panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacity;
    configId = findSolarConfig(
      buildingInsights.solarPotential.solarPanelConfigs,
      yearlyKwhEnergyConsumption,
      panelCapacityRatio,
      dcToAcDerateInput,
    );
  }
</script>

<div class="flex flex-col rounded-md shadow-md">
  {#if geometryLibrary && map}
    <BuildingInsightsSection
      bind:expandedSection
      bind:buildingInsights
      bind:configId
      bind:showPanels
      bind:panelCapacityWatts={panelCapacityWattsInput}
      {googleMapsApiKey}
      {geometryLibrary}
      {location}
      {map}
    />
  {/if}

  {#if buildingInsights && configId !== undefined}
    <md-divider inset />
    <DataLayersSection
      bind:expandedSection
      bind:showPanels
      {googleMapsApiKey}
      {buildingInsights}
      {geometryLibrary}
      {map}
    />
  {/if}
</div>
