"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyEmail
} from "@/lib/api";

const initialForms = {
  login: { email: "", password: "" },
  register: {
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    country: "",
    address: ""
  },
  verify: { otp: "" },
  resetRequest: { email: "" },
  reset: { otp: "", newPassword: "" }
};

const screenContent = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to your Hulex account.",
    copy: "Return to your saved corridors, alerts, and provider review checks without redoing your last comparison.",
    panelTitle: "Sign in",
    panelCopy: "Use your email and password to continue.",
    icon: "login",
    storyLabel: "Account access",
    storyTitle: "Pick up your market tracking where you left it.",
    storyCopy: "Your account keeps the corridors you watch and the review context behind each provider.",
    stats: [
      { label: "Saved routes", value: "Ready" },
      { label: "Alerts", value: "Live" },
      { label: "History", value: "Synced" }
    ],
    features: [
      {
        title: "Saved comparisons",
        copy: "Jump back into the payout routes you already checked.",
        icon: "clock"
      },
      {
        title: "Rate alerts",
        copy: "Track the corridors that matter without refreshing manually.",
        icon: "bell"
      }
    ],
    links: [
      { href: "/auth/register", label: "Create account" },
      { href: "/auth/reset", label: "Forgot password?" }
    ]
  },
  register: {
    eyebrow: "Create your account",
    title: "Open a private Hulex account for alerts and history.",
    copy: "Start with live comparison on the homepage, then create an account when you want saved checks and follow-up tools.",
    panelTitle: "Create account",
    panelCopy: "Set up your profile to unlock your private rate dashboard.",
    icon: "user-plus",
    storyLabel: "Private dashboard",
    storyTitle: "Track better routes without cluttering the homepage.",
    storyCopy: "Your account adds private tracking and saved review context on top of the live public comparison flow.",
    stats: [
      { label: "Alerts", value: "Custom" },
      { label: "History", value: "Stored" },
      { label: "Access", value: "Any device" }
    ],
    features: [
      {
        title: "Provider trust context",
        copy: "Keep review signals near the providers you compare most.",
        icon: "shield"
      },
      {
        title: "Cross-device access",
        copy: "Check rates on mobile, then continue from desktop later.",
        icon: "devices"
      }
    ],
    links: [
      { href: "/auth", label: "Already have an account?" },
      { href: "/auth/verify", label: "Need to verify email?" }
    ]
  },
  verify: {
    eyebrow: "Verify your email",
    title: "Confirm your email and unlock the full account.",
    copy: "Use the OTP sent to your inbox to complete account setup and activate private tracking.",
    panelTitle: "Verify email",
    panelCopy: "Enter the OTP from your email to activate your account.",
    icon: "shield",
    storyLabel: "One quick step",
    storyTitle: "Finish setup before you return to the market.",
    storyCopy: "Verification keeps the account flow clean and gives you a secure path back into your dashboard.",
    stats: [
      { label: "OTP", value: "1 code" },
      { label: "Setup", value: "Final step" },
      { label: "Access", value: "Unlocked" }
    ],
    features: [
      {
        title: "Fast activation",
        copy: "Complete verification and move straight back to comparison.",
        icon: "bolt"
      },
      {
        title: "Secure recovery",
        copy: "A verified inbox helps keep password recovery straightforward later.",
        icon: "mail"
      }
    ],
    links: [
      { href: "/auth", label: "Back to sign in" },
      { href: "/auth/register", label: "Create another account" }
    ]
  },
  reset: {
    eyebrow: "Recover access",
    title: "Reset your password without leaving the auth flow.",
    copy: "Request a reset OTP, then set a new password from the same screen once the code arrives.",
    panelTitle: "Reset password",
    panelCopy: "Start by sending yourself a reset OTP, then complete the password update below.",
    icon: "key",
    storyLabel: "Account recovery",
    storyTitle: "Get back into your account cleanly.",
    storyCopy: "The reset flow keeps the request step and the password update step together so it is easier to complete on mobile.",
    stats: [
      { label: "OTP", value: "Requested" },
      { label: "Password", value: "Updated" },
      { label: "Access", value: "Restored" }
    ],
    features: [
      {
        title: "Simple recovery",
        copy: "Request the code and apply the new password from one screen.",
        icon: "otp"
      },
      {
        title: "Back to work",
        copy: "Once reset is complete, sign in again and return to your saved routes.",
        icon: "login"
      }
    ],
    links: [
      { href: "/auth", label: "Back to sign in" },
      { href: "/auth/register", label: "Need an account instead?" }
    ]
  }
};

