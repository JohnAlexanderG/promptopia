<template>
  <div
    v-if="$nav.currentPage > 1"
    class="absolute bottom-4 right-6 text-[11px] tracking-widest font-semibold"
    style="color: #7a9a8a; font-family: 'Inter Variable', sans-serif"
  >{{ String($nav.currentPage).padStart(2, '0') }} / {{ String($nav.total).padStart(2, '0') }}</div>
</template>
