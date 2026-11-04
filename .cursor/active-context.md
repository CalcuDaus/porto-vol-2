> **BrainSync Context Pumper** 🧠
> Dynamically loaded for active file: `apps\admin\src\lib\components\MathRain.svelte` (Domain: **Generic Logic**)

### 📐 Generic Logic Conventions & Fixes
- **[what-changed] Replaced dependency LayoutProps**: -   import { GOOGLE_FONTS_URL } from '$lib/fonts';
+   import { GOOGLE_FONTS_URL } from '#lib/fonts';
-   import { GOOGLE_FONTS_URL } from '#lib/fonts';
+   import type { LayoutProps } from './$types';
-   import type { LayoutProps } from './$types';
+ 
- 
+   let { children }: LayoutProps = $props();
-   let { children }: LayoutProps = $props();
+ </script>
- </script>
+ 
- 
+ <svelte:head>
- <svelte:head>
+   <link rel="icon" href={favicon} />
-   <link rel="icon" href={favicon} />
+   <!-- Google Fonts for Chalkboard Typography -->
-   <!-- Google Fonts for Chalkboard Typography -->
+   <link rel="preconnect" href="https://fonts.googleapis.com" />
-   <link rel="preconnect" href="https://fonts.googleapis.com" />
+   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
-   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
+   <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
-   <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
+ </svelte:head>
- </svelte:head>
+ 
- 
+ {@render children()}
- {@render children()}
+ 
- 

📌 IDE AST Context: Modified symbols likely include [script, svelte:head]
- **[what-changed] Replaced dependency LayoutProps**: -   import { GOOGLE_FONTS_URL } from '#lib/fonts';
+   import { GOOGLE_FONTS_URL } from '$lib/fonts';
-   import type { LayoutProps } from './$types';
+   import { GOOGLE_FONTS_URL } from '#lib/fonts';
- 
+   import type { LayoutProps } from './$types';
-   let { children }: LayoutProps = $props();
+ 
- </script>
+   let { children }: LayoutProps = $props();
- 
+ </script>
- <svelte:head>
+ 
-   <link rel="icon" href={favicon} />
+ <svelte:head>
-   <!-- Google Fonts for Chalkboard Typography -->
+   <link rel="icon" href={favicon} />
-   <link rel="preconnect" href="https://fonts.googleapis.com" />
+   <!-- Google Fonts for Chalkboard Typography -->
-   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
+   <link rel="preconnect" href="https://fonts.googleapis.com" />
-   <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
+   <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
- </svelte:head>
+   <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
- 
+ </svelte:head>
- {@render children()}
+ 
- 
+ {@render children()}
+ 

📌 IDE AST Context: Modified symbols likely include [script, svelte:head]
