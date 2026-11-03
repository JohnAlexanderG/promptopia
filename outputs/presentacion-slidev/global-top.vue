<template>
  <div
    class="absolute top-0 left-0 h-[3px] z-50 transition-all duration-500"
    :style="{
      width: ($nav.currentPage / $nav.total) * 100 + '%',
      background: 'linear-gradient(90deg, #2E6B4F, #3F949C, #E2674F, #E9B23C)',
    }"
  />
</template>
