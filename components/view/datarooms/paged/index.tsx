import React, { useEffect, useRef, useState } from "react";
import AccessForm, { DEFAULT_ACCESS_FORM_DATA, DEFAULT_ACCESS_FORM_TYPE } from "@/components/view/access-form";
import { usePlausible } from "next-plausible";
import { toast } from "sonner";
import LoadingSpinner from "../../../ui/loading-spinner";
import EmailVerificationMessage from "../../email-verification-form";
import { Dataroom } from "@prisma/client";
import ViewSinglePagedDataroom from "./view-single-paged-dataroom";

export type DEFAULT_DATAROOM_VIEW_TYPE = {
  viewId: string;
};

export default function DataroomSinglePageView({
  dataroom,
  userEmail,
  isProtected,
  authenticationCode
}: {
  dataroom: Dataroom;
  authenticationCode: string | undefined;
  userEmail: string | null | undefined;
  isProtected: boolean;
}) {
  const {
    id: dataroomId,
    emailProtected,
    password: dataroomPassword,
  } = dataroom;

  const plausible = usePlausible();

  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(false);
  const [verificationRequested, setVerificationRequested] = useState<boolean>(false);
  const didMount = useRef<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewData, setViewData] = useState<DEFAULT_DATAROOM_VIEW_TYPE>({
    viewId: "",
  });
  const [data, setData] = useState<DEFAULT_ACCESS_FORM_TYPE>(
    DEFAULT_ACCESS_FORM_DATA
  );

  const handleSubmission = async (): Promise<void> => {
    setIsLoading(true);
    const response = await fetch("/api/datarooms/paged/views", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        email: data.email || userEmail,
        dataroomId: dataroomId
      }),
    });

    if (response.ok) {
      const { viewId } =
        (await response.json()) as DEFAULT_DATAROOM_VIEW_TYPE;
      plausible("dataroomViewed"); // track the event
      setViewData({ viewId });
      setSubmitted(true);
      setIsLoading(false);
    } else {
      const { message } = await response.json();
      toast.error(message);
      setIsLoading(false);
    }
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event: React.FormEvent
  ): Promise<void> => {
    event.preventDefault();
    await handleEmailVerification();
  };

  // If link is not submitted and does not have email / password protection, show the access form
  useEffect(() => {
    if (!didMount.current) {
      if (!submitted && !isProtected) {
        handleSubmission();
      }
      didMount.current = true;
    }
  }, [submitted, isProtected]);

  //Generates verification link from backend
  const handleEmailVerification = async () => {
    setIsLoading(true);
    const URL = `/api/verification/email_authcode`;
    const response = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ identifier: dataroomId, type: "DATAROOM", email: data.email })
    });
    if (response.ok) {
      setVerificationRequested(true);
      setIsLoading(false);
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  }

  //Verifies authentication code
  const handleAuthCodeVerification = async () => {
    setIsLoading(true);
    const URL = `/api/verification/email_authcode?authenticationCode=${authenticationCode}`;
    const response = await fetch(URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });
    if (response.ok) {
      setIsEmailVerified(true);
      setVerificationRequested(false);
      await handleSubmission();
      return true;
    } else {
      setIsLoading(false);
      return false;
    }
  }

  //If URL contains authenticationCode
  //P.S: We can create separate component for links with authentication code
  if (authenticationCode) {
    useEffect(() => {
      (async () => {
        setIsLoading(true);
        await handleAuthCodeVerification();
      })();
    }, [])

    //Component to render if Loading
    if (isLoading) {
      return (
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="mr-1 h-20 w-20" />
        </div>
      )
    }

    //Component to render when verification code is invalid
    if (!isEmailVerified) {
      return (
        <div className="flex h-screen flex-1 flex-col  px-6 py-12 lg:px-8 bg-black">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-10 text-2xl font-bold leading-9 tracking-tight text-white">
              Unauthorized access
            </h2>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-gray-950">
        <ViewSinglePagedDataroom dataroom={dataroom}/>
      </div>
    );
  }

  //Component to render when email is submitted but verification is pending
  if (verificationRequested) {
    return (
      <EmailVerificationMessage
        onSubmitHandler={handleSubmit}
        data={data}
        isLoading={isLoading}
      />
    )
  }

  if ((!submitted && emailProtected) || (!submitted && dataroomPassword)) {

    // If link is not submitted and does not have email / password protection, show the access form
    if (!submitted && isProtected) {
      console.log("calling access form");
      return (
        <AccessForm
          data={data}
          email={userEmail}
          setData={setData}
          onSubmitHandler={handleSubmit}
          requireEmail={emailProtected}
          requirePassword={!!dataroomPassword}
          isLoading={isLoading}
        />
      );
    }

    if (isLoading) {
      console.log("loading");
      return (
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner className="h-20 w-20" />
        </div>
      );
    }
    return (
      <div className="bg-gray-950">
        {submitted ? (
          <ViewSinglePagedDataroom dataroom={dataroom}/>
        ) : (
          <div className="h-screen flex items-center justify-center">
            <LoadingSpinner className="h-20 w-20" />
          </div>
        )}
      </div>
    );
  }
}