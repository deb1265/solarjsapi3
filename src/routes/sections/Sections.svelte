<script lang="ts">
  // Global declaration for google object
  /* global google */

  // Importing necessary components and types
  import type { BuildingInsightsResponse } from '../solar';
  import { findSolarConfig } from '../utils';
  import BuildingInsightsSection from './BuildingInsightsSection.svelte';
  import DataLayersSection from './DataLayersSection.svelte';
  import SolarPotentialSection from './SolarPotentialSection.svelte';

  // Exporting props to be used in other components
  export let location: google.maps.LatLng;
  export let map: google.maps.Map;
  export let geometryLibrary: google.maps.GeometryLibrary;
  export let googleMapsApiKey: string;
  export let initialMonthlyAverageEnergyBillInput: number;
  // Local state for building insights, initially undefined
  let buildingInsights: BuildingInsightsResponse | undefined;

  // Local state for UI control
  let expandedSection: string = '';
  let showPanels = true;

  // User input states
  let monthlyAverageEnergyBillInput = initialMonthlyAverageEnergyBillInput;
  let panelCapacityWattsInput = 400;
  let energyCostPerKwhInput = 0.31;
  let dcToAcDerateInput = 0.85;

  // Calculating yearly energy consumption based on user input
  let yearlyKwhEnergyConsumption: number;
  $: yearlyKwhEnergyConsumption = (monthlyAverageEnergyBillInput / energyCostPerKwhInput) * 12;

  // Finding the appropriate solar config based on the yearly consumption
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
    <SolarPotentialSection
      bind:expandedSection
      bind:configId
      bind:monthlyAverageEnergyBillInput
      bind:energyCostPerKwhInput
      bind:panelCapacityWattsInput
      bind:dcToAcDerateInput
      solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
      defaultPanelCapacityWatts={buildingInsights.solarPotential.panelCapacityWatts}
    />
  {/if}
</div>