function AuthGlyph({ icon }) {
  const commonProps = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: "1.8",
    viewBox: "0 0 24 24"
  };

  if (icon === "login") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M14 5h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4" />
        <path d="M10 17 15 12 10 7" />
        <path d="M15 12H4" />
      </svg>
    );
  }

  if (icon === "user-plus") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 21a7 7 0 0 0-7-7" />
        <path d="M5 14a7 7 0 0 1 14 0" />
        <circle cx="12" cy="7" r="4" />
        <path d="M19 8v6" />
        <path d="M16 11h6" />
      </svg>
    );
  }

  if (icon === "shield") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M12 3l7 3v5c0 5-3.2 8-7 10-3.8-2-7-5-7-10V6l7-3Z" />
        <path d="m9.5 12 1.8 1.8L15 10.2" />
      </svg>
    );
  }

  if (icon === "key") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <circle cx="8" cy="15" r="4" />
        <path d="M12 15h9" />
        <path d="M18 15v-3" />
        <path d="M21 15v-2" />
      </svg>
    );
  }

  if (icon === "bell") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M15 17H5l1.5-2.5V10a5.5 5.5 0 1 1 11 0v4.5L19 17h-4" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
    );
  }

  if (icon === "clock") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v5l3 2" />
      </svg>
    );
  }

  if (icon === "devices") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="9" rx="2" width="12" x="3" y="5" />
        <path d="M7 19h4" />
        <rect height="9" rx="1.4" width="4.5" x="16.5" y="9" />
      </svg>
    );
  }

  if (icon === "mail") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="14" rx="2" width="18" x="3" y="5" />
        <path d="m5 7 7 6 7-6" />
      </svg>
    );
  }

  if (icon === "lock") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="10" rx="2" width="14" x="5" y="11" />
        <path d="M8 11V8a4 4 0 1 1 8 0v3" />
      </svg>
    );
  }

  if (icon === "phone") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M7 4h4l1 4-2 1.5a14 14 0 0 0 4.5 4.5L16 12l4 1v4a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 5 6.2 2 2 0 0 1 7 4Z" />
      </svg>
    );
  }

  if (icon === "map") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="m3 7 6-3 6 3 6-3v13l-6 3-6-3-6 3Z" />
        <path d="M9 4v13" />
        <path d="M15 7v13" />
      </svg>
    );
  }

  if (icon === "home") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6 9.5V20h12V9.5" />
      </svg>
    );
  }

  if (icon === "otp") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <rect height="12" rx="2" width="18" x="3" y="6" />
        <path d="M7 12h.01" />
        <path d="M12 12h.01" />
        <path d="M17 12h.01" />
      </svg>
    );
  }

  if (icon === "eye") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  if (icon === "eye-off") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M3 3 21 21" />
        <path d="M10.6 6.3A11.3 11.3 0 0 1 12 6c6.5 0 10 6 10 6a18.3 18.3 0 0 1-3 3.6" />
        <path d="M6.4 6.9A18 18 0 0 0 2 12s3.5 6 10 6c1.5 0 2.9-.3 4.2-.8" />
        <path d="M9.9 9.9A3 3 0 0 0 14.1 14.1" />
      </svg>
    );
  }

  if (icon === "bolt") {
    return (
      <svg aria-hidden="true" {...commonProps}>
        <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" {...commonProps}>
      <path d="M4 12h16" />
      <path d="M12 4v16" />
    </svg>
  );
}

