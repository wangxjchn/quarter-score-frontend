<template>
  <div class="page admin-page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">Admin</p>
        <h2>小组管理</h2>
        <p>维护组织中的小组数据，后续会作为评分关系、评级计算和结余管理的基础维度。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-badge">
          <strong>{{ teams.length }}</strong>
          <span>当前小组数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="openAdd">新增小组</el-button>
      </div>
    </section>

    <el-card class="admin-card" shadow="never">
      <div class="table-shell">
        <el-table :data="teams" v-loading="loading" border stripe>
          <el-table-column prop="name" label="小组名称" min-width="180" />
          <el-table-column prop="member_count" label="成员数" width="100" align="center" />
          <el-table-column prop="created_at" label="创建时间" min-width="180" />
          <el-table-column label="操作" width="160" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="openEdit(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="mobile-list">
        <article v-for="row in teams" :key="row.id" class="mobile-item">
          <div class="mobile-item__head">
            <strong>{{ row.name }}</strong>
            <span>{{ row.member_count }} 人</span>
          </div>
          <p>创建时间：{{ row.created_at }}</p>
          <div class="mobile-item__actions">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </article>
      </div>
    </el-card>

    <el-dialog v-model="dlgVisible" :title="editingId ? '编辑小组' : '新增小组'" width="360px">
      <el-form :model="form" label-position="top">
        <el-form-item label="小组名称">
          <el-input v-model="form.name" placeholder="请输入小组名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dlgVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { api } from '../../api';

const teams      = ref([]);
const loading    = ref(false);
const saving     = ref(false);
const dlgVisible = ref(false);
const editingId  = ref(null);
const form       = reactive({ name: '' });

async function fetchTeams() {
  loading.value = true;
  try   { teams.value = await api.get('/api/teams'); }
  catch  { ElMessage.error('加载小组失败'); }
  finally { loading.value = false; }
}

function openAdd() {
  editingId.value = null;
  form.name       = '';
  dlgVisible.value = true;
}

function openEdit(row) {
  editingId.value  = row.id;
  form.name        = row.name;
  dlgVisible.value = true;
}

async function handleSave() {
  if (!form.name.trim()) { ElMessage.warning('小组名称不能为空'); return; }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/api/teams/${editingId.value}`, { name: form.name });
      ElMessage.success('更新成功');
    } else {
      await api.post('/api/teams', { name: form.name });
      ElMessage.success('创建成功');
    }
    dlgVisible.value = false;
    await fetchTeams();
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除小组「${row.name}」？`, '提示', { type: 'warning' });
  try {
    await api.delete(`/api/teams/${row.id}`);
    ElMessage.success('删除成功');
    await fetchTeams();
  } catch (e) {
    ElMessage.error(e?.error || '删除失败');
  }
}

onMounted(fetchTeams);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.admin-page { display: flex; flex-direction: column; gap: 18px; }
.admin-hero,
.admin-card,
.mobile-item {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 26px;
  background: rgba(255,255,255,.8);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.05);
}
.admin-hero {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
}
.section-chip {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.admin-hero h2 { margin: 0 0 8px; font-size: 32px; }
.admin-hero p { margin: 0; max-width: 680px; color: #60708a; line-height: 1.75; }
.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
  min-width: 180px;
}
.hero-badge {
  padding: 18px 20px;
  border-radius: 22px;
  background: linear-gradient(135deg, #10233c, #0f766e);
  color: #fff;
  text-align: right;
}
.hero-badge strong { display: block; font-size: 28px; }
.hero-badge span { font-size: 13px; opacity: .86; }
.hero-button { min-width: 132px; border-radius: 16px; }
.admin-card { padding: 12px; }
.table-shell { overflow-x: auto; }
.mobile-list { display: none; }
.mobile-item { padding: 18px; margin-top: 12px; }
.mobile-item__head,
.mobile-item__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mobile-item__head span,
.mobile-item p { color: #60708a; }
.mobile-item p { margin: 12px 0; }
@media (max-width: 768px) {
  .admin-hero {
    flex-direction: column;
    padding: 20px;
  }
  .hero-actions {
    width: 100%;
    align-items: stretch;
  }
  .table-shell { display: none; }
  .mobile-list { display: block; }
}
</style>
