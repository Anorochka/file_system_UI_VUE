<script setup>
import { ref, computed } from 'vue'

const files = ref([
  {
    id: 1,
    name: 'Документ.pdf',
    size: 234567,
    createdAt: new Date().toISOString(),
    type: 'application/pdf'
  },
  {
    id: 2,
    name: 'Фото.jpg',
    size: 1456789,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'image/jpeg'
  }
])

const search = ref('')
const typeFilter = ref('')
const darkMode = ref(false)
const viewMode = ref('cards')

/* ===== form styles ===== */
const formClass = computed(() =>
  darkMode.value
    ? 'bg-gray-700 text-gray-100 border-gray-600'
    : 'bg-white text-gray-900 border-gray-300'
)

/* ===== filtering ===== */
const fileTypes = computed(() =>
  Array.from(new Set(files.value.map(f => f.type)))
)

const filteredFiles = computed(() =>
  files.value.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.value.toLowerCase())
    const matchesType = typeFilter.value ? f.type === typeFilter.value : true
    return matchesSearch && matchesType
  })
)

/* ===== statistics ===== */
const totalFiles = computed(() => filteredFiles.value.length)

const totalSize = computed(() =>
  filteredFiles.value.reduce((sum, f) => sum + f.size, 0)
)

const imageCount = computed(() =>
  filteredFiles.value.filter(f => f.type.startsWith('image/')).length
)

const pdfCount = computed(() =>
  filteredFiles.value.filter(f => f.type === 'application/pdf').length
)

const otherCount = computed(() =>
  filteredFiles.value.length - imageCount.value - pdfCount.value
)

/* ===== actions ===== */
function onFilesSelected(e) {
  const arr = Array.from(e.target.files)
  const now = Date.now()

  arr.forEach((f, i) => {
    files.value.unshift({
      id: now + i,
      name: f.name,
      size: f.size,
      createdAt: new Date().toISOString(),
      type: f.type || 'application/octet-stream'
    })
  })

  e.target.value = ''
}

function deleteFile(file) {
  if (!confirm(`Удалить "${file.name}"?`)) return
  files.value = files.value.filter(f => f.id !== file.id)
}

function downloadFile(file) {
  alert(`Загрузка файла: ${file.name}`)
}

/* ===== helpers ===== */
function humanSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  const units = ['KB', 'MB', 'GB', 'TB']
  let i = -1
  do {
    bytes /= 1024
    i++
  } while (bytes >= 1024 && i < units.length - 1)
  return bytes.toFixed(1) + ' ' + units[i]
}

function formattedDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU')
}

function fileSymbol(type) {
  if (!type) return '📁'
  if (type.startsWith('image/')) return '🖼️'
  if (type === 'application/pdf') return '📄'
  if (type.startsWith('video/')) return '🎞️'
  if (type.startsWith('audio/')) return '🎧'
  return '📦'
}
</script>

<template>
  <div
    class="min-h-screen p-6"
    :class="darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'"
  >
    <div
      class="max-w-6xl mx-auto shadow-lg rounded-2xl p-6"
      :class="darkMode ? 'bg-gray-800' : 'bg-white'"
    >
      <!-- HEADER -->
      <header class="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-semibold">File Manager</h1>
          <p class="text-sm text-gray-500">
            Просматривайте, добавляйте и удаляйте файлы
          </p>
        </div>

        <div class="flex gap-3 flex-wrap">
          <label class="bg-blue-600 text-white px-3 py-2 rounded-lg cursor-pointer">
            <input type="file" class="hidden" multiple @change="onFilesSelected" />
            Добавить
          </label>

          <select v-model="viewMode" class="border rounded px-2" :class="formClass">
            <option value="cards">Карточки</option>
            <option value="table">Таблица</option>
          </select>

          <button class="border px-3 py-2 rounded" @click="darkMode = !darkMode">
            {{ darkMode ? 'Светлая тема' : 'Тёмная тема' }}
          </button>
        </div>
      </header>

      <!-- FILTERS -->
      <section class="mb-4 flex gap-3">
        <input
          v-model="search"
          type="text"
          placeholder="Поиск по названию"
          class="flex-1 p-2 border rounded"
          :class="formClass"
        />
        <select v-model="typeFilter" class="p-2 border rounded" :class="formClass">
          <option value="">Все типы</option>
          <option v-for="t in fileTypes" :key="t">{{ t }}</option>
        </select>
      </section>

      <!-- CARDS -->
      <section v-if="viewMode === 'cards'">
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="file in filteredFiles"
            :key="file.id"
            class="flex gap-4 p-4 border rounded"
          >
            <div
              class="w-12 h-12 flex items-center justify-center rounded"
              :class="darkMode ? 'bg-gray-700' : 'bg-gray-200'"
            >
              {{ fileSymbol(file.type) }}
            </div>

            <div class="flex-1">
              <div class="font-medium">{{ file.name }}</div>
              <div class="text-sm text-gray-500">
                {{ humanSize(file.size) }} • {{ formattedDate(file.createdAt) }}
              </div>
            </div>

            <div class="flex flex-col gap-2">
              <button class="border rounded px-2" @click="downloadFile(file)">
                Скачать
              </button>
              <button
                class="bg-red-50 text-red-600 border rounded px-2"
                @click="deleteFile(file)"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- TABLE -->
      <section v-else>
        <table class="w-full border rounded">
          <thead :class="darkMode ? 'bg-gray-700' : 'bg-gray-200'">
            <tr>
              <th class="p-2 text-left">Имя</th>
              <th class="p-2">Размер</th>
              <th class="p-2">Дата</th>
              <th class="p-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="file in filteredFiles" :key="file.id" class="border-t">
              <td class="p-2">{{ file.name }}</td>
              <td class="p-2">{{ humanSize(file.size) }}</td>
              <td class="p-2">{{ formattedDate(file.createdAt) }}</td>
              <td class="p-2 text-right">
                <button class="text-red-600" @click="deleteFile(file)">
                  Удалить
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- EMPTY -->
      <div v-if="filteredFiles.length === 0" class="text-center text-gray-500 py-8">
        Файлы не найдены
      </div>

      <!-- STATISTICS -->
      <footer
        class="mt-8 p-4 rounded-lg border text-sm flex flex-wrap gap-6 justify-between"
        :class="darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'"
      >
        <div>📄 Файлов: <b>{{ totalFiles }}</b></div>
        <div>💾 Размер: <b>{{ humanSize(totalSize) }}</b></div>
        <div>🖼️ Изображения: <b>{{ imageCount }}</b></div>
        <div>📄 PDF: <b>{{ pdfCount }}</b></div>
        <div>📦 Прочие: <b>{{ otherCount }}</b></div>
      </footer>
    </div>
  </div>
</template>