function FieldShell({
  children,
  icon,
  htmlFor,
  label,
  hint,
  passwordToggle,
  onTogglePassword,
  showPassword
}) {
  return (
    <div className="field">
      <div className="field-label-row">
        <label htmlFor={htmlFor}>{label}</label>
        {hint ? <span className="field-hint">{hint}</span> : null}
      </div>
      <div className={passwordToggle ? "field-shell field-shell-password" : "field-shell"}>
        <span className="field-icon" aria-hidden="true">
          <AuthGlyph icon={icon} />
        </span>
        {children}
        {passwordToggle ? (
          <button className="password-toggle" onClick={onTogglePassword} type="button">
            <AuthGlyph icon={showPassword ? "eye-off" : "eye"} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function AuthShell({ mode = "login", notice = "", email = "" }) {
  const router = useRouter();
  const { setSession, refreshUser, user, isAuthenticated } = useAuth();
  const [forms, setForms] = useState(() => ({
    ...initialForms,
    login: { ...initialForms.login, email },
    register: { ...initialForms.register, email },
    resetRequest: { ...initialForms.resetRequest, email }
  }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(notice);
  const [error, setError] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const activeMode = screenContent[mode] ? mode : "login";
  const screen = screenContent[activeMode];

  useEffect(() => {
    setMessage(notice);
  }, [notice]);

  useEffect(() => {
    if (!email) {
      return;
    }

    setForms((current) => ({
      ...current,
      login: { ...current.login, email: current.login.email || email },
      register: { ...current.register, email: current.register.email || email },
      resetRequest: {
        ...current.resetRequest,
        email: current.resetRequest.email || email
      }
    }));
  }, [email]);

  const updateForm = (group, key, value) => {
    setForms((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [key]: value
      }
    }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const data = await loginUser(forms.login);
      setSession(data.user);
      await refreshUser();
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const data = await registerUser(forms.register);
      router.push(
        `/auth/verify?email=${encodeURIComponent(forms.register.email)}&notice=${encodeURIComponent(data.message || "Account created. Enter the OTP from your email.")}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const data = await verifyEmail(forms.verify);
      router.push(
        `/auth?notice=${encodeURIComponent(data.message || "Email verified. Sign in to continue.")}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetRequest = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const data = await requestPasswordReset(forms.resetRequest);
      setMessage(data.message || "Reset OTP sent. Enter the code and your new password below.");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      const data = await resetPassword(forms.reset);
      router.push(
        `/auth?notice=${encodeURIComponent(data.message || "Password reset. Sign in with your new password.")}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLoginForm = () => (
    <form className="form-grid auth-form-grid" onSubmit={handleLogin}>
      <FieldShell htmlFor="login-email" icon="mail" label="Email">
        <input
          id="login-email"
          placeholder="name@example.com"
          type="email"
          value={forms.login.email}
          onChange={(event) => updateForm("login", "email", event.target.value)}
        />
      </FieldShell>

      <FieldShell
        htmlFor="login-password"
        icon="lock"
        label="Password"
        passwordToggle
        showPassword={showLoginPassword}
        onTogglePassword={() => setShowLoginPassword((current) => !current)}
      >
        <input
          id="login-password"
          placeholder="Enter your password"
          type={showLoginPassword ? "text" : "password"}
          value={forms.login.password}
          onChange={(event) => updateForm("login", "password", event.target.value)}
        />
      </FieldShell>

      <div className="auth-actions-row">
        <button className="button button-primary auth-submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
        <Link className="auth-text-link" href="/auth/reset">
          Forgot password?
        </Link>
      </div>
    </form>
  );

  const renderRegisterForm = () => (
    <form className="form-grid auth-form-grid" onSubmit={handleRegister}>
      <div className="field-row">
        <FieldShell htmlFor="first-name" icon="user-plus" label="First name">
          <input
            id="first-name"
            placeholder="First name"
            value={forms.register.firstName}
            onChange={(event) => updateForm("register", "firstName", event.target.value)}
          />
        </FieldShell>

        <FieldShell htmlFor="last-name" icon="user-plus" label="Last name">
          <input
            id="last-name"
            placeholder="Last name"
            value={forms.register.lastName}
            onChange={(event) => updateForm("register", "lastName", event.target.value)}
          />
        </FieldShell>
      </div>

      <div className="field-row">
        <FieldShell htmlFor="register-email" icon="mail" label="Email">
          <input
            id="register-email"
            placeholder="name@example.com"
            type="email"
            value={forms.register.email}
            onChange={(event) => updateForm("register", "email", event.target.value)}
          />
        </FieldShell>

        <FieldShell htmlFor="register-phone" icon="phone" label="Phone">
          <input
            id="register-phone"
            placeholder="+234..."
            value={forms.register.phone}
            onChange={(event) => updateForm("register", "phone", event.target.value)}
          />
        </FieldShell>
      </div>

      <div className="field-row">
        <FieldShell htmlFor="register-country" icon="map" label="Country">
          <input
            id="register-country"
            placeholder="Country"
            value={forms.register.country}
            onChange={(event) => updateForm("register", "country", event.target.value)}
          />
        </FieldShell>

        <FieldShell
          htmlFor="register-password"
          icon="lock"
          label="Password"
          passwordToggle
          showPassword={showRegisterPassword}
          onTogglePassword={() => setShowRegisterPassword((current) => !current)}
        >
          <input
            id="register-password"
            placeholder="Create a password"
            type={showRegisterPassword ? "text" : "password"}
            value={forms.register.password}
            onChange={(event) => updateForm("register", "password", event.target.value)}
          />
        </FieldShell>
      </div>

      <FieldShell htmlFor="register-address" icon="home" label="Address" hint="Optional">
        <input
          id="register-address"
          placeholder="Street, city, area"
          value={forms.register.address}
          onChange={(event) => updateForm("register", "address", event.target.value)}
        />
      </FieldShell>

      <button className="button button-primary auth-submit-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Creating..." : "Create account"}
      </button>
    </form>
  );

  const renderVerifyForm = () => (
    <form className="form-grid auth-form-grid auth-single-form" onSubmit={handleVerify}>
      <FieldShell htmlFor="verify-otp" icon="otp" label="Email verification OTP">
        <input
          id="verify-otp"
          placeholder="Enter OTP"
          value={forms.verify.otp}
          onChange={(event) => updateForm("verify", "otp", event.target.value)}
        />
      </FieldShell>

      <button className="button button-primary auth-submit-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Verifying..." : "Verify email"}
      </button>
    </form>
  );

  const renderResetForm = () => (
    <div className="auth-step-grid">
      <form className="form-grid auth-step-card" onSubmit={handleResetRequest}>
        <div className="auth-panel-caption">
          <span className="section-kicker">Step 1</span>
          <h3>Request reset OTP</h3>
          <p>Send a reset code to the email tied to your Hulex account.</p>
        </div>

        <FieldShell htmlFor="reset-email" icon="mail" label="Account email">
          <input
            id="reset-email"
            placeholder="name@example.com"
            type="email"
            value={forms.resetRequest.email}
            onChange={(event) => updateForm("resetRequest", "email", event.target.value)}
          />
        </FieldShell>

        <button className="button button-secondary auth-submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Sending..." : "Send reset OTP"}
        </button>
      </form>

      <form className="form-grid auth-step-card" onSubmit={handleReset}>
        <div className="auth-panel-caption">
          <span className="section-kicker">Step 2</span>
          <h3>Set new password</h3>
          <p>Use the OTP from your email and choose a new password.</p>
        </div>

        <div className="field-row">
          <FieldShell htmlFor="reset-otp" icon="otp" label="OTP">
            <input
              id="reset-otp"
              placeholder="Enter OTP"
              value={forms.reset.otp}
              onChange={(event) => updateForm("reset", "otp", event.target.value)}
            />
          </FieldShell>

          <FieldShell
            htmlFor="reset-password-new"
            icon="lock"
            label="New password"
            passwordToggle
            showPassword={showResetPassword}
            onTogglePassword={() => setShowResetPassword((current) => !current)}
          >
            <input
              id="reset-password-new"
              placeholder="Create new password"
              type={showResetPassword ? "text" : "password"}
              value={forms.reset.newPassword}
              onChange={(event) => updateForm("reset", "newPassword", event.target.value)}
            />
          </FieldShell>
        </div>

        <button className="button button-primary auth-submit-button" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </div>
  );

  const renderForm = () => {
    if (activeMode === "register") {
      return renderRegisterForm();
    }

    if (activeMode === "verify") {
      return renderVerifyForm();
    }

    if (activeMode === "reset") {
      return renderResetForm();
    }

    return renderLoginForm();
  };

  return (
    <section className="auth-shell auth-shell-modern">
      <div className="auth-grid">
        <div className="auth-copy auth-copy-modern">
          <div className="auth-copy-head">
            <span className="eyebrow">{screen.eyebrow}</span>
            <h1>{screen.title}</h1>
            <p>{screen.copy}</p>
          </div>

          <article className="auth-hero-card">
            <div className="auth-hero-card-top">
              <span className="auth-panel-icon" aria-hidden="true">
                <AuthGlyph icon={screen.icon} />
              </span>
              <div>
                <span className="section-kicker">{screen.storyLabel}</span>
                <h2>{screen.storyTitle}</h2>
              </div>
            </div>
            <p>{screen.storyCopy}</p>
          </article>

          <div className="auth-stat-row">
            {screen.stats.map((item) => (
              <article className="auth-stat-card" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>

          <div className="auth-feature-stack">
            {screen.features.map((item) => (
              <article className="highlight-item auth-highlight-card" key={item.title}>
                <span className="auth-highlight-icon" aria-hidden="true">
                  <AuthGlyph icon={item.icon} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.copy}</p>
                </div>
              </article>
            ))}
          </div>

          {isAuthenticated ? (
            <div className="info-message">
              Signed in as {user?.firstName || "user"}. You can go straight to your dashboard.
            </div>
          ) : null}
        </div>

        <div className="auth-panel auth-panel-modern auth-panel-compact">
          <div className="auth-panel-head auth-panel-head-compact">
            <div className="auth-panel-intro">
              <span className="auth-panel-icon" aria-hidden="true">
                <AuthGlyph icon={screen.icon} />
              </span>
              <div>
                <h2>{screen.panelTitle}</h2>
                <p>{screen.panelCopy}</p>
              </div>
            </div>

            <div className="auth-link-row">
              {screen.links.map((item) => (
                <Link className="auth-text-link" href={item.href} key={item.href}>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {message ? <div className="status-message">{message}</div> : null}
          {error ? <div className="error-message">{error}</div> : null}

          {renderForm()}
        </div>
      </div>
    </section>
  );
}
