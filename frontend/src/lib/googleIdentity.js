let scriptPromise
let initializedClientId
let activeCredentialCallback

function ensureGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-google-identity]')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.dataset.googleIdentity = 'true'
    }

    script.addEventListener('load', resolve, { once: true })
    script.addEventListener('error', reject, { once: true })
    if (!script.isConnected) document.head.appendChild(script)
  })

  return scriptPromise
}

export async function mountGoogleButton(container, clientId, onCredential, isActive = () => true) {
  await ensureGoogleIdentityScript()
  if (!isActive()) return false

  const identity = window.google?.accounts?.id
  if (!identity) throw new Error('Google Identity Services did not initialize.')
  if (initializedClientId && initializedClientId !== clientId) {
    throw new Error('Google Identity Services is already initialized with a different client ID.')
  }

  activeCredentialCallback = onCredential
  if (!initializedClientId) {
    identity.initialize({
      client_id: clientId,
      callback: (response) => activeCredentialCallback?.(response),
    })
    initializedClientId = clientId
  }

  identity.renderButton(container, {
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width: Math.min(container.clientWidth, 400),
  })
  return true
}

export function unmountGoogleButton(container, onCredential) {
  container.replaceChildren()
  if (activeCredentialCallback === onCredential) activeCredentialCallback = undefined
}
