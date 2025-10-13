export function getToken(): string | null {
  return localStorage.getItem('flaek_jwt')
}

export function setToken(token: string) {
  localStorage.setItem('flaek_jwt', token)
}

export function clearToken() {
  localStorage.removeItem('flaek_jwt')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
