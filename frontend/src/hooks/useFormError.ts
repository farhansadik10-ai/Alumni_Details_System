import { useEffect, useRef, useState } from "react";
import type { MutableRefObject, RefObject } from "react";

export type FormError = { text: string };

export type FormErrorState = {
  formError: FormError | null;
  setFormError: (error: FormError | null) => void;
  // Goes on the <Message> that shows the error.
  formErrorRef: RefObject<HTMLDivElement>;
  // Set in the same tick as the submit, so a second submit cannot slip in
  // before the busy state is drawn.
  sending: MutableRefObject<boolean>;
};

/**
 * What the two auth forms share: the message above the fields and the guard
 * against a second submit. Focus moves to the message each time one is set.
 */
export function useFormError(): FormErrorState {
  // A new object for every failed request, so focus moves to the message each time.
  const [formError, setFormError] = useState<FormError | null>(null);
  const sending = useRef(false);
  const formErrorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (formError !== null) {
      formErrorRef.current?.focus();
    }
  }, [formError]);

  return { formError, setFormError, formErrorRef, sending };
}
