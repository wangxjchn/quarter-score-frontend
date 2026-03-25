<template>
  <div class="page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">评分管理</p>
        <h2>发起评分</h2>
        <p>创建新的评分任务，配置评分人、被评分人和评分维度。</p>
      </div>
    </section>

    <div class="task-form-container">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <!-- 基本信息 -->
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <el-icon><Document /></el-icon>
              <span>基本信息</span>
            </div>
          </template>
          
          <el-form-item label="所属评分" prop="rating_id">
            <el-select v-model="form.rating_id" placeholder="选择评分活动" style="width: 100%" @change="handleRatingChange">
              <el-option
                v-for="rating in ratings"
                :key="rating.id"
                :label="`${rating.name} (${rating.quarter})`"
                :value="rating.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="任务名称" prop="name">
            <el-input v-model="form.name" placeholder="如：2024 年第一季度研发部评分" />
          </el-form-item>
          
          <!-- 季度信息从评分中获取，只读显示 -->
          <el-form-item label="评分季度">
            <el-tag size="large">{{ currentQuarter || '请先选择评分' }}</el-tag>
          </el-form-item>
          
          <el-form-item label="任务类型" prop="type">
            <el-radio-group v-model="form.type">
              <el-radio label="direct">直接指定评分关系</el-radio>
              <el-radio label="leader_assigned">组长指定评分关系</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item 
            v-if="form.type === 'leader_assigned'" 
            label="指定组长" 
            prop="leader_id"
          >
            <el-select v-model="form.leader_id" placeholder="选择组长" style="width: 100%" filterable>
              <el-option
                v-for="user in allUsers"
                :key="user.id"
                :label="`${user.name}（${user.employee_id}）`"
                :value="user.id"
              />
            </el-select>
          </el-form-item>
        </el-card>

        <!-- 评分维度 -->
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <el-icon><List /></el-icon>
              <span>评分维度</span>
            </div>
          </template>
          
          <el-table :data="availableDimensions" border style="width: 100%">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="name" label="维度名称" width="150" />
            <el-table-column prop="min_score" label="最低分" width="80" />
            <el-table-column prop="max_score" label="最高分" width="80" />
            <el-table-column label="权重" width="150">
              <template #default="{ row }">
                <el-input-number
                  v-if="selectedDimensionIds.includes(row.id)"
                  v-model="dimensionWeights[row.id]"
                  :min="0"
                  :max="1"
                  :precision="2"
                  :step="0.1"
                  style="width: 100%"
                />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" show-overflow-tooltip />
          </el-table>
          
          <div style="margin-top: 16px; text-align: right;">
            <el-button type="primary" @click="handleSelectDimensions">
              添加已选维度
            </el-button>
          </div>
          
          <!-- 已选维度列表 -->
          <div v-if="selectedDimensions.length > 0" class="selected-dimensions">
            <h4>已选维度：</h4>
            <div class="dimension-tags">
              <el-tag
                v-for="dim in selectedDimensions"
                :key="dim.id"
                closable
                @close="removeDimension(dim.id)"
              >
                {{ dim.name }} (权重：{{ dimensionWeights[dim.id] }})
              </el-tag>
            </div>
          </div>
        </el-card>

        <!-- 评分人 -->
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <el-icon><User /></el-icon>
              <span>评分人</span>
            </div>
          </template>
          
          <div class="selector-container">
            <div class="selector-left">
              <el-select v-model="reviewerType" placeholder="选择类型" style="width: 150px">
                <el-option label="员工" value="user" />
                <el-option label="职能" value="department" />
                <el-option label="群组" value="team" />
              </el-select>
              
              <el-select 
                v-model="selectedReviewerId" 
                placeholder="选择评分人" 
                style="width: 300px; margin-left: 12px"
                filterable
              >
                <el-option
                  v-for="item in getAvailableReviewers"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              
              <el-button 
                type="primary" 
                @click="addReviewer"
                style="margin-left: 12px"
              >
                添加
              </el-button>
            </div>
            
            <div class="selector-right">
              <div class="selected-list">
                <div
                  v-for="(reviewer, index) in form.reviewers"
                  :key="index"
                  class="selected-item"
                >
                  <span>{{ getTypeLabel(reviewer.type) }}: {{ getItemName(reviewer.type, reviewer.id) }}</span>
                  <el-button link type="danger" @click="removeReviewer(index)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 被评分人 -->
        <el-card class="form-section">
          <template #header>
            <div class="section-header">
              <el-icon><UserFilled /></el-icon>
              <span>被评分人</span>
            </div>
          </template>
          
          <div class="selector-container">
            <div class="selector-left">
              <el-select v-model="revieweeType" placeholder="选择类型" style="width: 150px">
                <el-option label="员工" value="user" />
                <el-option label="职能" value="department" />
                <el-option label="群组" value="team" />
              </el-select>
              
              <el-select 
                v-model="selectedRevieweeId" 
                placeholder="选择被评分人" 
                style="width: 300px; margin-left: 12px"
                filterable
              >
                <el-option
                  v-for="item in getAvailableReviewees"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id"
                />
              </el-select>
              
              <el-button 
                type="primary" 
                @click="addReviewee"
                style="margin-left: 12px"
              >
                添加
              </el-button>
            </div>
            
            <div class="selector-right">
              <div class="selected-list">
                <div
                  v-for="(reviewee, index) in form.reviewees"
                  :key="index"
                  class="selected-item"
                >
                  <span>{{ getTypeLabel(reviewee.type) }}: {{ getItemName(reviewee.type, reviewee.id) }}</span>
                  <el-button link type="danger" @click="removeReviewee(index)">删除</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">
            {{ taskId ? '更新任务' : '创建任务' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Document, List, User, UserFilled } from '@element-plus/icons-vue';
import { api } from '../../api';

const route = useRoute();
const taskId = route.params.id;

const formRef = ref(null);
const saving = ref(false);

const form = reactive({
  rating_id: null,
  name: '',
  type: 'direct',
  leader_id: null,
  reviewers: [],
  reviewees: [],
  dimensions: []
});

const rules = {
  rating_id: [{ required: true, message: '请选择评分活动', trigger: 'change' }],
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }]
};

