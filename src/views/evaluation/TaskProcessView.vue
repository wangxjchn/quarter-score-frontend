<template>
  <div class="page">
    <section class="admin-hero">
      <div>
        <p class="section-chip">任务处理</p>
        <h2>{{ taskInfo?.name || '加载中...' }}</h2>
        <p>{{ taskInfo?.description || '请完成评分任务' }}</p>
      </div>
      <div class="hero-actions">
        <el-button type="success" @click="submitScores" :loading="submitting">提交评分</el-button>
        <el-button @click="$router.back()">返回</el-button>
      </div>
    </section>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-wrap">
      <el-icon class="is-loading" :size="48"><Loading /></el-icon>
      <p>加载中...</p>
    </div>

    <!-- 关系指定任务：选择评分人 -->
    <div v-else-if="taskType === 'leader_assigned'" class="process-container">
      <el-card class="process-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span>指定评分人</span>
            <el-tag type="warning">关系指定任务</el-tag>
          </div>
        </template>
        
        <div v-for="(reviewee, index) in taskInfo?.details?.reviewees || []" :key="reviewee.id" class="reviewee-item">
          <div class="reviewee-info">
            <span class="reviewee-name">{{ reviewee.name }}（{{ reviewee.employee_id }}）</span>
            <span class="reviewee-label">被评分人</span>
          </div>
          <el-select 
            v-model="selectedReviewers[index]" 
            placeholder="请输入搜索评分人"
            filterable
            multiple
            style="width: 100%;"
          >
            <el-option
              v-for="reviewer in availableReviewers" 
              :key="reviewer.id"
              :label="reviewer.name"
              :value="reviewer.id"
            >
              <span style="float: left">{{ reviewer.name }}</span>
              <span style="float: right; color: #8491a4; font-size: 13px">
                ({{ reviewer.employee_id }})
              </span>
            </el-option>
          </el-select>
        </div>
      </el-card>
    </div>

    <!-- 直接评分任务：按维度评分 -->
    <div v-else-if="taskType === 'direct'" class="process-container">
      <el-card v-for="(reviewee, revieweeIndex) in taskInfo?.details?.reviewees || []" 
               :key="reviewee.id" 
               class="process-card" 
               shadow="never"
      >
        <template #header>
          <div class="card-header">
            <span>被评分人：{{ reviewee.name }}（{{ reviewee.employee_id }}）</span>
            <el-tag type="success">直接评分</el-tag>
          </div>
        </template>
        
        <div class="dimension-list">
          <div v-for="(dimension, dimIndex) in dimensions" :key="dimension.id" class="dimension-item">
            <div class="dimension-header">
              <span class="dimension-name">{{ dimension.name }}</span>
              <span class="dimension-weight">权重：{{ (dimension.weight * 100).toFixed(0) }}%</span>
            </div>
            <div class="dimension-input">
              <el-input-number
                v-model="scores[revieweeIndex][dimension.id]"
                :min="dimension.min_score"
                :max="dimension.max_score"
                :step="0.1"
                :precision="1"
                :disabled="dimension.readonly"
                style="width: 100%;"
                @change="calculateTotal(revieweeIndex)"
              />
              <div class="score-range">
                范围：{{ dimension.min_score }} - {{ dimension.max_score }}
              </div>
            </div>
          </div>
          
          <div class="total-score">
            <span class="total-label">总分：</span>
            <span class="total-value">{{ totalScores[revieweeIndex] }}</span>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { api } from '../../api';
import { state } from '../../store';
import * as Lower32 from '../../utils/lower32';

const route = useRoute();
const router = useRouter();
const taskId = route.params.taskId;

const loading = ref(true);
const submitting = ref(false);
const taskInfo = ref(null);
const taskType = ref('');
const dimensions = ref([]);
const availableReviewers = ref([]);
const selectedReviewers = ref({});
const scores = ref({});
const totalScores = ref({});

