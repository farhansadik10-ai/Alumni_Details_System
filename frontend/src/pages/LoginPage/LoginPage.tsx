import { useAtomValue, useSetAtom } from "jotai";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout/AuthLayout";
import { Button } from "../../components/ui/Button/Button";
import { Checkbox } from "../../components/ui/Checkbox/Checkbox";
import { Link } from "../../components/ui/Link/Link";
import { Message } from "../../components/ui/Message/Message";
import { PasswordInput } from "../../components/ui/PasswordInput/PasswordInput";
import { TextInput } from "../../components/ui/TextInput/TextInput";
import { CONTACT_EMAIL } from "../../config/app";
import { REMEMBERED_EMAIL_STORAGE_KEY } from "../../config/storageKeys";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { useFormError } from "../../hooks/useFormError";
import { readStored } from "../../lib/browserStorage";
import {
  GENERAL_ERROR_MESSAGE,
  MAX_EMAIL_LENGTH,
  validateEmail,
  validateLoginPassword,
} from "../../lib/validation";
import { PATHS } from "../../routes/paths";
import { logInAtom } from "../../store/sessionActions";
import { authNoticeAtom } from "../../store/sessionAtoms";
import styles from "./LoginPage.module.css";

const PAGE_TITLE = "Log in";
const HEADLINE = "Stay close to the people you studied with.";
const SUB_TEXT = "Find graduates, follow their news and ask for advice.";
const LEAD_TEXT = "Use the email you signed up with.";

const EMAIL_LABEL = "Email";
const PASSWORD_LABEL = "Password";
const REMEMBER_LABEL = "Remember my email on this device";
const SUBMIT_LABEL = "Log in";
const SUBMIT_BUSY_LABEL = "Logging in…";

const NEW_HERE_TEXT = "New here? ";
const SIGN_UP_LINK_TEXT = "Create an account";
const FORGOT_PASSWORD_TEXT = "Forgot your password? Contact the alumni office. ";

// It does not say which of the two was wrong (AC47).
const WRONG_CREDENTIALS_MESSAGE = "The email or password is not correct.";
const SESSION_ENDED_MESSAGE = "Your session has ended. Log in again.";
const ACCOUNT_CREATED_MESSAGE = "Account created. Log in to continue.";

// What the server answers to a wrong email or password.
const WRONG_CREDENTIALS_STATUS = 401;

type FieldErrors = {
  email: string | null;
  password: string | null;
};

const NO_ERRORS: FieldErrors = { email: null, password: null };

/**
 * True when the sign-up page sent the user here after it made the account but
 * could not log in (SignUpPage navigates with `{ accountCreated: true }`).
 * Router state can be anything, so it is checked.
 */
function cameFromSignUp(state: unknown): boolean {
  return (
    typeof state === "object" &&
    state !== null &&
    (state as { accountCreated?: unknown }).accountCreated === true
  );
}

export default function LoginPage() {
  useDocumentTitle(PAGE_TITLE);

  const logIn = useSetAtom(logInAtom);
  const authNotice = useAtomValue(authNoticeAtom);
  const location = useLocation();

  // Read once, when the page opens.
  const [rememberedEmail] = useState(() => readStored(REMEMBERED_EMAIL_STORAGE_KEY) ?? "");
  const [email, setEmail] = useState(rememberedEmail);
  const [password, setPassword] = useState("");
  const [rememberEmail, setRememberEmail] = useState(rememberedEmail !== "");

  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  const { formError, setFormError, formErrorRef, sending } = useFormError();
  const [busy, setBusy] = useState(false);
  // The notices say why the user is here. They go once a request was sent.
  const [requestSent, setRequestSent] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) {
      return;
    }

    const found: FieldErrors = {
      email: validateEmail(email),
      password: validateLoginPassword(password),
    };
    setErrors(found);
    setFormError(null);
    if (found.email !== null) {
      emailRef.current?.focus();
      return;
    }
    if (found.password !== null) {
      passwordRef.current?.focus();
      return;
    }

    sending.current = true;
    setBusy(true);
    setRequestSent(true);

    // The password goes as typed. The action remembers or forgets the email.
    const result = await logIn({ email: email.trim(), password, rememberEmail });
    if (result.ok) {
      // Nothing more here: the PublicOnly guard sends the user on, and this
      // page may already be gone.
      return;
    }

    sending.current = false;
    setBusy(false);
    const wrongCredentials =
      result.failure.kind === "http" && result.failure.status === WRONG_CREDENTIALS_STATUS;
    setFormError({ text: wrongCredentials ? WRONG_CREDENTIALS_MESSAGE : GENERAL_ERROR_MESSAGE });
  }

  const showSessionEnded = !requestSent && authNotice === "sessionEnded";
  const showAccountCreated = !requestSent && cameFromSignUp(location.state);

  return (
    <AuthLayout headline={HEADLINE} sub={SUB_TEXT}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        {showSessionEnded ? <Message tone="error">{SESSION_ENDED_MESSAGE}</Message> : null}
        {showAccountCreated ? <Message tone="success">{ACCOUNT_CREATED_MESSAGE}</Message> : null}

        <div className={styles.intro}>
          <h1 className={styles.title}>{PAGE_TITLE}</h1>
          <p className={styles.lead}>{LEAD_TEXT}</p>
        </div>

        {formError !== null ? (
          <Message ref={formErrorRef} tone="error">
            {formError.text}
          </Message>
        ) : null}

        <TextInput
          ref={emailRef}
          label={EMAIL_LABEL}
          type="email"
          name="email"
          autoComplete="email"
          size="lg"
          maxLength={MAX_EMAIL_LENGTH}
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            setErrors((current) => ({ ...current, email: null }));
          }}
        />
        <PasswordInput
          ref={passwordRef}
          label={PASSWORD_LABEL}
          name="password"
          autoComplete="current-password"
          size="lg"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            setErrors((current) => ({ ...current, password: null }));
          }}
        />
        <Checkbox
          label={REMEMBER_LABEL}
          name="rememberEmail"
          checked={rememberEmail}
          onChange={(event) => setRememberEmail(event.target.checked)}
        />
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          busy={busy}
          busyLabel={SUBMIT_BUSY_LABEL}
        >
          {SUBMIT_LABEL}
        </Button>

        <div className={styles.footer}>
          <p>
            {NEW_HERE_TEXT}
            <Link to={PATHS.signup} strong>
              {SIGN_UP_LINK_TEXT}
            </Link>
          </p>
          <p>
            {FORGOT_PASSWORD_TEXT}
            <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
