<template>
  <div class="container">
    <h1>Quarter Score</h1>

    <nav class="top-doc-nav" aria-label="文档入口导航">
      <span class="top-doc-nav-title">文档入口：</span>
      <a href="/about/requirements/index.html">需求文档</a>
      <a href="/about/analysis/index.html">需求分析</a>
      <a href="/about/user-manual/index.html">使用手册</a>
      <a href="/about/dev-manual/index.html">开发手册</a>
    </nav>

    <div class="card docs-card">
      <h2>项目文档</h2>
      <div class="docs-links">
        <a href="/about/requirements/index.html">需求文档</a>
        <a href="/about/analysis/index.html">需求分析文档</a>
        <a href="/about/user-manual/index.html">使用手册</a>
        <a href="/about/dev-manual/index.html">开发手册</a>
      </div>
    </div>

    <!-- 表单：新增 / 编辑 -->
    <div class="card">
      <h2>{{ editingId ? "Edit Record" : "Add Record" }}</h2>
      <div class="form-row">
        <input v-model="form.name" placeholder="Name" />
        <input v-model.number="form.q1" type="number" placeholder="Q1" />
        <input v-model.number="form.q2" type="number" placeholder="Q2" />
        <input v-model.number="form.q3" type="number" placeholder="Q3" />
        <input v-model.number="form.q4" type="number" placeholder="Q4" />
        <button @click="submitForm">{{ editingId ? "Update" : "Add" }}</button>
        <button v-if="editingId" @click="cancelEdit" class="secondary">Cancel</button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- 记录列表 -->
    <div class="card">
      <h2>Records</h2>
      <p v-if="loading">Loading...</p>
      <table v-else-if="scores.length">
        <thead>
          <tr>
            <th>Name</th><th>Q1</th><th>Q2</th><th>Q3</th><th>Q4</th><th>Total</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in scores" :key="s.id">
            <td>{{ s.name }}</td>
            <td>{{ s.q1 }}</td>
            <td>{{ s.q2 }}</td>
            <td>{{ s.q3 }}</td>
            <td>{{ s.q4 }}</td>
            <td><strong>{{ s.total }}</strong></td>
            <td>
              <button @click="startEdit(s)">Edit</button>
              <button @click="deleteScore(s.id)" class="danger">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else>No records yet.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";

const API = import.meta.env.VITE_API_BASE;

const scores = ref([]);
const loading = ref(false);
const error = ref("");
const editingId = ref(null);
const form = reactive({ name: "", q1: 0, q2: 0, q3: 0, q4: 0 });

async function fetchScores() {
  loading.value = true;
  const res = await fetch(`${API}/api/scores`);
  scores.value = await res.json();
  loading.value = false;
}

async function submitForm() {
  error.value = "";
  const body = JSON.stringify(form);
  const url = editingId.value ? `${API}/api/scores/${editingId.value}` : `${API}/api/scores`;
  const method = editingId.value ? "PUT" : "POST";
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
  if (!res.ok) {
    const data = await res.json();
    error.value = data.error;
    return;
  }
  cancelEdit();
  await fetchScores();
}

function startEdit(s) {
  editingId.value = s.id;
  Object.assign(form, { name: s.name, q1: s.q1, q2: s.q2, q3: s.q3, q4: s.q4 });
}

function cancelEdit() {
  editingId.value = null;
  Object.assign(form, { name: "", q1: 0, q2: 0, q3: 0, q4: 0 });
}

async function deleteScore(id) {
  await fetch(`${API}/api/scores/${id}`, { method: "DELETE" });
  await fetchScores();
}

onMounted(fetchScores);
</script>

<style>
body { font-family: sans-serif; background: #f4f4f4; margin: 0; }
.container { max-width: 900px; margin: 2rem auto; padding: 0 1rem; }
h1 { color: #333; }
.top-doc-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.65rem 0.75rem;
  border: 1px solid #cfe3ff;
  border-radius: 8px;
  background: #f3f8ff;
}
.top-doc-nav-title {
  font-weight: 600;
  color: #1e3a8a;
}
.top-doc-nav a {
  color: #1d4ed8;
  text-decoration: none;
  padding: 0.2rem 0.35rem;
  border-radius: 4px;
}
.top-doc-nav a:hover {
  background: #dbeafe;
}
.card { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
.card h2 { margin-top: 0; }
.docs-card { border: 1px solid #d9efe9; background: #f6fffc; }
.docs-links { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.docs-links a {
  display: inline-block;
  padding: 0.45rem 0.8rem;
  border-radius: 6px;
  background: #0f766e;
  color: #fff;
  text-decoration: none;
  font-size: 14px;
}
.docs-links a:hover { background: #115e59; }
.form-row { display: flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
.form-row input { padding: .4rem .6rem; border: 1px solid #ccc; border-radius: 4px; width: 120px; }
.form-row input[placeholder="Name"] { width: 180px; }
button { padding: .4rem .9rem; border: none; border-radius: 4px; cursor: pointer; background: #4a90e2; color: white; }
button.secondary { background: #888; }
button.danger { background: #e24a4a; margin-left: .3rem; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: .6rem .8rem; border-bottom: 1px solid #eee; }
th { background: #f8f8f8; }
.error { color: #e24a4a; margin-top: .5rem; }
</style>