// 加载任务信息
async function loadTask() {
  try {
    // 解码路由参数中的 Lower32 名称
    const taskName = Lower32.decode(taskId);
    
    const response = await api.get(`/api/evaluations/my-tasks`);
    // 通过名称查找任务
    const task = response.find(t => t.name === taskName);
    
    if (!task) {
      ElMessage.error('任务不存在');
      router.back();
      return;
    }
    
    taskInfo.value = task;
    taskType.value = task.type;
    
    if (task.type === 'leader_assigned') {
      // 关系指定任务：获取可用评分人列表
      await loadAvailableReviewers();
    } else if (task.type === 'direct') {
      // 直接评分任务：获取维度并初始化分数
      await loadDimensions();
    }
  } catch (error) {
    console.error('加载任务失败:', error);
    ElMessage.error('加载任务失败');
  } finally {
    loading.value = false;
  }
}

// 加载可用评分人（用于 leader_assigned 类型）
async function loadAvailableReviewers() {
  try {
    // 优先使用任务详情中的评分人列表
    const existingReviewers = taskInfo.value?.details?.reviewers || [];
    
    if (existingReviewers.length > 0) {
      // 如果任务中已有评分人，直接使用
      availableReviewers.value = existingReviewers.map(r => ({
        id: r.id,
        name: r.name,
        employee_id: r.employee_id
      }));
    } else {
      // 如果没有现有评分人，获取所有用户作为候选
      const users = await api.get('/api/users');
      availableReviewers.value = users.map(u => ({
        id: u.id,
        name: u.name,
        employee_id: u.employee_id
      }));
    }
    
    // 初始化为空数组（默认不选中任何人）
    const reviewees = taskInfo.value?.details?.reviewees || [];
    reviewees.forEach((_, index) => {
      selectedReviewers.value[index] = [];
    });
  } catch (error) {
    console.error('加载评分人列表失败:', error);
  }
}

// 加载评分维度（用于 direct 类型）
async function loadDimensions() {
  try {
    const dims = await api.get('/api/evaluations/dimensions');
    dimensions.value = dims.map(d => ({
      ...d,
      weight: d.weight || 1.0,
      readonly: false
    }));
    
    // 初始化每个被评分人的分数
    const reviewees = taskInfo.value?.details?.reviewees || [];
    reviewees.forEach((_, index) => {
      scores.value[index] = {};
      totalScores.value[index] = 0;
    });
  } catch (error) {
    console.error('加载维度失败:', error);
  }
}

// 计算总分
function calculateTotal(revieweeIndex) {
  let total = 0;
  let totalWeight = 0;
  
  dimensions.value.forEach(dim => {
    const score = scores.value[revieweeIndex][dim.id] || 0;
    total += score * dim.weight;
    totalWeight += dim.weight;
  });
  
  // 如果权重和不为 1，需要归一化
  totalScores.value[revieweeIndex] = totalWeight > 0 ? (total / totalWeight).toFixed(1) : 0;
}

