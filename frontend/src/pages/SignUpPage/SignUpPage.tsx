import { useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { SignUpUserDTO } from "@alumni/shared";
import { AuthLayout } from "../../components/auth/AuthLayout/AuthLayout";
import { Button } from "../../components/ui/Button/Button";
import { Link } from "../../components/ui/Link/Link";
import { Message } from "../../components/ui/Message/Message";
import { PasswordInput } from "../../components/ui/PasswordInput/PasswordInput";
import { RadioCards } from "../../components/ui/RadioCards/RadioCards";
import type { RadioCardOption } from "../../components/ui/RadioCards/RadioCards";
import { TextInput } from "../../components/ui/TextInput/TextInput";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import {
  validateEmail,
  validateName,
  validateNewPassword,
  validatePhotoLink,
} from "../../lib/validation";
import { PATHS } from "../../routes/paths";
import { signUpAtom } from "../../store/sessionActions";
import { showToastAtom } from "../../store/toastAtoms";
import styles from "./SignUpPage.module.css";

const PAGE_TITLE = "Create an account";
const HEADLINE = "Join your alumni network.";
const SUB_TEXT =
  "Students can look up graduates and ask for advice. Alumni can share news and offer mentoring.";

const NAME_LABEL = "Full name";
const EMAIL_LABEL = "Email";
const PASSWORD_LABEL = "Password";
const PASSWORD_HELP = "At least 8 characters.";
const ROLE_LEGEND = "I am a";
const PHOTO_LABEL = "Photo link";
const OPTIONAL_NOTE = "(optional)";
const PHOTO_PLACEHOLDER = "https://";
const SUBMIT_LABEL = "Create account";
const SUBMIT_BUSY_LABEL = "Creating account…";

const HAVE_ACCOUNT_TEXT = "Already have an account? ";
const LOG_IN_LINK_TEXT = "Log in";

const EMAIL_TAKEN_MESSAGE = "This email is already registered.";
const GENERAL_ERROR_MESSAGE = "Something went wrong. Try again.";
const ACCOUNT_CREATED_TOAST = "Account created";

// What the server answers when the email is already registered.
const EMAIL_TAKEN_STATUS = 409;

// The same length as the "User" columns (varchar(100)).
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 100;

type SignUpRole = SignUpUserDTO["role"];

// "Graduate" is saved as the role "alumni" (ADR-01). Admin is not a choice.
const ROLE_OPTIONS: RadioCardOption<SignUpRole>[] = [
  { value: "student", label: "Student" },
  { value: "alumni", label: "Graduate" },
];
const FIRST_ROLE: SignUpRole = "student";
const ROLE_GROUP_NAME = "role";

type FieldName = "name" | "email" | "password" | "photo";
type FieldErrors = Record<FieldName, string | null>;

const NO_ERRORS: FieldErrors = { name: null, email: null, password: null, photo: null };
// The order of the fields on the page: focus goes to the first one with an error.
const FIELD_ORDER: readonly FieldName[] = ["name", "email", "password", "photo"];

export default function SignUpPage() {
  useDocumentTitle(PAGE_TITLE);

  const signUp = useSetAtom(signUpAtom);
  const showToast = useSetAtom(showToastAtom);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignUpRole>(FIRST_ROLE);
  const [photo, setPhoto] = useState("");

  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  // A new object for every failed request, so focus moves to the message each time.
  const [formError, setFormError] = useState<{ text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Set in the same tick as the submit, so a second submit cannot slip in
  // before the busy state is drawn.
  const sending = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);

  const fieldRefs = { name: nameRef, email: emailRef, password: passwordRef, photo: photoRef };

  useEffect(() => {
    if (formError !== null) {
      formErrorRef.current?.focus();
    }
  }, [formError]);

  function clearError(field: FieldName) {
    setErrors((current) => (current[field] === null ? current : { ...current, [field]: null }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending.current) {
      return;
    }

    const found: FieldErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validateNewPassword(password),
      photo: validatePhotoLink(photo),
    };
    setErrors(found);
    setFormError(null);
    const firstWrong = FIELD_ORDER.find((field) => found[field] !== null);
    if (firstWrong !== undefined) {
      fieldRefs[firstWrong].current?.focus();
      return;
    }

    // The password goes as typed. An empty photo link is not sent at all.
    const photoLink = photo.trim();
    const input: SignUpUserDTO = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      ...(photoLink === "" ? {} : { photo_url: photoLink }),
    };

    sending.current = true;
    setBusy(true);

    const result = await signUp(input);
    if (result.ok && result.loggedIn) {
      // The PublicOnly guard sends the user on to the Dashboard; this page
      // may already be gone, so it sets no state of its own.
      showToast(ACCOUNT_CREATED_TOAST);
      return;
    }
    if (result.ok) {
      // The account exists but the log in failed, so there is no session and
      // no guard will move the user: the one navigation a page does itself.
      // LoginPage reads this state and shows "Account created. Log in to continue."
      navigate(PATHS.login, { replace: true, state: { accountCreated: true } });
      return;
    }

    sending.current = false;
    setBusy(false);
    if (result.failure.kind === "http" && result.failure.status === EMAIL_TAKEN_STATUS) {
      setErrors((current) => ({ ...current, email: EMAIL_TAKEN_MESSAGE }));
      emailRef.current?.focus();
      return;
    }
    setFormError({ text: GENERAL_ERROR_MESSAGE });
  }

  return (
    <AuthLayout headline={HEADLINE} sub={SUB_TEXT}>
      <form className={styles.form} noValidate onSubmit={handleSubmit}>
        <h1 className={styles.title}>{PAGE_TITLE}</h1>

        {formError !== null ? (
          <Message ref={formErrorRef} tone="error">
            {formError.text}
          </Message>
        ) : null}

        <TextInput
          ref={nameRef}
          label={NAME_LABEL}
          name="name"
          autoComplete="name"
          size="lg"
          maxLength={MAX_NAME_LENGTH}
          value={name}
          error={errors.name}
          onChange={(event) => {
            setName(event.target.value);
            clearError("name");
          }}
        />
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
            clearError("email");
          }}
        />
        <PasswordInput
          ref={passwordRef}
          label={PASSWORD_LABEL}
          name="password"
          autoComplete="new-password"
          size="lg"
          help={PASSWORD_HELP}
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError("password");
          }}
        />
        <RadioCards
          legend={ROLE_LEGEND}
          name={ROLE_GROUP_NAME}
          options={ROLE_OPTIONS}
          value={role}
          onChange={setRole}
        />
        <TextInput
          ref={photoRef}
          label={PHOTO_LABEL}
          optionalNote={OPTIONAL_NOTE}
          type="url"
          name="photo_url"
          size="lg"
          placeholder={PHOTO_PLACEHOLDER}
          value={photo}
          error={errors.photo}
          onChange={(event) => {
            setPhoto(event.target.value);
            clearError("photo");
          }}
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
            {HAVE_ACCOUNT_TEXT}
            <Link to={PATHS.login} strong>
              {LOG_IN_LINK_TEXT}
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
