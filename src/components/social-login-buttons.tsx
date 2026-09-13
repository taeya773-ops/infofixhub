"use client";

import { signIn } from "next-auth/react";

type SocialProvider = {
  id: string;
  label: string;
  enabled: boolean;
};

function ProviderLogo({ id }: { id: string }) {
  if (id === "google") return (
    <svg className="social-login-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.32 2.98-7.36Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.24-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.34-2.59Z" />
      <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.88-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.34 2.59C7.2 7.72 9.4 5.96 12 5.96Z" />
    </svg>
  );
  if (id === "kakao") return (
    <svg className="social-login-logo" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#000" d="M12 3C6.477 3 2 6.477 2 10.765c0 2.764 1.855 5.19 4.647 6.565-.205.76-.742 2.756-.85 3.183-.134.53.195.524.41.38.168-.111 2.673-1.816 3.754-2.553.66.11 1.342.17 2.039.17 5.523 0 10-3.477 10-7.765C22 6.477 17.523 3 12 3Z" />
    </svg>
  );
  return null;
}

export function SocialLoginButtons({ providers }: { providers: SocialProvider[] }) {
  return (
    <div className="social-login-list">
      {providers.map((provider) => (
        <div className="social-login-provider" key={provider.id}>
          <button
            className={`social-login-button social-login-button--${provider.id}`}
            type="button"
            disabled={!provider.enabled}
            onClick={() => signIn(provider.id, { callbackUrl: "/account" })}
          >
            <ProviderLogo id={provider.id} />
            <span>{provider.id === "kakao" ? "카카오 로그인" : provider.id === "google" ? "Google로 로그인" : provider.label}</span>
          </button>
          {!provider.enabled ? (
            <small className="muted">준비 중입니다.</small>
          ) : null}
        </div>
      ))}
    </div>
  );
}
