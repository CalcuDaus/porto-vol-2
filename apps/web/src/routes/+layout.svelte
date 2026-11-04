<script lang="ts">
  import './layout.css';
  import favicon from '#lib/assets/favicon.svg';
  import { GOOGLE_FONTS_URL } from '#lib/fonts';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <!-- Google Fonts for Chalkboard Typography -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
</svelte:head>

{@render children()}
