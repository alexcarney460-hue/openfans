"use client";

import { useState } from "react";
import { SubscribeButton } from "@/components/SubscribeButton";
import { SubscribeModal } from "@/components/SubscribeModal";

interface CreatorSubscribeSectionProps {
  readonly creatorName: string;
  readonly creatorUsername: string;
  readonly subscriptionPrice: number;
}

export function CreatorSubscribeSection({
  creatorName,
  creatorUsername,
  subscriptionPrice,
}: CreatorSubscribeSectionProps) {
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  return (
    <>
      <SubscribeButton
        price={subscriptionPrice}
        size="default"
        onSubscribe={() => setShowSubscribeModal(true)}
      />
      <SubscribeModal
        isOpen={showSubscribeModal}
        onClose={() => setShowSubscribeModal(false)}
        creatorName={creatorName}
        creatorUsername={creatorUsername}
        price={subscriptionPrice}
      />
    </>
  );
}
