<script lang="ts">
  /* global google */

  import { slide } from 'svelte/transition';

  import Expandable from '../components/Expandable.svelte';
  import SummaryCard from '../components/SummaryCard.svelte';
  import type { SolarPanelConfig } from '../solar';
  import Table from '../components/Table.svelte';
  
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  import { GoogleCharts } from 'google-charts';
  import { findSolarConfig, showMoney, showNumber } from '../utils';
  import InputNumber from '../components/InputNumber.svelte';
  import InputPanelsCount from '../components/InputPanelsCount.svelte';
  import InputMoney from '../components/InputMoney.svelte';
  import InputPercent from '../components/InputPercent.svelte';
  import InputRatio from '../components/InputRatio.svelte';

  export let expandedSection: string = 'Solar savings analysis';
  export let configId: number;
  export let monthlyAverageEnergyBillInput: number;
  export let energyCostPerKwhInput: number;
  export let panelCapacityWattsInput: number;
  export let dcToAcDerateInput: number;
  export let solarPanelConfigs: SolarPanelConfig[];
  export let defaultPanelCapacityWatts: number;

  const icon = 'payments';
  const title = 'Solar savings analysis';

  let costChart: HTMLElement;
  let showAdvancedSettings = false;

  // [START solar_potential_calculations]
  // Solar configuration, from buildingInsights.solarPotential.solarPanelConfigs
  let panelsCount = 20;
  let yearlyEnergyDcKwh = 12000;

  // Basic settings
  let monthlyAverageEnergyBill: number = 300;
  let energyCostPerKwh = 0.31;
  let panelCapacityWatts = 400;
  let solarIncentives: number = 0;
  let installationCostPerWatt: number = 4.0;
  let installationLifeSpan: number = 20;

  // Advanced settings
  let dcToAcDerate = 0.85;
  let efficiencyDepreciationFactor = 0.995;
  let costIncreaseFactor = 1.06;
  let discountRate = 1.04;

  // Solar installation
  let installationSizeKw: number = (panelsCount * panelCapacityWatts) / 1000;
  let installationCostTotal: number = installationCostPerWatt * installationSizeKw * 1000;

  // Energy consumption
  let monthlyKwhEnergyConsumption: number = monthlyAverageEnergyBill / energyCostPerKwh;
  let yearlyKwhEnergyConsumption: number = monthlyKwhEnergyConsumption * 12;

  // Energy produced for installation life span
  let initialAcKwhPerYear: number = yearlyEnergyDcKwh * dcToAcDerate;
  let yearlyProductionAcKwh: number[] = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year,
  );

  // Cost with solar for installation life span
  let yearlyUtilityBillEstimates: number[] = yearlyProductionAcKwh.map(
    (yearlyKwhEnergyProduced, year) => {
      const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
      const billEstimate =
        (billEnergyKwh * energyCostPerKwh *2*costIncreaseFactor ** year) / discountRate ** year;
      return Math.max(billEstimate, 0); // bill cannot be negative
    },
  );
  let remainingLifetimeUtilityBill: number = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
  let totalCostWithSolar: number =
    installationCostTotal + remainingLifetimeUtilityBill - solarIncentives;
  console.log(`Cost with solar: $${totalCostWithSolar.toFixed(2)}`);

  // Cost without solar for installation life span
  let yearlyCostWithoutSolar: number[] = [...Array(installationLifeSpan).keys()].map(
    (year) => (monthlyAverageEnergyBill * 12 * costIncreaseFactor ** year) / discountRate ** year,
  );
  let totalCostWithoutSolar: number = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
  console.log(`Cost without solar: $${totalCostWithoutSolar.toFixed(2)}`);

  // Savings with solar for installation life span
  let savings: number = totalCostWithoutSolar - totalCostWithSolar*0.45;
  console.log(`Savings: $${savings.toFixed(2)} in ${installationLifeSpan} years`);
  // [END solar_potential_calculations]

  // Reactive calculations
  let panelCapacityRatio: number = 1.0;
  $: panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacityWatts;
  $: installationCostTotal = installationCostPerWatt * installationSizeKw * 1000;
  $: if (solarPanelConfigs[configId]) {
    installationSizeKw = (solarPanelConfigs[configId].panelsCount * panelCapacityWattsInput) / 1000;
  }
  $: monthlyKwhEnergyConsumption = monthlyAverageEnergyBillInput / energyCostPerKwhInput;
  $: yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
  $: if (solarPanelConfigs[configId]) {
    initialAcKwhPerYear =
      solarPanelConfigs[configId].yearlyEnergyDcKwh * panelCapacityRatio * dcToAcDerateInput;
  }
  $: yearlyProductionAcKwh = [...Array(installationLifeSpan).keys()].map(
    (year) => initialAcKwhPerYear * efficiencyDepreciationFactor ** year,
  );
  $: yearlyUtilityBillEstimates = yearlyProductionAcKwh.map((yearlyKwhEnergyProduced, year) => {
    const billEnergyKwh = yearlyKwhEnergyConsumption - yearlyKwhEnergyProduced;
    const billEstimate =
      (billEnergyKwh * energyCostPerKwhInput * costIncreaseFactor ** year) / discountRate ** year;
    return Math.max(billEstimate, 0); // bill cannot be negative
  });
  $: remainingLifetimeUtilityBill = yearlyUtilityBillEstimates.reduce((x, y) => x + y, 0);
  $: totalCostWithSolar = installationCostTotal + remainingLifetimeUtilityBill - installationCostTotal*0.50;
  $: yearlyCostWithoutSolar = [...Array(installationLifeSpan).keys()].map(
    (year) =>
      (monthlyAverageEnergyBillInput * 12 * costIncreaseFactor ** year) / discountRate ** year,
  );
  $: totalCostWithoutSolar = yearlyCostWithoutSolar.reduce((x, y) => x + y, 0);
  $: savings = totalCostWithoutSolar - totalCostWithSolar;

  let energyCovered: number;
  $: energyCovered = yearlyProductionAcKwh[0] / yearlyKwhEnergyConsumption;

  let breakEvenYear: number = -1;
  $: GoogleCharts.load(
    () => {
      if (!costChart) {
        return;
      }
      const year = new Date().getFullYear();

      const yearlySavings = yearlyCostWithoutSolar.map(
        (costWithoutSolar, i) => costWithoutSolar - yearlyUtilityBillEstimates[i]
      );
      const cumulativeSavings = yearlySavings.reduce((acc, savings, i) => {
        acc.push(i === 0 ? savings : savings + acc[i-1]);
        return acc;
      }, [] as number[]);

      const data = google.visualization.arrayToDataTable([
        ['Year', 'Savings'],
        ...cumulativeSavings.map((savings, i) => [
          (year + i + 1).toString(),
          savings
        ]),
      ]);

      /* eslint-disable @typescript-eslint/no-explicit-any */
      const googleCharts = google.charts as any;
      const chart = new googleCharts.Bar(costChart);
      const options = googleCharts.Bar.convertOptions({
        title: `Cumulative Savings Over ${installationLifeSpan} Years`,
        width: 350,
        height: 200,
        vAxis: {
          title: 'Savings ($)'
        }
      });
      chart.draw(data, options);
    },
    { packages: ['bar'] },
  );

  function updateConfig() {
    monthlyKwhEnergyConsumption = monthlyAverageEnergyBillInput / energyCostPerKwhInput;
    yearlyKwhEnergyConsumption = monthlyKwhEnergyConsumption * 12;
    panelCapacityRatio = panelCapacityWattsInput / defaultPanelCapacityWatts;
    configId = findSolarConfig(
      solarPanelConfigs,
      yearlyKwhEnergyConsumption,
      panelCapacityRatio,
      dcToAcDerateInput,
    );
  }
