<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SignIn, SignUp, UserButton, useAuth } from '@clerk/vue'

const isLogin = ref(true)
const backendStatus = ref<string>('Testing connection...')
const { isSignedIn, getToken } = useAuth()

onMounted(() => {
  testBackend()
})

const testBackend = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}api/health`)
    if (res.ok) {
      const token = await getToken.value()
      if (!token) {
        backendStatus.value = "Connected to backend (Waiting for login to test auth)"
        return
      }
      const authRes = await fetch(`${import.meta.env.VITE_API_URL}api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (authRes.status === 403) {
        backendStatus.value = "Connected! (Users API blocked: Requires ADMIN role)"
      } else if (authRes.ok) {
        backendStatus.value = "Connected! (Users API authenticated)"
      } else {
        backendStatus.value = "Connected to backend, but auth failed."
      }
    } else {
      backendStatus.value = "Failed to connect to backend."
    }
  } catch (err) {
    backendStatus.value = "Backend is unreachable. Is it running?"
  }
}
</script>

<template>
  <div v-if="isSignedIn" class="min-h-screen bg-gray-100">
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div class="flex items-center">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg p-8 flex flex-col items-center justify-center bg-white space-y-4">
          <h2 class="text-2xl font-semibold text-gray-800">Welcome back!</h2>
          <p class="text-gray-600">You are securely authenticated with Clerk.</p>
          
          <div class="mt-8 p-4 bg-gray-50 rounded-md border border-gray-200 w-full max-w-md text-center">
            <h3 class="font-medium text-gray-900 mb-2">Backend Connection Status:</h3>
            <p class="text-sm" :class="backendStatus.includes('Connected') ? 'text-green-600' : 'text-red-600'">
              {{ backendStatus }}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>

  <div v-else class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
      <SignIn v-if="isLogin" />
      <SignUp v-else />
      <button 
        @click="isLogin = !isLogin"
        class="mt-4 text-blue-600 hover:underline"
      >
        {{ isLogin ? "Need an account? Sign Up" : "Already have an account? Sign In" }}
      </button>
    </div>
  </div>
</template>
