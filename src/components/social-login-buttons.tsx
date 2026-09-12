"use client";

import { signIn } from "next-auth/react";

type SocialProvider = {
  id: string;
  label: string;
  enabled: boolean;
};

export function SocialLoginButtons({ providers }: { providers: SocialProvider[] }) {
  return (
    <div className="social-login-list">
      {providers.map((provider) => (
        <div className="social-login-provider" key={provider.id}>
          <button
            className="social-login-button"
            type="button"
            disabled={!provider.enabled}
            onClick={() => signIn(provider.id, { callbackUrl: "/account" })}
          >
            {provider.label}
          </button>
          {!provider.enabled ? (
            <small className="muted">운영 환경변수 설정 후 활성화됩니다.</small>
          ) : null}
        </div>
      ))}
    </div>
  );
}