</script>

<div class="absolute top-0 left-0">
    <div class="flex flex-col space-y-2 m-2">
      <SummaryCard
        {icon}
        {title}
        rows={[
          {
            icon: 'energy_savings_leaf',
            name: 'Solar will produce in a year',
            value: showNumber(
              (solarPanelConfigs[configId]?.yearlyEnergyDcKwh ?? 0) * panelCapacityRatio,
            ),
            units: 'kWh',
          },
          {
            icon: 'speed',
            name: 'Total System Size on your roof',
            value: showNumber(installationSizeKw),
            units: 'kW',
          },
          {
            icon: 'speed',
            name: 'Estimated Monthly payment with solar',
            value: showMoney(installationCostTotal/(25*12)),
            units: '',
          },
          {
            icon: 'request_quote',
            name: 'Installation cost after incentives(for upfront)',
            value: showMoney(installationCostTotal-0.65*installationCostTotal),
          },

          {
            icon: [
              'battery_0_bar',
              'battery_1_bar',
              'battery_2_bar',
              'battery_3_bar',
              'battery_4_bar',
              'battery_5_bar',
              'battery_full',
            ][Math.floor(Math.min(Math.round(energyCovered * 100) / 100, 1) * 6)],
            name: `Solar will cover ${Math.round(energyCovered * 100)}% of your electric bill`,
            value: '',
          },
        ]}
      />
    </div>

    <div class="mx-2 p-4 surface on-surface-text rounded-lg shadow-lg">
      <div bind:this={costChart} />
      <div class="w-full secondary-text">
        <Table
          rows={[
            {
              icon: 'wallet',
              name: '20 yr PSEG/CONED bill if no solar',
              value: showMoney(totalCostWithoutSolar),
            },
            {
              icon: 'savings',
              name: 'Total 20 Year savings with solar',
              value: showMoney(savings),
            },
            {
              icon: 'balance',
              name: 'ROI if paid all upfront',
              value:
                breakEvenYear >= 0
                  ? `${breakEvenYear + new Date().getFullYear() + 1} in ${breakEvenYear + 1}`
                  : '--',
              units: 'years',
            },
          ]}
        />
        <div class="mt-4">
          <h3 class="text-lg font-bold mb-2">Rebates and incentives you are eligible for:</h3>
          <Table
            rows={[
              {
                icon: 'attach_money',
                name: 'Federal tax credit',
                value: showMoney(0.30 * installationCostTotal),
              },
              {
                icon: 'attach_money',
                name: 'State tax credit',
                value: showMoney(Math.min(0.25 * installationCostTotal, 5000)),
              },
              {
                icon: 'home',
                name: 'Property Tax abatement for NYC',
                value: showMoney(0.30 * installationCostTotal),
              },
            ]}
          />
        </div>
      </div>
    </div>
</div>