// 数据源
const ratings = ref([]);
const allUsers = ref([]);
const departments = ref([]);
const teams = ref([]);
const availableDimensions = ref([]);

// 维度选择
const selectedDimensionIds = ref([]);
const dimensionWeights = ref({});
const selectedDimensions = ref([]);

// 评分人选择
const reviewerType = ref('user');
const selectedReviewerId = ref(null);

// 被评分人选择
const revieweeType = ref('user');
const selectedRevieweeId = ref(null);

// 计算属性
const getAvailableReviewers = computed(() => {
  if (reviewerType.value === 'user') return allUsers.value;
  if (reviewerType.value === 'department') return departments.value;
  if (reviewerType.value === 'team') return teams.value;
  return [];
});

const getAvailableReviewees = computed(() => {
  if (revieweeType.value === 'user') return allUsers.value;
  if (revieweeType.value === 'department') return departments.value;
  if (revieweeType.value === 'team') return teams.value;
  return [];
});

// 当前季度（从选中的 rating 获取）
const currentQuarter = computed(() => {
  const rating = ratings.value.find(r => r.id === form.rating_id);
  return rating?.quarter || '';
});

// 方法
function handleRatingChange() {
  // 切换评分时，季度会自动更新
}

async function loadData() {
  try {
    const [ratingsData, usersData, deptsData, teamsData, dimsData] = await Promise.all([
      api.get('/api/evaluations/ratings'),
      api.get('/api/users'),
      api.get('/api/departments'),
      api.get('/api/teams'),
      api.get('/api/evaluations/dimensions')
    ]);
    
    ratings.value = ratingsData;
    allUsers.value = usersData;
    departments.value = deptsData;
    teams.value = teamsData;
    availableDimensions.value = dimsData;
    
    // 如果是编辑模式，加载任务详情
    if (taskId) {
      await loadTask(taskId);
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    ElMessage.error('加载数据失败');
  }
}

async function loadTask(id) {
  try {
    const task = await api.get(`/api/evaluations/tasks/${id}`);
    
    Object.assign(form, {
      rating_id: task.rating_id,
      name: task.name,
      quarter: task.quarter,
      type: task.type,
      leader_id: task.leader_id,
      reviewers: task.reviewers || [],
      reviewees: task.reviewees || [],
      dimensions: task.dimensions || []
    });
    
    // 初始化维度选择
    task.dimensions?.forEach(d => {
      selectedDimensions.value.push(d);
      selectedDimensionIds.value.push(d.dimension_id);
      dimensionWeights[d.dimension_id] = d.weight;
    });
  } catch (error) {
    console.error('加载任务失败:', error);
    ElMessage.error('加载任务失败');
  }
}

function handleSelectDimensions() {
  const tableSelection = document.querySelector('.el-table__body .el-table-column--selection');
  if (!tableSelection) return;
  
  const checkedRows = Array.from(
    document.querySelectorAll('.el-table__row.el-table__row--level-1.is-checked')
  ).map(row => {
    const index = parseInt(row.dataset.index);
    return availableDimensions.value[index];
  });
  
  checkedRows.forEach(dim => {
    if (!selectedDimensionIds.value.includes(dim.id)) {
      selectedDimensionIds.value.push(dim.id);
      dimensionWeights[dim.id] = 1.0;
    }
  });
  
  updateSelectedDimensions();
}

function updateSelectedDimensions() {
  selectedDimensions.value = availableDimensions.value.filter(dim =>
    selectedDimensionIds.value.includes(dim.id)
  );
}

function removeDimension(id) {
  selectedDimensionIds.value = selectedDimensionIds.value.filter(did => did !== id);
  delete dimensionWeights[id];
  updateSelectedDimensions();
}

function addReviewer() {
  if (!selectedReviewerId.value) return;
  
  form.reviewers.push({
    type: reviewerType.value,
    id: selectedReviewerId.value
  });
  
  selectedReviewerId.value = null;
}

function removeReviewer(index) {
  form.reviewers.splice(index, 1);
}

function addReviewee() {
  if (!selectedRevieweeId.value) return;
  
  form.reviewees.push({
    type: revieweeType.value,
    id: selectedRevieweeId.value
  });
  
  selectedRevieweeId.value = null;
}

function removeReviewee(index) {
  form.reviewees.splice(index, 1);
}

function getTypeLabel(type) {
  const labels = { user: '员工', department: '职能', team: '群组' };
  return labels[type] || type;
}

function getItemName(type, id) {
  if (type === 'user') {
    const user = allUsers.value.find(u => u.id === id);
    return user ? `${user.name}(${user.employee_id})` : '';
  }
  if (type === 'department') {
    const dept = departments.value.find(d => d.id === id);
    return dept?.name || '';
  }
  if (type === 'team') {
    const team = teams.value.find(t => t.id === id);
    return team?.name || '';
  }
  return '';
}

async function handleSubmit() {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    
    // 验证维度选择
    if (selectedDimensions.value.length === 0) {
      ElMessage.warning('请至少选择一个评分维度');
      return;
    }
    
    // 验证评分人和被评分人
    if (form.reviewers.length === 0) {
      ElMessage.warning('请至少添加一个评分人');
      return;
    }
    
    if (form.reviewees.length === 0) {
      ElMessage.warning('请至少添加一个被评分人');
      return;
    }
    
    try {
      saving.value = true;
      
      // 准备维度数据
      const dimensionsData = selectedDimensions.value.map(dim => ({
        dimension_id: dim.id,
        weight: dimensionWeights[dim.id] || 1.0
      }));
      
      const submitData = {
        ...form,
        dimensions: dimensionsData
      };
      
      if (taskId) {
        await api.put(`/api/evaluations/tasks/${taskId}`, submitData);
        ElMessage.success('更新成功');
      } else {
        await api.post('/api/evaluations/tasks', submitData);
        ElMessage.success('创建成功');
      }
      
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('操作失败:', error);
      ElMessage.error(error.response?.data?.error || '操作失败');
    } finally {
      saving.value = false;
    }
  });
}

onMounted(loadData);
</script>

<style scoped>
.page { padding: 8px 0 0; }
.admin-hero {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(230, 240, 255, .88));
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 24px;
  margin-bottom: 24px;
}
.section-chip {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  font-weight: 700;
}
.admin-hero h2 { margin: 0 0 8px; font-size: 32px; }
.admin-hero p { margin: 0; max-width: 680px; color: #60708a; line-height: 1.75; }

.task-form-container {
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 24px;
  border-radius: 14px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #1e293b;
}

.selector-container {
  display: flex;
  gap: 24px;
}

.selector-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.selector-right {
  flex: 1;
  border-left: 1px solid rgba(148, 163, 184, 0.18);
  padding-left: 24px;
}

.selected-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selected-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 14px;
}

.selected-dimensions {
  margin-top: 16px;
}

.selected-dimensions h4 {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 14px;
}

.dimension-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px 0;
}

@media (max-width: 768px) {
  .admin-hero { flex-direction: column; padding: 20px; }
  .selector-container { flex-direction: column; }
  .selector-right { border-left: none; border-top: 1px solid rgba(148, 163, 184, 0.18); padding-left: 0; padding-top: 16px; }
}
</style>
