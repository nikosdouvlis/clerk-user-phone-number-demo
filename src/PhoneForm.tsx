import { useUser } from "@clerk/clerk-react";
import React, { useEffect, useRef, useState } from "react";
import { PhoneNumberResource } from "@clerk/types";
import "./App.css";

enum PhoneFormSteps {
  Add = 0,
  Verify = 1,
  Success = 2,
}

type PhoneFormError = {
  code: string;
  message: string;
};

type PhoneFormFields = {
  phoneNumber: string;
  otp: string;
};

const initState: PhoneFormFields = {
  phoneNumber: "",
  otp: "",
};

export function PhoneForm() {
  const user = useUser();
  const phoneNumberRef = useRef<PhoneNumberResource | null>(null);
  const [step, setStep] = useState(PhoneFormSteps.Add);
  const [error, setError] = useState<PhoneFormError | null>(null);
  const [fields, setFields] = useState<PhoneFormFields>(initState);

  useEffect(() => {
    switch (step) {
      case PhoneFormSteps.Verify:
        return preparePhoneVerification();
    }
  }, [step]);

  const reset = () => {
    clearError();
    phoneNumberRef.current = null;
    setFields(initState);
    setStep(PhoneFormSteps.Add);
  };

  const handleFieldChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const { name, value } = e.target;
    setFields((fields) => ({ ...fields, [name]: value }));
  };

  const nextStep = () => setStep((s) => s + 1);

  const clearError = () => setError(null);

  const handleError = (e: any) => {
    const error = e?.errors[0];
    if (!error) {
      return;
    }
    console.error(error);
    setError({ code: error.code, message: error.message });
  };

  const createPhoneNumber: React.FormEventHandler = async (e) => {
    e.preventDefault();
    clearError();
    try {
      phoneNumberRef.current = await user.createPhoneNumber(fields.phoneNumber);
      nextStep();
    } catch (error) {
      handleError(error);
    }
  };

  const preparePhoneVerification = () => {
    if (!phoneNumberRef.current) {
      return;
    }
    phoneNumberRef.current?.prepareVerification();
  };

  const verifyPhone: React.FormEventHandler = async (e) => {
    e.preventDefault();
    clearError();
    if (!phoneNumberRef.current) {
      return;
    }

    try {
      const res = await phoneNumberRef.current.attemptVerification(fields.otp);
      if (res.verification.status === "verified") {
        nextStep();
      }
    } catch (error) {
      handleError(error);
    }
  };

  const deleteAll = async () => {
    await Promise.all(user.phoneNumbers.map((pn) => pn.destroy()));
    console.log("User phone numbers deleted");
    reset();
  };

  const stepContent: Record<PhoneFormSteps, JSX.Element> = {
    [PhoneFormSteps.Add]: (
      <div>
        <h1>Step 1 - Enter your phone number</h1>
        <form onSubmit={createPhoneNumber}>
          <label htmlFor="phoneNumber">Phone number</label>
          <input
            type="tel"
            name="phoneNumber"
            id="phoneNumber"
            value={fields.phoneNumber}
            onChange={handleFieldChange}
          />
          <input type="submit" />
        </form>
      </div>
    ),
    [PhoneFormSteps.Verify]: (
      <div>
        <h1>Step 2 - Verify phone</h1>
        <form onSubmit={verifyPhone}>
          <label htmlFor="otp">OTP</label>
          <input
            type="text"
            name="otp"
            id="otp"
            pattern="[0-9]{6}"
            value={fields.otp}
            onChange={handleFieldChange}
          />
          <input type="submit" />
        </form>
      </div>
    ),
    [PhoneFormSteps.Success]: (
      <div>
        <h1>Success!</h1>
        <button onClick={reset}>Add phone</button>
      </div>
    ),
  };

  return (
    <div>
      {!!error && (
        <div className="error">
          An error occurred. Open the console for the complete object.
          <pre>{JSON.stringify(error)}</pre>
        </div>
      )}

      {stepContent[step]}

      <div>
        <h2>User phone numbers:</h2>
        <pre>{JSON.stringify(user.phoneNumbers, null, 2)}</pre>
        <button onClick={deleteAll} disabled={!user.phoneNumbers.length}>
          Delete all phone numbers
        </button>
      </div>
    </div>
  );
}
