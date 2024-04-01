<script lang="ts">
  /* global google */
  import * as GMAPILoader from '@googlemaps/js-api-loader';
  const { Loader } = GMAPILoader;
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import SearchBar from './components/SearchBar.svelte';
  import Sections from './sections/Sections.svelte';
  import { browser } from '$app/environment';
  let installationSizeKw: number;
  let savings: number;
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  let defaultPlace = {
    name: 'Humayun House ADDRESS',
    address: '', // Initialize with an empty string
    zoom: 22,
  };

  // Get the address from the URL parameter
  $: {
  if (browser) {
      const addressParam = $page.url.searchParams.get('address');
      if (addressParam) {
        defaultPlace.address = decodeURIComponent(addressParam);
      }
 }
  }
 
  let location: google.maps.LatLng | undefined;

  // Initialize app.
  let mapElement: HTMLElement;
  let map: google.maps.Map;
  let geometryLibrary: google.maps.GeometryLibrary;
  let mapsLibrary: google.maps.MapsLibrary;
  let placesLibrary: google.maps.PlacesLibrary;

  async function geocodeAddress(): Promise<google.maps.LatLngLiteral | undefined> {
    const geocoder = new google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address: defaultPlace.address }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          resolve(undefined);
        }
      });
    });
  }

  onMount(async () => {
    // Load the Google Maps libraries.
    const loader = new Loader({ apiKey: googleMapsApiKey });
    const libraries = {
      geometry: loader.importLibrary('geometry'),
      maps: loader.importLibrary('maps'),
      places: loader.importLibrary('places'),
    };
    geometryLibrary = await libraries.geometry;
    mapsLibrary = await libraries.maps;
    placesLibrary = await libraries.places;

    // Geocode the address to get the latitude and longitude
    const locationData = await geocodeAddress();
    if (locationData) {
      location = new google.maps.LatLng(locationData.lat, locationData.lng);

      // Define a custom map style that hides all map features
      const mapStyle = [
        {
          featureType: 'all',
          elementType: 'all',
          stylers: [{ visibility: 'off' }],
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ visibility: 'on' }, { color: '#ffffff' }],
        },
      ];

      map = new google.maps.Map(mapElement, {
        center: location,
        zoom: defaultPlace.zoom,
        tilt: 0,
        mapTypeId: 'satellite',
        disableDefaultUI: true,
        styles: mapStyle,
        zoomControl: true,
        draggable: true,
        scrollwheel: true,
        disableDoubleClickZoom: false,
      });
    }
  });
  
</script>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 20px;
  }
  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 50px;
    background-color: #1a73e8;
    color: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .header h1 {
    font-size: 32px;
    font-weight: bold;
    text-align: center;
  }
  .icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }
  .content {
    flex: 1;
    display: flex;
  }
  .map-container {
    flex: 2;
    position: relative;
    margin: 0 20px;
  }
  .map {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .sidebar {
    flex: 1;
    padding: 20px;
    border: 1px solid var(--md-sys-color-outline);
    border-radius: 4px;
  }
  .building-insights-sidebar {
    margin-right: 20px;
    background-color: #e8f0fe;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .bottom-section {
    margin-top: 20px;
    border-top: 1px solid var(--md-sys-color-outline);
    padding-top: 20px;
  }

  .eligible-list {
    list-style-type: none;
    padding: 20px;
  }

  .eligible-list li {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 4px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .savings-analysis {
    margin-top: 20px;
    padding: 20px;
    background-color: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .savings-analysis p {
    margin-bottom: 50px;
  }

  .savings-analysis .note {
    font-style: italic;
    color: #666666;
  }
</style>


<main class="surface on-surface-text body-medium">
  <div class="container">
    <div class="header">
      <h1>Congratulations! Your Design is Ready</h1>
    </div>
    <div class="content">
      <div class="sidebar building-insights-sidebar">
        <div class="p-4 surface-variant outline-text rounded-lg space-y-3">
          <h2 class="headline-small">Eligible for:</h2>
          <ul>
            <li><span class="icon">🏠</span> Lease</li>
            <li><span class="icon">💸</span> Loan</li>
            <li><span class="icon">💰</span> Upfront Purchase</li>
          </ul>
          <div class="savings-analysis">
            <p>Estimated Savings: $X,XXX</p>
            <p>Estimated Federal Credit: $X,XXX</p>
            <p>Estimated State Credit: $X,XXX</p>
            <p>Estimated PTA (if you live in LI): $X,XXX</p>
            <p class="note">For a more accurate customized design based on exact bills and rate, we will call you soon!</p>
          </div>
        </div>
      </div>
      <div class="map-container">
        <div bind:this={mapElement} class="map"></div>
      </div>
      <div class="sidebar">
        {#if placesLibrary && map}
          <div class="p-4">
            <div style="width: 300px;">
              <SearchBar bind:location {placesLibrary} {map} initialValue={defaultPlace.name} />
            </div>
          </div>
        {/if}
        {#if location}
          <Sections {location} {map} {geometryLibrary} {googleMapsApiKey} />
        {/if}
      </div>
    </div>
    <div class="bottom-section">
      <!-- Add your tables and analysis components here -->
    </div>
  </div>
</main>
