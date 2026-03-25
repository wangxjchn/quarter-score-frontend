<template>
  <div class="page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">评分管理</p>
        <h2>{{ isEdit ? '编辑评分活动' : '发起评分活动' }}</h2>
        <p>请根据需求配置评分活动基础信息、任务和进度</p>
      </div>
      <div class="hero-actions">
        <el-button type="success" @click="publishRating">发起评分</el-button>
        <el-button type="primary" @click="saveRating">{{ isEdit ? '保存' : '创建并保存' }}</el-button>
        <el-button @click="$router.push('/evaluation/ratings')">返回列表</el-button>
      </div>
    </section>

    <el-form :model="ratingForm" :rules="rules" ref="ratingFormRef" label-width="100px" class="rating-editor-form">
      <el-card class="form-section">
        <template #header>
          <div class="section-header"><el-icon><Document /></el-icon><span>基础信息</span></div>
        </template>
        <el-form-item label="评分名称" prop="name"><el-input v-model="ratingForm.name"/></el-form-item>
        <el-form-item label="季度" prop="quarter"><el-select v-model="ratingForm.quarter" style="width: 220px;"><el-option label="2024Q1" value="2024Q1"/><el-option label="2024Q2" value="2024Q2"/><el-option label="2024Q3" value="2024Q3"/><el-option label="2024Q4" value="2024Q4"/><el-option label="2025Q1" value="2025Q1"/><el-option label="2025Q2" value="2025Q2"/><el-option label="2025Q3" value="2025Q3"/><el-option label="2025Q4" value="2025Q4"/></el-select></el-form-item>
        <el-form-item label="描述" prop="description"><el-input type="textarea" v-model="ratingForm.description" rows="3"/></el-form-item>
        <el-form-item label="状态" prop="status"><el-select v-model="ratingForm.status" style="width: 220px;"><el-option v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value"/></el-select></el-form-item>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="section-header"><el-icon><List /></el-icon><span>配置（占位）</span></div>
        </template>
        <p class="placeholder-text">配置参数占位，配套统计参数待后续确定。</p>
      </el-card>

      <el-card class="form-section">
        <template #header>
          <div class="section-header"><el-icon><User /></el-icon><span>评分任务（可动态增删）</span></div>
        </template>

        <div v-for="(task, index) in tasks" :key="task.localId" class="task-wrapper">
          <div class="task-card">
            <div class="task-title">
              <strong>任务 {{ index + 1 }}</strong>
              <el-button type="danger" size="mini" @click="removeTask(index)">删除</el-button>
            </div>
            <el-row :gutter="16">
              <el-col :span="12"><el-form-item label="任务名称"><el-input v-model="task.name"/></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="类型"><el-select v-model="task.type" placeholder="任务类型"><el-option label="直接发起" value="direct"/><el-option label="指定关系后发起" value="leader_assigned"/></el-select></el-form-item></el-col>
            </el-row>
            <el-row :gutter="16" v-if="task.type === 'leader_assigned'">
              <el-col :span="24"><el-form-item label="指定组长"><el-select v-model="task.leader_id" filterable placeholder="选择组长"><el-option v-for="u in allUsers" :key="u.id" :label="u.name + ' (' + u.employee_id + ')'" :value="u.id"/></el-select></el-form-item></el-col>
            </el-row>

            <div class="subsection">
              <span>评分人</span>
              <div class="sub-actions">
                <el-select v-model="task.reviewerType" placeholder="类型" style="width: 140px;"><el-option label="员工" value="user"/><el-option label="职能" value="department"/><el-option label="群组" value="team"/></el-select>
                <el-select v-model="task.selectedReviewerId" placeholder="选择" filterable style="width: 220px;"><el-option :key="item.id" v-for="item in getOptionsByType(task.reviewerType)" :label="item.name" :value="item.id"/></el-select>
                <el-button type="primary" size="mini" @click="addReviewer(index)">添加</el-button>
              </div>
              <div class="chips">
                <el-tag v-for="(r, ri) in task.reviewers" :key="ri" closable @close="removeReviewer(index, ri)">{{ getTypeLabel(r.type) }}: {{ getItemName(r.type, r.id) }}</el-tag>
              </div>
            </div>

            <div class="subsection">
              <span>被评分人</span>
              <div class="sub-actions">
                <el-select v-model="task.revieweeType" placeholder="类型" style="width: 140px;"><el-option label="员工" value="user"/><el-option label="职能" value="department"/><el-option label="群组" value="team"/></el-select>
                <el-select v-model="task.selectedRevieweeId" placeholder="选择" filterable style="width: 220px;"><el-option :key="item.id" v-for="item in getOptionsByType(task.revieweeType)" :label="item.name" :value="item.id"/></el-select>
                <el-button type="primary" size="mini" @click="addReviewee(index)">添加</el-button>
              </div>
              <div class="chips">
                <el-tag v-for="(r, ri) in task.reviewees" :key="ri" closable @close="removeReviewee(index, ri)">{{ getTypeLabel(r.type) }}: {{ getItemName(r.type, r.id) }}</el-tag>
              </div>
            </div>

            <div class="subsection">
              <span>评分维度</span>
              <div class="sub-actions">
                <el-select v-model="task.dimensionId" placeholder="选择维度" filterable style="width: 140px;"><el-option v-for="dim in availableDimensions" :key="dim.id" :label="dim.name" :value="dim.id"/></el-select>
                <el-input-number v-model="task.dimensionWeight" :min="0" :max="1" :step="0.1" style="margin-left:8px"/>
                <el-button type="primary" size="mini" @click="addTaskDimension(index)">添加</el-button>
              </div>
              <div class="chips">
                <el-tag v-for="(d, di) in task.dimensions" :key="di" closable @close="removeTaskDimension(index, di)">{{ d.name }} ({{ d.weight }})</el-tag>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: right; margin-top: 16px;"><el-button type="success" @click="addTask">新增任务</el-button></div>
      </el-card>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Document, List, User } from '@element-plus/icons-vue';
