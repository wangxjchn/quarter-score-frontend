<template>
  <div>
    <h1>Frontend is running</h1>
    <button @click="checkHealth">Test Backend</button>
    <p>{{ result }}</p>
  </div>
</template>

<script>
export default {
  data() {
    return { result: "" };
  },
  methods: {
    async checkHealth() {
      try {
        const res = await fetch(import.meta.env.VITE_API_BASE + "/health");
        this.result = await res.text();
      } catch (e) {
        this.result = "Error: " + e.message;
      }
    }
  }
};
</script>
