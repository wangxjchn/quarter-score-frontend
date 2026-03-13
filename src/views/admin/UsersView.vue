<template>
  <div class="page admin-page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">Admin</p>
        <h2>员工管理</h2>
        <p>统一维护工号、姓名、角色、职级和所属小组。该页面已适配手机端卡片浏览与桌面端表格操作。</p>
      </div>
      <div class="hero-actions">
        <div class="hero-badge hero-badge--light">
          <strong>{{ users.length }}</strong>
          <span>当前员工数</span>
        </div>
        <el-button type="primary" class="hero-button" @click="openAdd">新增员工</el-button>
      </div>
    </section>

    <el-card class="admin-card" shadow="never">
      <div class="table-shell">
        <el-table :data="users" v-loading="loading" border stripe>
          <el-table-column prop="employee_id" label="工号" width="120" />
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">{{ ROLE_LABELS[row.role] }}</template>
          </el-table-column>
          <el-table-column prop="level" label="职级" width="100">
            <template #default="{ row }">{{ LEVEL_LABELS[row.level] }}</template>
          </el-table-column>
          <el-table-column prop="team_name" label="所属小组" min-width="140" />
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
        <article v-for="row in users" :key="row.id" class="mobile-item">
          <div class="mobile-item__head">
            <div>
              <strong>{{ row.name }}</strong>
              <span>{{ row.employee_id }}</span>
            </div>
            <em>{{ ROLE_LABELS[row.role] }}</em>
          </div>
          <p>职级：{{ LEVEL_LABELS[row.level] }}</p>
          <p>小组：{{ row.team_name || '未分配' }}</p>
          <div class="mobile-item__actions">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </article>
      </div>
    </el-card>

    <el-dialog v-model="dlgVisible" :title="editingId ? '编辑员工' : '新增员工'" width="440px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="工号">
          <el-input v-model="form.employee_id" placeholder="工号（唯一）" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="姓名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="form.role" style="width:100%">
            <el-option v-for="(label, val) in ROLE_LABELS"  :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="职级">
          <el-select v-model="form.level" style="width:100%">
            <el-option v-for="(label, val) in LEVEL_LABELS" :key="val" :label="label" :value="val" />
          </el-select>
        </el-form-item>
        <el-form-item label="小组">
          <el-select v-model="form.team_id" clearable placeholder="（不指定）" style="width:100%">
            <el-option v-for="t in teams" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
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

const ROLE_LABELS  = { admin: '管理员', leader: '组长', employee: '员工' };
const LEVEL_LABELS = { junior: '助理',  mid: '中级',   senior: '高级'   };

const users      = ref([]);
const teams      = ref([]);
const loading    = ref(false);
const saving     = ref(false);
const dlgVisible = ref(false);
const editingId  = ref(null);
const form       = reactive({ employee_id: '', name: '', role: 'employee', level: 'mid', team_id: null });

async function fetchAll() {
  loading.value = true;
  try {
    [users.value, teams.value] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/teams'),
    ]);
  } catch { ElMessage.error('加载数据失败'); }
  finally { loading.value = false; }
}

function openAdd() {
  editingId.value  = null;
  Object.assign(form, { employee_id: '', name: '', role: 'employee', level: 'mid', team_id: null });
  dlgVisible.value = true;
}

function openEdit(row) {
  editingId.value  = row.id;
  Object.assign(form, {
    employee_id: row.employee_id,
    name:        row.name,
    role:        row.role,
    level:       row.level,
    team_id:     row.team_id || null,
  });
  dlgVisible.value = true;
}

async function handleSave() {
  if (!form.employee_id.trim()) { ElMessage.warning('工号不能为空'); return; }
  if (!form.name.trim())        { ElMessage.warning('姓名不能为空'); return; }
  saving.value = true;
  try {
    if (editingId.value) {
      await api.put(`/api/users/${editingId.value}`, form);
      ElMessage.success('更新成功');
    } else {
      await api.post('/api/users', form);
      ElMessage.success('创建成功');
    }
    dlgVisible.value = false;
    await fetchAll();
  } catch (e) {
    ElMessage.error(e?.error || '操作失败');
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row) {
  await ElMessageBox.confirm(`确认删除员工「${row.name}（${row.employee_id}）」？`, '提示', { type: 'warning' });
  try {
    await api.delete(`/api/users/${row.id}`);
    ElMessage.success('删除成功');
    await fetchAll();
  } catch (e) {
    ElMessage.error(e?.error || '删除失败');
  }
}

onMounted(fetchAll);
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
.hero-badge--light { background: linear-gradient(135deg, #6d28d9, #2563eb); }
.hero-badge strong { display: block; font-size: 28px; }
.hero-badge span { font-size: 13px; opacity: .86; }
.hero-button { min-width: 132px; border-radius: 16px; }
.admin-card { padding: 12px; }
.table-shell { overflow-x: auto; }
.mobile-list { display: none; }
.mobile-item { padding: 18px; margin-top: 12px; }
.mobile-item__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}
.mobile-item__head div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mobile-item__head span,
.mobile-item p { color: #60708a; }
.mobile-item__head em {
  padding: 6px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-style: normal;
  font-size: 12px;
}
.mobile-item p { margin: 10px 0 0; }
.mobile-item__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}
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
