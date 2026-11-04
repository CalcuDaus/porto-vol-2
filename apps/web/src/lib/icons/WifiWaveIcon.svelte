<script lang="ts">
  let { class: className = "w-8 h-8" } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 48 48"
  fill="none"
  stroke="currentColor"
  stroke-linecap="round"
  class={className}
  aria-hidden="true"
>
  <!-- Outer chalk arc -->
  <path d="M43 7 C21 11, 7 25, 7 43" stroke-width="3.5" />
  <!-- Middle chalk arc -->
  <path d="M43 20 C27 23, 19 31, 19 43" stroke-width="3.5" />
  <!-- Inner chalk arc -->
  <path d="M43 32 C35 34, 31 38, 31 43" stroke-width="3.5" />
  <!-- Base circle dot -->
  <circle cx="42.5" cy="42.5" r="2.5" fill="currentColor" />
</svg>
