

<script lang="ts">
  // Importing necessary components and types
  import type { MdDialog } from '@material/web/dialog/dialog';
  import Expandable from '../components/Expandable.svelte';
  import {
    type BuildingInsightsResponse,
    type RequestError,
    findClosestBuilding,
    type SolarPanelConfig,
  } from '../solar';
  import Show from '../components/Show.svelte';
  import SummaryCard from '../components/SummaryCard.svelte';
  import { createPalette, normalize, rgbToColor } from '../visualize';
  import { panelsPalette } from '../colors';
  import InputBool from '../components/InputBool.svelte';
  import InputPanelsCount from '../components/InputPanelsCount.svelte';
  import { showNumber } from '../utils';
  import NumberInput from '../components/InputNumber.svelte';
  import Gauge from '../components/Gauge.svelte';

  // Exporting props to be used in the component
  export let expandedSection: string;
  export let buildingInsights: BuildingInsightsResponse | undefined;
  export let configId: number | undefined;
  export let panelCapacityWatts: number;
  export let showPanels: boolean;

  // Google Maps related props
  export let googleMapsApiKey: string;
  export let geometryLibrary: google.maps.GeometryLibrary;
  export let location: google.maps.LatLng;
  export let map: google.maps.Map;

  // Static values for the component
  const icon = 'home';
  const title = 'Building Insights endpoint';

  // Reactive state variables
  let requestSent = false;
  let requestError: RequestError | undefined;
  let apiResponseDialog: MdDialog;

  // Determining the panel configuration based on the building insights and configId
  let panelConfig: SolarPanelConfig | undefined;
  $: if (buildingInsights && configId !== undefined) {
    panelConfig = buildingInsights.solarPotential.solarPanelConfigs[configId];
  }

  // Creating solar panels on the map based on the visibility and configuration
  let solarPanels: google.maps.Polygon[] = [];
  $: solarPanels.map((panel, i) =>
    panel.setMap(showPanels && panelConfig && i < panelConfig.panelsCount ? map : null),
  );

  // Calculating the panel capacity ratio based on the building insights
  let panelCapacityRatio = 1.0;
  $: if (buildingInsights) {
    const defaultPanelCapacity = buildingInsights.solarPotential.panelCapacityWatts;
    panelCapacityRatio = panelCapacityWatts / defaultPanelCapacity;
  }

  // Function to show solar potential on the map
  export async function showSolarPotential(location: google.maps.LatLng) {
    if (requestSent) {
      return;
    }

    console.log('showSolarPotential');
    buildingInsights = undefined;
    requestError = undefined;

    // Clearing existing solar panels from the map
    solarPanels.map((panel) => panel.setMap(null));
    solarPanels = [];

    requestSent = true;
    try {
      // Attempting to find the closest building and its solar potential
      buildingInsights = await findClosestBuilding(location, googleMapsApiKey);
    } catch (e) {
      // Handling request errors
      requestError = e as RequestError;
      return;
    } finally {
      // Resetting the request state
      requestSent = false;
    }

    // Creating solar panels on the map based on the building insights
    const solarPotential = buildingInsights.solarPotential;
    const palette = createPalette(panelsPalette).map(rgbToColor);
    const minEnergy = solarPotential.solarPanels.slice(-1)[0].yearlyEnergyDcKwh;
    const maxEnergy = solarPotential.solarPanels[0].yearlyEnergyDcKwh;
    solarPanels = solarPotential.solarPanels.map((panel) => {
      const [w, h] = [solarPotential.panelWidthMeters / 2, solarPotential.panelHeightMeters / 2];
      const points = [
        { x: +w, y: +h }, // top right
        { x: +w, y: -h }, // bottom right
        { x: -w, y: -h }, // bottom left
        { x: -w, y: +h }, // top left
        { x: +w, y: +h }, //  top right
      ];
      const orientation = panel.orientation == 'PORTRAIT' ? 90 : 0;
      const azimuth = solarPotential.roofSegmentStats[panel.segmentIndex].azimuthDegrees;
      const colorIndex = Math.round(normalize(panel.yearlyEnergyDcKwh, maxEnergy, minEnergy) * 255);
      return new google.maps.Polygon({
        paths: points.map(({ x, y }) =>
          geometryLibrary.spherical.computeOffset(
            { lat: panel.center.latitude, lng: panel.center.longitude },
            Math.sqrt(x * x + y * y),
            Math.atan2(y, x) * (180 / Math.PI) + orientation + azimuth,
          ),
        ),
        strokeColor: '#B0BEC5',
        strokeOpacity: 0.9,
        strokeWeight: 1,
        fillColor: palette[colorIndex],
        fillOpacity: 0.9,
      });
    });
  }

  // Automatically showing solar potential when the location changes
  $: showSolarPotential(location);