import { api } from '../../api';

const route = useRoute();
const router = useRouter();
const ratingId = route.params.id;
const isEdit = ref(!!ratingId);

const ratingFormRef = ref(null);
const ratingForm = reactive({
  name: '',
  quarter: '',
  description: '',
  status: 'pending',
  config: {}
});

const rules = {
  name: [{ required: true, message: '请输入评分名称', trigger: 'blur' }],
  quarter: [{ required: true, message: '请选择季度', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
};

const statusOptions = [
  { label: '挂起', value: 'pending' },
  { label: '活动', value: 'active' },
  { label: '关闭', value: 'closed' }
];

const allUsers = ref([]);
const departments = ref([]);
const teams = ref([]);
const availableDimensions = ref([]);

const tasks = ref([]);

function getOptionsByType(type) {
  if (type === 'user') return allUsers.value.map(u => ({ id: u.id, name: `${u.name}(${u.employee_id})` }));
  if (type === 'department') return departments.value;
  if (type === 'team') return teams.value;
  return [];
}

function getTypeLabel(type) {
  return type === 'user' ? '员工' : (type === 'department' ? '职能' : '群组');
}

function getItemName(type, id) {
  const list = type === 'user' ? allUsers.value : (type === 'department' ? departments.value : teams.value);
  const item = list.find(i => i.id === id);
  return item ? item.name || `${item.name || item.employee_id}` : '-';
}

function addTask() {
  tasks.value.push({
    localId: Date.now() + Math.random(),
    name: '',
    type: 'direct',
    leader_id: null,
    reviewerType: 'user',
    selectedReviewerId: null,
    reviewers: [],
    revieweeType: 'user',
    selectedRevieweeId: null,
    reviewees: [],
    dimensionId: null,
    dimensionWeight: 1.0,
    dimensions: []
  });
}

function removeTask(index) {
  tasks.value.splice(index, 1);
}

function addReviewer(taskIndex) {
  const t = tasks.value[taskIndex];
  if (!t.selectedReviewerId) return;

  if(!t.reviewers){
    t.reviewers = [];
  }

  if (!t.reviewers.some(r => r.type === t.reviewerType && r.id === t.selectedReviewerId)) {
    t.reviewers.push({ type: t.reviewerType, id: t.selectedReviewerId });
  }
  t.selectedReviewerId = null;
}

function removeReviewer(taskIndex, index) {
  tasks.value[taskIndex].reviewers.splice(index, 1);
}

function addReviewee(taskIndex) {
  const t = tasks.value[taskIndex];
  if (!t.selectedRevieweeId) return;

  if(!t.reviewees){
    t.reviewees = [];
  }

  if (!t.reviewees.some(r => r.type === t.revieweeType && r.id === t.selectedRevieweeId)) {
    t.reviewees.push({ type: t.revieweeType, id: t.selectedRevieweeId });
  }
  t.selectedRevieweeId = null;
}

function removeReviewee(taskIndex, index) {
  tasks.value[taskIndex].reviewees.splice(index, 1);
}

function addTaskDimension(taskIndex) {
  const t = tasks.value[taskIndex];
  if (!t.dimensionId) return;
  const dim = availableDimensions.value.find(d => d.id === t.dimensionId);
  if (!dim) return;
  if (!t.dimensions.find(d => d.dimension_id === t.dimensionId)) {
    t.dimensions.push({ dimension_id: dim.id, name: dim.name, weight: t.dimensionWeight || 1.0 });
  }
  t.dimensionId = null;
  t.dimensionWeight = 1.0;
}

function removeTaskDimension(taskIndex, index) {
  tasks.value[taskIndex].dimensions.splice(index, 1);
}

async function loadData() {
  try {
    const [ratingsData, usersData, departmentsData, teamsData, dimsData] = await Promise.all([
      api.get('/api/evaluations/ratings'),
      api.get('/api/users'),
      api.get('/api/departments'),
      api.get('/api/teams'),
      api.get('/api/evaluations/dimensions')
    ]);
    allUsers.value = usersData;
    departments.value = departmentsData;
    teams.value = teamsData;
    availableDimensions.value = dimsData;
    
    let targetRatingId = ratingId;
        
    // 如果是编辑模式，但没有 rating_id，或者不是编辑模式，都尝试获取最后一个评分活动
    if ((!isEdit.value || !targetRatingId) && ratingsData.length > 0) {
      targetRatingId = ratingsData[0].id;
    }
        
    if (targetRatingId) {
      // 获取评分活动详情
      const rating = await api.get(`/api/evaluations/ratings/${targetRatingId}`);
      if (rating) {
        Object.assign(ratingForm, {
          name: rating.name,
          quarter: rating.quarter,
          description: rating.description,
          status: rating.status || 'pending',
          config: rating.config || {}
        });
            
        // 获取任务列表
        const tasksData = await api.get(`/api/evaluations/tasks?rating_id=${targetRatingId}`);
            
        // 后端已返回详细信息，直接使用
        const detailedTasks = tasksData.map((task) => ({
          localId: task.id,
          id: task.id,
          ...task,
          // 评分人列表（支持多种类型）
          reviewers: task.reviewers?.map(r => ({
            type: r.target_type,
            id: r.target_id
          })) || [],
          // 被评分人列表（支持多种类型）
          reviewees: task.reviewees?.map(r => ({
            type: r.target_type,
            id: r.target_id
          })) || [],
          // 维度列表
          dimensions: task.dimensions || [],
          // 用于表单选择的临时字段
          reviewerType: 'user',
          selectedReviewerId: null,
          revieweeType: 'user',
          selectedRevieweeId: null,
          dimensionId: null,
          dimensionWeight: 1.0
        }));
            
        tasks.value = detailedTasks;
      }
    }
        
    // 如果没有找到任何评分活动（无论是编辑还是新建都没有数据）
    if (!targetRatingId || (!tasks.value.length && !isEdit.value)) {
      // 创建一个空的评分活动
      Object.assign(ratingForm, {
        name: '',
        quarter: new Date().getFullYear() + 'Q' + (Math.floor((new Date().getMonth() + 3) / 3)),
        description: '',
        status: 'pending',
        config: {}
      });
      addTask(); // 添加一个空任务
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
  }
}

async function saveRating() {
  try {
    await ratingFormRef.value.validate();

    // 强校验基础字段，避免 element-plus validate 返回 confusing 对象
    if (!ratingForm.name) {
      ElMessage.warning('评分名称不能为空');
      return;
    }
    if (!ratingForm.quarter) {
      ElMessage.warning('请选择季度');
      return;
    }

    // 检查任务基本完成
    if (tasks.value.length === 0) {
      ElMessage.warning('请至少添加一个评分任务');
      return;
    }

    let saved;
    if (isEdit.value) {
      saved = await api.put(`/api/evaluations/ratings/${ratingId}`, ratingForm);
    } else {
      saved = await api.post('/api/evaluations/ratings', ratingForm);
    }

    const savedRatingId = isEdit.value ? ratingId : saved.id;

    // 同步任务数据（简化方式）
    for (const task of tasks.value) {
      const payload = {
        rating_id: savedRatingId,
        name: task.name,
        type: task.type,
        leader_id: task.leader_id,
        reviewers: task.reviewers,
        reviewees: task.reviewees,
        dimensions: task.dimensions.map(d => ({ dimension_id: d.dimension_id, weight: d.weight }))
      };

      if (task.id) {
        await api.put(`/api/evaluations/tasks/${task.id}`, { ...payload, status: task.status || 'draft' });
      } else {
        await api.post('/api/evaluations/tasks', payload);
      }
    }

    ElMessage.success('保存成功');
    router.push('/evaluation/ratings');
  } catch (error) {
    console.error('保存失败:', error);

    // Element Plus 表单校验返回 object/array，优先展示具体字段提示；否则展示服务器错误
    if (error?.errors && Array.isArray(error.errors)) {
      const message = error.errors.map(e => e.message).join('，');
      ElMessage.error(message || '表单校验失败');
    } else if (error?.quarter && Array.isArray(error.quarter)) {
      // 兼容 用户的 error 对象 `quarter: [...]`
      ElMessage.error('季度字段校验失败，请重新选择季度');
    } else {
      ElMessage.error(error.response?.data?.error || '保存失败');
    }
  }
}

async function publishRating() {
  try {
    ratingForm.status = 'active';
    await saveRating();
    ElMessage.success('评分活动已发布为活动状态');
  } catch {
    // saveRating已经处理报错，不再重复
  }
}

onMounted(loadData);
</script>

<style scoped>
.page { padding: 8px 0; }
.admin-hero { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; gap:16px; }
.section-header { font-weight: 700; display:flex; align-items:center; gap:8px; }
.rating-editor-form .form-section { margin-bottom:20px; }
.placeholder-text { color:#94a3b8; }
.hero-actions { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.task-wrapper { margin-bottom: 16px; }
.task-card { border:1px solid #e2e8f0; border-radius:8px; padding:16px; }
.task-title { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.subsection { margin-top:12px; }
.sub-actions { display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
.chips { display:flex; flex-wrap:wrap; gap:8px; }

@media (max-width: 900px) {
  .admin-hero { flex-direction: column; align-items: flex-start; padding: 12px 8px; }
  .hero-actions { width: 100%; justify-content: flex-start; }
  .rating-editor-form .el-row {
    flex-wrap: wrap;
  }
  .rating-editor-form .el-col {
    width: 100% !important;
    flex: 0 0 100% !important;
    max-width: 100% !important;
  }
}
</style>