// 提交评分
async function submitScores() {
  try {
    submitting.value = true;
    
    if (taskType.value === 'leader_assigned') {
      // 提交评分人选择
      const reviewees = taskInfo.value?.details?.reviewees || [];
      const relationships = [];
      
      reviewees.forEach((reviewee, index) => {
        const selectedIds = selectedReviewers.value[index] || [];
        
        if (selectedIds.length === 0) {
          ElMessage.warning(`请为被评分人 "${reviewee.name}" 至少选择一个评分人`);
          return;
        }
        
        // 构建关系对象
        relationships.push({
          reviewee: reviewee.id,
          reviewers: selectedIds
        });
      });
      
      if (relationships.length === 0) {
        ElMessage.error('请至少为一个被评分人选择评分人');
        return;
      }
      
      await api.post(`/api/evaluations/tasks/${taskInfo.value.details.id}/assign-reviewers`, {
        task_id: taskInfo.value.details.id,
        relationships
      });
      
      ElMessage.success(`成功指定 ${relationships.length} 个被评分人的评分关系`);
    } else if (taskType.value === 'direct') {
      // 提交评分
      const reviewees = taskInfo.value?.details?.reviewees || [];
      const scoreSubmissions = [];
      
      reviewees.forEach((reviewee, index) => {
        const revieweeScores = scores.value[index];
        const detailScores = [];
        let hasScore = false;
        
        // 按维度顺序收集分数（只保留分数值）
        dimensions.value.forEach(dim => {
          const score = revieweeScores[dim.id];
          if (score !== undefined && score !== null) {
            detailScores.push(parseFloat(score));
            hasScore = true;
          } else {
            detailScores.push(null); // 保持维度顺序，未评分的维度为 null
          }
        });
        
        // 如果有分数，创建一条评分记录
        if (hasScore) {
          scoreSubmissions.push({
            task_id: taskInfo.value.details.id,      // 保留原始任务 ID
            reviewer_id: state.user.id,              // 当前评分人 ID
            reviewee_id: reviewee.id,                // 被评分人 ID
            final_score: totalScores.value[index],   // 最终分数
            detail_scores: detailScores              // 详细分数（分数值数组）
          });
        }
      });
      
      if (scoreSubmissions.length === 0) {
        ElMessage.warning('请至少输入一个分数');
        return;
      }
      
      await api.post(`/api/evaluations/tasks/${taskInfo.value.details.id}/scores`, {
        submissions: scoreSubmissions
      });
      
      ElMessage.success(`成功提交 ${scoreSubmissions.length} 个评分记录`);
    }
    
    router.back();
  } catch (error) {
    console.error('提交失败:', error);
    ElMessage.error(error.response?.data?.error || '提交失败');
  } finally {
    submitting.value = false;
  }
}

onMounted(loadTask);
</script>

<style scoped>
.page {
  padding: 8px 0 0;
}

.admin-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255,255,255,.98), rgba(230, 240, 255, .9));
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
  margin-bottom: 18px;
}

.section-chip {
  margin: 0 0 8px;
  color: #1d4ed8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
}

.admin-hero h2 {
  margin: 0;
  font-size: clamp(24px, 4vw, 32px);
}

.admin-hero p {
  margin: 12px 0 0;
  color: #60708a;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.loading-wrap {
  text-align: center;
  padding: 64px 0;
  color: #94a3b8;
}

.process-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 24px 24px;
}

.process-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header span:first-child {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.reviewee-item {
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  margin-bottom: 16px;
  background: #f8fafc;
}

.reviewee-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.reviewee-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.reviewee-label {
  font-size: 12px;
  color: #64748b;
  padding: 4px 8px;
  background: #e2e8f0;
  border-radius: 4px;
}

/* 让 select 高度自适应 */
.reviewee-item :deep(.el-select) {
  height: auto;
  min-height: 32px;
}

/* 多选标签容器样式 */
.reviewee-item :deep(.el-select__tags) {
  padding: 4px 8px;
  max-height: none; /* 不限制最大高度 */
  overflow: visible; /* 允许内容溢出显示 */
}

/* 单个标签样式 */
.reviewee-item :deep(.el-tag) {
  margin: 4px;
  height: auto;
  line-height: 1.5;
}

.dimension-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-item {
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 10px;
  background: #f8fafc;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.dimension-name {
  font-weight: 600;
  color: #1e293b;
  font-size: 15px;
}

.dimension-weight {
  font-size: 13px;
  color: #64748b;
}

.dimension-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.score-range {
  font-size: 12px;
  color: #94a3b8;
}

.total-score {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  margin-top: 16px;
  border-top: 2px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.05), rgba(6, 182, 212, 0.05));
  border-radius: 10px;
}

.total-label {
  font-weight: 700;
  color: #1e293b;
  font-size: 16px;
}

.total-value {
  font-weight: 700;
  color: #1d4ed8;
  font-size: 24px;
}

@media (max-width: 768px) {
  .admin-hero {
    grid-template-columns: 1fr;
  }
  
  .hero-actions {
    justify-content: flex-end;
  }
  
  .process-container {
    padding: 0 16px 16px;
  }
}
</style>
