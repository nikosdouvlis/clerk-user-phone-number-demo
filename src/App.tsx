import React from "react";
import { ClerkProvider, SignedIn, SignedOut, SignIn } from "@clerk/clerk-react";
import { PhoneForm } from "./PhoneForm";

function App() {
  return (
    <ClerkProvider frontendApi="clerk.t68m2.h0z44.lcl.dev">
      <SignedIn>
        <PhoneForm />
      </SignedIn>
      <SignedOut>
        <SignIn />
      </SignedOut>
    </ClerkProvider>
  );
}

export default App;