</script>

{#if requestError}
  <!-- Displaying error message if there's a request error -->
  <div class="error-container on-error-container-text">
    <Expandable section={title} icon="error" {title} subtitle={requestError.error.status}>
      <div class="grid place-items-center py-2 space-y-4">
        <div class="grid place-items-center">
          <p class="body-medium">
            Error on <code>buildingInsights</code> request
          </p>
          <p class="title-large">ERROR {requestError.error.code}</p>
          <p class="body-medium"><code>{requestError.error.status}</code></p>
          <p class="label-medium">{requestError.error.message}</p>
        </div>
        <md-filled-button role={undefined} on:click={() => showSolarPotential(location)}>
          Retry
          <md-icon slot="icon">refresh</md-icon>
        </md-filled-button>
      </div>
    </Expandable>
  </div>
{:else if !buildingInsights}
  <!-- Displaying loading indicator if building insights are not yet loaded -->
  <div class="grid py-8 place-items-center">
    <md-circular-progress four-color indeterminate />
  </div>
{:else if configId !== undefined && panelConfig}
  <!-- Displaying solar potential insights if available -->
  <div class="flex flex-col space-y-2 px-2">
    <!-- Input component for configuring solar panel count -->
    <InputPanelsCount
      bind:configId
      solarPanelConfigs={buildingInsights.solarPotential.solarPanelConfigs}
    />
    <p class="title-large">Yearly energy: {(
      (panelConfig.yearlyEnergyDcKwh * panelCapacityRatio) /
      1000
    ).toFixed(2)} MWh</p>
  </div>


  <div class="mt-4">
    <div class="flex flex-col space-y-2 m-2">
      <SummaryCard
        {icon}
        {title}
        rows={[
          {
            icon: 'wb_sunny',
            name: 'Annual sunshine',
            value: showNumber(buildingInsights.solarPotential.maxSunshineHoursPerYear),
            units: 'hr',
          },
          {
            icon: 'square_foot',
            name: 'Roof area',
            value: showNumber(buildingInsights.solarPotential.wholeRoofStats.areaMeters2),
            units: 'm²',
          },
          {
            icon: 'solar_power',
            name: 'Max panel count',
            value: showNumber(buildingInsights.solarPotential.solarPanels.length),
            units: 'panels',
          },
          {
            icon: 'co2',
            name: 'CO₂ savings',
            value: showNumber(buildingInsights.solarPotential.carbonOffsetFactorKgPerMwh),
            units: 'Kg/MWh',
          },
        ]}
      />

      <!-- Gauges to display solar panel count and yearly energy -->
      <div class="p-4 w-full surface on-surface-text rounded-lg shadow-md">
        <div class="flex justify-around">
          <Gauge
            icon="solar_power"
            title="Panels count"
            label={showNumber(panelConfig.panelsCount)}
            labelSuffix={`/ ${showNumber(solarPanels.length)}`}
            max={solarPanels.length}
            value={panelConfig.panelsCount}
          />

          <Gauge
            icon="energy_savings_leaf"
            title="Yearly energy"
            label={showNumber((panelConfig?.yearlyEnergyDcKwh ?? 0) * panelCapacityRatio)}
            labelSuffix="KWh"
            max={buildingInsights.solarPotential.solarPanelConfigs.slice(-1)[0]
              .yearlyEnergyDcKwh * panelCapacityRatio}
            value={panelConfig.yearlyEnergyDcKwh * panelCapacityRatio}
          />
        </div>
      </div>
    </div>
  </div>

{/if}
